//! Runtime plugin configuration from `tauri.conf.json`.

use serde::Deserialize;
use tauri::{AppHandle, Runtime};

/// Host-facing visual editor plugin configuration.
#[derive(Debug, Clone, Deserialize, Default, serde::Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct VisualEditorConfig {
    pub enabled: bool,
    pub allow: bool,
    pub allow_in_production: bool,
}

/// Load plugin config from the host app configuration (`visualEditor` or `visual-editor` key).
pub fn from_app<R: Runtime>(app: &AppHandle<R>) -> VisualEditorConfig {
    let plugins = &app.config().plugins.0;
    for key in ["visualEditor", "visual-editor"] {
        if let Some(value) = plugins.get(key) {
            if let Ok(config) = serde_json::from_value(value.clone()) {
                return config;
            }
        }
    }
    VisualEditorConfig::default()
}
