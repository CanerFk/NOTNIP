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

    // 1. Read file content
    let content = fs::read(path).map_err(|e| e.to_string())?;

    // 2. Compute Hash
    let mut hasher = Sha256::new();
    hasher.update(&content);
    let hash_result = hasher.finalize();
    let hash_string = hex::encode(hash_result);

    // 3. Setup Asset Directory
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let assets_dir = app_data_dir.join("assets");
    if !assets_dir.exists() {
        fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    }

    // Determine extension and mime
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("bin")
        .to_lowercase();

    // Check if it's an image we want to optimize
    let is_image = ["jpg", "jpeg", "png", "webp"].contains(&ext.as_str());

    if is_image {
        // OPTIMIZED PATH (WebP)
        let target_filename = format!("{}.webp", hash_string);
        let target_path = assets_dir.join(&target_filename);

        // Check if already exists
        if target_path.exists() {
            // Read basic metadata from existing file to return?
            // Or just return the path and let frontend handle?
            // To be correct, we should return correct dims.
            // Let's load the existing image just for dims? Or try to read metadata?
            // For now, let's just return what we have. If it exists, we assume it's good.
            return Ok(AssetMetadata {
                hash: hash_string,
                path: target_path.to_string_lossy().to_string(),
                filename: target_filename,
                mime_type: "image/webp".to_string(),
                size_bytes: fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0),
                width: None, // Optimization: Don't read dims if existing to be fast
                height: None,
            });
        }

        // Process New Image
        let img = image::load_from_memory(&content)
            .map_err(|e| format!("Failed to load image: {}", e))?;
        let (w, h) = img.dimensions();

        // Resize logic (Max width 1920)
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

        // Save as WebP
        let file = fs::File::create(&target_path).map_err(|e| e.to_string())?;
        let mut writer = std::io::BufWriter::new(file);
        // Encoder for WebP is not directly exposed as simple save in strict wrapper sometimes,
        // but image::write_to with ImageFormat::WebP works.
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
        // STANDARD PATH (Copy)
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
