use image::GenericImageView; // For dimensions
use sha2::{Digest, Sha256};

use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager, Runtime};

#[derive(serde::Serialize)]
pub struct AssetMetadata {
    hash: String,
    path: String, // Absolute path for now, or relative to asset dir
    filename: String,
    mime_type: String,
    size_bytes: u64,
    width: Option<u32>,
    height: Option<u32>,
}

#[tauri::command]
pub async fn process_asset<R: Runtime>(
    app: AppHandle<R>,
    file_path: String,
) -> Result<AssetMetadata, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let content = fs::read(path).map_err(|e| e.to_string())?;

    let mut hasher = Sha256::new();
    hasher.update(&content);
    let hash_result = hasher.finalize();
    let hash_string = hex::encode(hash_result);

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let assets_dir = app_data_dir.join("assets");
    if !assets_dir.exists() {
        fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    }

    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("bin")
        .to_lowercase();

    let is_image = ["jpg", "jpeg", "png", "webp"].contains(&ext.as_str());

    if is_image {
        let target_filename = format!("{}.webp", hash_string);
        let target_path = assets_dir.join(&target_filename);

        if target_path.exists() {
            return Ok(AssetMetadata {
                hash: hash_string,
                path: target_path.to_string_lossy().to_string(),
                filename: target_filename,
                mime_type: "image/webp".to_string(),
                size_bytes: fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0),
                width: None, 
                height: None,
            });
        }

        let img = image::load_from_memory(&content)
            .map_err(|e| format!("Failed to load image: {}", e))?;
        let (w, h) = img.dimensions();

        let (new_w, new_h) = if w > 1920 {
            let ratio = 1920.0 / w as f32;
            (1920, (h as f32 * ratio) as u32)
        } else {
            (w, h)
        };

        let final_img = if w > 1920 {
            img.resize(new_w, new_h, image::imageops::FilterType::Lanczos3)
        } else {
            img
        };

        let file = fs::File::create(&target_path).map_err(|e| e.to_string())?;
        let mut writer = std::io::BufWriter::new(file);
        final_img
            .write_to(&mut writer, image::ImageFormat::WebP)
            .map_err(|e| format!("Failed to save WebP: {}", e))?;

        let size = fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0);

        Ok(AssetMetadata {
            hash: hash_string,
            path: target_path.to_string_lossy().to_string(),
            filename: target_filename,
            mime_type: "image/webp".to_string(),
            size_bytes: size,
            width: Some(new_w),
            height: Some(new_h),
        })
    } else {
        let target_filename = format!("{}.{}", hash_string, ext);
        let target_path = assets_dir.join(&target_filename);

        if !target_path.exists() {
            fs::write(&target_path, &content).map_err(|e| e.to_string())?;
        }

        let size = fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0);
        let mime = mime_guess::from_path(path)
            .first_or_octet_stream()
            .to_string();

        Ok(AssetMetadata {
            hash: hash_string,
            path: target_path.to_string_lossy().to_string(),
            filename: target_filename,
            mime_type: mime,
            size_bytes: size,
            width: None,
            height: None,
        })
    }
}
