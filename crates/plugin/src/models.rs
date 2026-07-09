//! Serializable hub snapshot and command option types.

use serde::{Deserialize, Serialize};
use tauri_plugin_visual_editor_core::types::{InspectionTarget, Session, WebViewRegistration};

use crate::settings::PersistentSettings;

/// Point-in-time inspector hub state pushed to clients.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HubSnapshot {
    pub enabled: bool,
    pub inspector_window_open: bool,
    pub session: Session,
    pub webviews: Vec<WebViewRegistration>,
    pub active_target: Option<InspectionTarget>,
    pub settings: PersistentSettings,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct OpenOptions {
    #[serde(default)]
    pub auto_enable: bool,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct BoundsDto {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub struct CaptureOptions {
    #[serde(default = "default_capture_mode")]
    pub mode: String,
    pub webview_id: Option<String>,
    pub device_pixel_ratio: Option<f64>,
    pub css_bounds: Option<BoundsDto>,
    pub region_bounds: Option<BoundsDto>,
    pub crop_padding_css: Option<u32>,
    pub viewport_size_css: Option<(u32, u32)>,
}

fn default_capture_mode() -> String {
    "webview".into()
}
