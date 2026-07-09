//! Embedded inspector UI assets served at `tauri://visual-editor/`.

use rust_embed::Embed;

#[derive(Embed)]
#[folder = "inspector-dist/"]
pub struct InspectorAssets;

pub fn resolve_asset_path(request_path: &str) -> String {
    let path = request_path.trim_start_matches('/');
    if path.is_empty() || path == "/" {
        return "index.html".into();
    }
    path.to_string()
}

pub fn guess_mime(path: &str) -> &'static str {
    mime_guess::from_path(path)
        .first_raw()
        .unwrap_or("application/octet-stream")
}
