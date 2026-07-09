//! Screenshot storage paths under the host app data directory.

use std::path::PathBuf;

use tauri::{AppHandle, Manager, Runtime};

pub const SCREENSHOTS_DIR_NAME: &str = "visual-editor/screenshots";

/// Resolve `<app_data>/visual-editor/screenshots/`.
pub fn screenshots_dir<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| e.to_string())
        .map(|dir| dir.join(SCREENSHOTS_DIR_NAME))
}

/// Open the screenshots directory in the system file manager.
pub fn open_screenshots_folder<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let dir = screenshots_dir(app)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    open::that(&dir).map_err(|e| format!("open folder failed: {e}"))
}
