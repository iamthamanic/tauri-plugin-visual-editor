//! Thread-safe inspector hub — single source of truth for plugin runtime state.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Runtime, Webview};
use tauri_plugin_visual_editor_core::{
    bundle::{export_context_bundle, BundleTarget},
    types::{InspectionTarget, Session, WebViewRegistration, WebviewStatus},
};

use crate::models::HubSnapshot;

pub const STATE_EVENT: &str = "visual-editor://state-updated";
#[allow(dead_code)]
pub const INSPECTOR_WINDOW_LABEL: &str = "visual-inspector";

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

    pub fn is_enabled(&self) -> bool {
        self.0.lock().expect("hub mutex poisoned").enabled
    }

    pub fn open(&self, auto_enable: bool) {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        if auto_enable {
            inner.enabled = true;
        }
        inner.inspector_window_open = true;
    }

    pub fn close(&self) {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        inner.inspector_window_open = false;
    }

    pub fn toggle_window(&self) -> bool {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        inner.inspector_window_open = !inner.inspector_window_open;
        inner.inspector_window_open
    }

    pub fn clear_session(&self) {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        inner.session = Session::default();
    }

    pub fn set_target_webview(&self, webview_id: &str) -> Result<(), String> {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        if !inner.webviews.iter().any(|w| w.id == webview_id) {
            return Err(format!("Unknown webview: {webview_id}"));
        }
        let pinned = inner
            .active_target
            .as_ref()
            .map(|t| t.pinned)
            .unwrap_or(false);
        inner.active_target = Some(InspectionTarget {
            webview_id: webview_id.to_string(),
            pinned,
        });
        Ok(())
    }

    pub fn pin_target(&self, webview_id: &str) -> Result<(), String> {
        self.set_target_webview(webview_id)?;
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        if let Some(target) = inner.active_target.as_mut() {
            target.pinned = true;
        }
        Ok(())
    }

    pub fn unpin_target(&self) {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        if let Some(target) = inner.active_target.as_mut() {
            target.pinned = false;
        }
    }

    pub fn export_context(&self, captured_at: &str) -> String {
        let inner = self.0.lock().expect("hub mutex poisoned");
        let (window_label, webview_label, url) = target_labels(&inner);
        export_context_bundle(
            &BundleTarget {
                window_label,
                webview_label,
                url,
                captured_at: captured_at.to_string(),
            },
            &inner.session,
            None,
        )
    }

    pub fn record_capture(&self, capture: tauri_plugin_visual_editor_core::types::Capture) {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        inner.session.add_capture(capture);
    }

    pub fn revalidate(&self) -> usize {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        let mut updated = 0usize;
        for element in &mut inner.session.selected_elements {
            if element.status
                == tauri_plugin_visual_editor_core::types::ElementStatus::StaleAfterReload
            {
                element.status = tauri_plugin_visual_editor_core::types::ElementStatus::Valid;
                updated += 1;
            }
        }
        updated
    }

    pub fn mark_selections_stale_for_webview(&self, webview_id: &str) {
        let mut inner = self.0.lock().expect("hub mutex poisoned");
        for element in &mut inner.session.selected_elements {
            if element.snapshot.webview_id == webview_id {
                element.status =
                    tauri_plugin_visual_editor_core::types::ElementStatus::StaleAfterReload;
            }
        }
    }

    pub fn primary_capture_path(&self) -> Option<String> {
        let inner = self.0.lock().expect("hub mutex poisoned");
        inner
            .session
            .primary_capture()
            .map(|capture| capture.path.clone())
    }

    pub fn capture_path(&self, capture_id: &str) -> Option<String> {
        let inner = self.0.lock().expect("hub mutex poisoned");
        inner
            .session
            .captures
            .iter()
            .find(|c| c.id == capture_id)
            .map(|c| c.path.clone())
    }

    pub fn emit_state<R: Runtime>(&self, app: &AppHandle<R>) {
        let snapshot = self.snapshot();
        let _ = app.emit(STATE_EVENT, snapshot);
    }
}

