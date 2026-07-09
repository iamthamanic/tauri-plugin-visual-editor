//! Serializable hub snapshot for `getState` hydration and push events.

use serde::{Deserialize, Serialize};
use tauri_plugin_visual_editor_core::types::{InspectionTarget, Session, WebViewRegistration};

/// Push/hydration payload — single source of truth from the inspector hub.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct HubSnapshot {
    pub enabled: bool,
    pub inspector_window_open: bool,
    pub session: Session,
    pub webviews: Vec<WebViewRegistration>,
    pub active_target: Option<InspectionTarget>,
}
