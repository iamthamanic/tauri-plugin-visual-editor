//! Runtime plugin configuration from `tauri.conf.json`.

use serde::Deserialize;
use tauri::{AppHandle, Runtime};

/// Where the inspector toolbar is rendered.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum OverlayMode {
    /// Injected DOM toolbar in each host webview (default — no host UI code required).
    #[default]
    Embedded,
    /// Separate frameless Tauri window (`visual-inspector` label).
    Window,
}

/// Host-facing visual editor plugin configuration.
#[derive(Debug, Clone, Deserialize, Default, serde::Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct VisualEditorConfig {
    pub enabled: bool,
    pub allow: bool,
    pub allow_in_production: bool,
    /// Open overlay automatically when the first host webview is ready.
    #[serde(default = "default_auto_open")]
    pub auto_open: bool,
    /// Delay before auto-opening the overlay (ms). Lets the host UI paint first. `0` = immediate.
    #[serde(default = "default_overlay_defer_ms")]
    pub overlay_defer_ms: u64,
    #[serde(default)]
    pub overlay_mode: OverlayMode,
    #[serde(default)]
    pub project_root: Option<String>,
}

fn default_auto_open() -> bool {
    true
}

fn default_overlay_defer_ms() -> u64 {
    100
}

impl VisualEditorConfig {
    pub fn uses_window_overlay(&self) -> bool {
        self.overlay_mode == OverlayMode::Window
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn auto_open_defaults_true() {
        let config: VisualEditorConfig =
            serde_json::from_str(r#"{"enabled":true,"allow":true}"#).unwrap();
        assert!(config.auto_open);
    }

    #[test]
    fn auto_open_can_be_disabled() {
        let config: VisualEditorConfig =
            serde_json::from_str(r#"{"enabled":true,"allow":true,"autoOpen":false}"#).unwrap();
        assert!(!config.auto_open);
    }
}