fn target_labels(inner: &HubInner) -> (String, String, String) {
    if let Some(target) = &inner.active_target {
        if let Some(webview) = inner.webviews.iter().find(|w| w.id == target.webview_id) {
            return (
                webview.window_label.clone(),
                webview.label.clone(),
                webview.url.clone(),
            );
        }
    }
    if let Some(webview) = inner.webviews.first() {
        return (
            webview.window_label.clone(),
            webview.label.clone(),
            webview.url.clone(),
        );
    }
    ("main".into(), "main".into(), "tauri://localhost/".into())
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
        seed_webview(&hub, "main", "main-window");
        let snap = hub.snapshot();
        assert_eq!(snap.webviews.len(), 1);
        assert_eq!(snap.active_target.as_ref().unwrap().webview_id, "main");
    }

    #[test]
    fn open_default_does_not_enable() {
        let hub = InspectorHub::new();
        hub.open(false);
        let snap = hub.snapshot();
        assert!(!snap.enabled);
        assert!(snap.inspector_window_open);
    }

    #[test]
    fn open_with_auto_enable_enables() {
        let hub = InspectorHub::new();
        hub.open(true);
        let snap = hub.snapshot();
        assert!(snap.enabled);
        assert!(snap.inspector_window_open);
    }

    #[test]
    fn disable_preserves_session() {
        let hub = InspectorHub::new();
        {
            let mut inner = hub.0.lock().unwrap();
            inner.session.selected_elements.push(
                tauri_plugin_visual_editor_core::types::SelectedElement {
                    id: "el-1".into(),
                    snapshot: tauri_plugin_visual_editor_core::types::ElementSnapshot {
                        webview_id: "main".into(),
                        tag: "button".into(),
                        text: None,
                        attributes: vec![],
                        dom_path: "body>button".into(),
                        visibility: tauri_plugin_visual_editor_core::types::Visibility::Visible,
                        css_bounds: tauri_plugin_visual_editor_core::types::Bounds {
                            x: 0.0,
                            y: 0.0,
                            width: 10.0,
                            height: 10.0,
                        },
                        physical_bounds: tauri_plugin_visual_editor_core::types::Bounds {
                            x: 0.0,
                            y: 0.0,
                            width: 10.0,
                            height: 10.0,
                        },
                        visible_bounds: None,
                        full_bounds: None,
                        computed_layout: vec![],
                    },
                    selector: "button".into(),
                    component: None,
                    file: None,
                    inspector_id: None,
                    entity: None,
                    status: tauri_plugin_visual_editor_core::types::ElementStatus::Valid,
                    linked_capture_id: None,
                },
            );
        }
        hub.set_enabled(true);
        hub.set_enabled(false);
        let snap = hub.snapshot();
        assert!(!snap.enabled);
        assert_eq!(snap.session.selected_elements.len(), 1);
    }

    #[test]
    fn toggle_only_affects_window_visibility() {
        let hub = InspectorHub::new();
        hub.set_enabled(true);
        assert!(hub.toggle_window());
        let snap = hub.snapshot();
        assert!(snap.enabled);
        assert!(snap.inspector_window_open);
        assert!(!hub.toggle_window());
        assert!(!hub.snapshot().inspector_window_open);
        assert!(hub.snapshot().enabled);
    }

    #[test]
    fn set_target_rejects_unknown_webview() {
        let hub = InspectorHub::new();
        assert!(hub.set_target_webview("missing").is_err());
    }

    #[test]
    fn pin_and_unpin_target() {
        let hub = InspectorHub::new();
        seed_webview(&hub, "main", "main-window");
        hub.pin_target("main").unwrap();
        assert!(hub.snapshot().active_target.unwrap().pinned);
        hub.unpin_target();
        assert!(!hub.snapshot().active_target.unwrap().pinned);
    }

    #[test]
    fn export_context_returns_bundle_markdown() {
        let hub = InspectorHub::new();
        seed_webview(&hub, "main", "main-window");
        let bundle = hub.export_context("2026-01-01T00:00:00Z");
        assert!(bundle.contains("TAURI VISUAL INSPECTOR CONTEXT"));
    }

    #[test]
    fn mark_selections_stale_for_webview() {
        let hub = InspectorHub::new();
        {
            let mut inner = hub.0.lock().unwrap();
            inner.session.selected_elements.push(
                tauri_plugin_visual_editor_core::types::SelectedElement {
                    id: "el-1".into(),
                    snapshot: tauri_plugin_visual_editor_core::types::ElementSnapshot {
                        webview_id: "main".into(),
                        tag: "div".into(),
                        text: None,
                        attributes: vec![],
                        dom_path: "body>div".into(),
                        visibility: tauri_plugin_visual_editor_core::types::Visibility::Visible,
                        css_bounds: tauri_plugin_visual_editor_core::types::Bounds {
                            x: 0.0,
                            y: 0.0,
                            width: 10.0,
                            height: 10.0,
                        },
                        physical_bounds: tauri_plugin_visual_editor_core::types::Bounds {
                            x: 0.0,
                            y: 0.0,
                            width: 10.0,
                            height: 10.0,
                        },
                        visible_bounds: None,
                        full_bounds: None,
                        computed_layout: vec![],
                    },
                    selector: "div".into(),
                    component: None,
                    file: None,
                    inspector_id: None,
                    entity: None,
                    status: tauri_plugin_visual_editor_core::types::ElementStatus::Valid,
                    linked_capture_id: None,
                },
            );
        }
        hub.mark_selections_stale_for_webview("main");
        assert_eq!(
            hub.snapshot().session.selected_elements[0].status,
            tauri_plugin_visual_editor_core::types::ElementStatus::StaleAfterReload
        );
    }

    fn seed_webview(hub: &InspectorHub, id: &str, window: &str) {
        let mut inner = hub.0.lock().unwrap();
        inner.webviews.push(WebViewRegistration {
            id: id.into(),
            label: id.into(),
            window_label: window.into(),
            url: "tauri://localhost/".into(),
            status: WebviewStatus::Active,
        });
        inner.active_target = Some(InspectionTarget {
            webview_id: id.into(),
            pinned: false,
        });
    }
}
