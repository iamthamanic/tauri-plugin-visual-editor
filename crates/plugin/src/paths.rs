//! Screenshot storage paths resolved from persistent settings.

use std::path::PathBuf;

use tauri::{AppHandle, Runtime};

use crate::config::VisualEditorConfig;
use crate::settings::{resolve_screenshots_dir, PersistentSettings};

pub const SCREENSHOTS_DIR_NAME: &str = "visual-editor/screenshots";

/// Resolve screenshot directory from settings and host config.
pub fn screenshots_dir<R: Runtime>(
    app: &AppHandle<R>,
    settings: &PersistentSettings,
    config: &VisualEditorConfig,
) -> Result<PathBuf, String> {
    resolve_screenshots_dir(app, settings, config)
}

/// Open the screenshots directory in the system file manager.
pub fn open_screenshots_folder<R: Runtime>(
    app: &AppHandle<R>,
    settings: &PersistentSettings,
    config: &VisualEditorConfig,
) -> Result<(), String> {
    let dir = screenshots_dir(app, settings, config)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    open::that(&dir).map_err(|e| format!("open folder failed: {e}"))
}
