//! Shared types between guest snapshots, hub state, and context bundle export.

use serde::{Deserialize, Serialize};

/// Lifecycle status of a selected element in the inspector session.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ElementStatus {
    Valid,
    StaleAfterReload,
    NotFound,
    WebviewClosed,
}

/// Visibility relative to the host webview viewport.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Visibility {
    Visible,
    PartiallyVisible,
    OutsideViewport,
}

/// Registration status of a host webview in the inspector hub.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WebviewStatus {
    Active,
    Closed,
}

/// Screenshot capture mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CaptureType {
    Window,
    Webview,
    Element,
    Region,
}

/// Axis-aligned rectangle in CSS logical pixels unless noted.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Raw DOM facts collected by the guest runtime before selector building.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ElementSnapshot {
    pub webview_id: String,
    pub tag: String,
    pub text: Option<String>,
    pub attributes: Vec<(String, String)>,
    pub dom_path: String,
    pub visibility: Visibility,
    pub css_bounds: Bounds,
    pub physical_bounds: Bounds,
    pub visible_bounds: Option<Bounds>,
    pub full_bounds: Option<Bounds>,
    pub computed_layout: Vec<(String, String)>,
}

/// A selected element stored in the session with hub-assigned identity.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SelectedElement {
    pub id: String,
    pub snapshot: ElementSnapshot,
    pub selector: String,
    pub component: Option<String>,
    pub file: Option<String>,
    pub inspector_id: Option<String>,
    pub entity: Option<String>,
    pub status: ElementStatus,
    pub linked_capture_id: Option<String>,
}

/// A screenshot capture attached to the session.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Capture {
    pub id: String,
    pub path: String,
    pub capture_type: CaptureType,
    pub webview_id: Option<String>,
    pub device_pixel_ratio: f64,
    pub screenshot_size_physical: (u32, u32),
    pub viewport_size_css: (u32, u32),
    pub crop_bounds_css: Option<Bounds>,
    pub crop_padding_css: Option<u32>,
    pub include_in_copy: bool,
}

/// Inspector session state (ephemeral; not persisted across app restarts).
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct Session {
    pub selected_elements: Vec<SelectedElement>,
    pub captures: Vec<Capture>,
    pub primary_capture_id: Option<String>,
    pub issue_text: Option<String>,
}

/// A host webview registered with the inspector hub.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WebViewRegistration {
    pub id: String,
    pub label: String,
    pub window_label: String,
    pub url: String,
    pub status: WebviewStatus,
}

/// Active inspection target within the hub.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct InspectionTarget {
    pub webview_id: String,
    pub pinned: bool,
}

/// Ordered composer block from the contenteditable DOM (text + chip refs).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ComposerBlock {
    Text { content: String },
    Element { id: String },
    Capture { id: String },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn element_status_serializes() {
        let s = ElementStatus::StaleAfterReload;
        assert_eq!(serde_json::to_string(&s).unwrap(), "\"stale_after_reload\"");
    }

    #[test]
    fn session_roundtrips_json() {
        let session = Session {
            selected_elements: vec![],
            captures: vec![],
            primary_capture_id: None,
            issue_text: Some("test".into()),
        };
        let json = serde_json::to_string(&session).unwrap();
        let back: Session = serde_json::from_str(&json).unwrap();
        assert_eq!(session, back);
    }
}
