# Notnip Setup Guide

This guide describes how to set up the Notnip project from scratch using Tauri v2, React, and TypeScript.

## Prerequisites

- **Node.js**: Ensure Node.js is installed.
- **Rust**: Ensure Rust is installed (`rustc --version`).
- **Build Tools**: Visual Studio C++ Build Tools (for Windows) or XCode Command Line Tools (macOS).

## Setup Commands

Run the following command to initialize the project:

```bash
npx create-tauri-app@latest notnip --template react-ts --manager npm
```

If you want to initialize it in the current directory:

```bash
npx create-tauri-app@latest . --template react-ts --manager npm
```

## Post-Setup

After initialization, run:

```bash
npm install
npm run tauri dev
```

## Dependencies to Install

We will need additional packages for the editor and styling:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder lucide-react clsx tailwind-merge
```
