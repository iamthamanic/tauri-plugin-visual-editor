//! Serializable hub snapshot and command option types.

use serde::{Deserialize, Serialize};
use tauri_plugin_visual_editor_core::types::{InspectionTarget, Session, WebViewRegistration};

/// Point-in-time inspector hub state pushed to clients.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HubSnapshot {
    pub enabled: bool,
    pub inspector_window_open: bool,
    pub session: Session,
    pub webviews: Vec<WebViewRegistration>,
    pub active_target: Option<InspectionTarget>,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct OpenOptions {
    #[serde(default)]
    pub auto_enable: bool,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub struct CaptureOptions {
    #[serde(default = "default_capture_mode")]
    pub mode: String,
}

fn default_capture_mode() -> String {
    "webview".into()
}
