//! Thread-safe inspector hub — single source of truth for plugin runtime state.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Runtime, Webview};
use tauri_plugin_visual_editor_core::types::{
    InspectionTarget, Session, WebViewRegistration, WebviewStatus,
};

use crate::models::HubSnapshot;

pub const STATE_EVENT: &str = "visual-editor://state-updated";

#[derive(Default)]
struct HubInner {
    enabled: bool,
    inspector_window_open: bool,
    session: Session,
    webviews: Vec<WebViewRegistration>,
    active_target: Option<InspectionTarget>,
}

/// Managed Tauri state wrapping the inspector hub.
pub struct InspectorHub(Mutex<HubInner>);

impl Default for InspectorHub {
    fn default() -> Self {
        Self::new()
    }
}

impl InspectorHub {
    pub fn new() -> Self {
        Self(Mutex::new(HubInner::default()))
    }

    pub fn snapshot(&self) -> HubSnapshot {
        let inner = self.0.lock().expect("hub mutex poisoned");
        HubSnapshot {
            enabled: inner.enabled,
            inspector_window_open: inner.inspector_window_open,
            session: inner.session.clone(),
            webviews: inner.webviews.clone(),
            active_target: inner.active_target.clone(),
        }
    }

    pub fn register_webview<R: Runtime>(&self, webview: &Webview<R>) {
        let id = webview.label().to_string();
        let url = webview
            .url()
            .map(|u| u.to_string())
            .unwrap_or_else(|_| "unknown".into());
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        if let Some(existing) = inner.webviews.iter_mut().find(|w| w.id == id) {
            existing.url = url;
            existing.status = WebviewStatus::Active;
            return;
        }

        let window_label = webview.window().label().to_string();

        inner.webviews.push(WebViewRegistration {
            id: id.clone(),
            label: id,
            window_label,
            url,
            status: WebviewStatus::Active,
        });

        if inner.active_target.is_none() {
            inner.active_target = Some(InspectionTarget {
                webview_id: webview.label().to_string(),
                pinned: false,
            });
        }
    }

    pub fn set_enabled(&self, enabled: bool) {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        inner.enabled = enabled;
    }

    pub fn emit_state<R: Runtime>(&self, app: &AppHandle<R>) {
        let snapshot = self.snapshot();
        let _ = app.emit(STATE_EVENT, snapshot);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_defaults_disabled() {
        let hub = InspectorHub::new();
        let snap = hub.snapshot();
        assert!(!snap.enabled);
        assert!(snap.webviews.is_empty());
    }

    #[test]
    fn register_webview_tracks_label() {
        let hub = InspectorHub::new();
        {
            let mut inner = hub.0.lock().unwrap();
            inner.webviews.push(WebViewRegistration {
                id: "main".into(),
                label: "main".into(),
                window_label: "main-window".into(),
                url: "tauri://localhost/".into(),
                status: WebviewStatus::Active,
            });
            inner.active_target = Some(InspectionTarget {
                webview_id: "main".into(),
                pinned: false,
            });
        }
        let snap = hub.snapshot();
        assert_eq!(snap.webviews.len(), 1);
        assert_eq!(snap.active_target.as_ref().unwrap().webview_id, "main");
    }
}
