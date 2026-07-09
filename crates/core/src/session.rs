//! Session mutations and helpers.

use crate::types::{
    Capture, ElementStatus, SelectedElement, Session, WebViewRegistration, WebviewStatus,
};

impl Session {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn clear(&mut self) {
        *self = Self::default();
    }

    pub fn set_issue_text(&mut self, text: Option<String>) {
        self.issue_text = text;
    }

    pub fn add_element(&mut self, element: SelectedElement) {
        self.selected_elements.push(element);
    }

    pub fn replace_elements(&mut self, elements: Vec<SelectedElement>) {
        self.selected_elements = elements;
    }

    pub fn remove_element(&mut self, id: &str) -> bool {
        let before = self.selected_elements.len();
        self.selected_elements.retain(|e| e.id != id);
        self.selected_elements.len() < before
    }

    pub fn add_capture(&mut self, capture: Capture) {
        let id = capture.id.clone();
        self.captures.push(capture);
        if self.primary_capture_id.is_none() {
            self.primary_capture_id = Some(id);
        }
    }

    pub fn set_primary_capture(&mut self, id: &str) -> bool {
        if self.captures.iter().any(|c| c.id == id) {
            self.primary_capture_id = Some(id.to_string());
            true
        } else {
            false
        }
    }

    pub fn set_capture_included(&mut self, id: &str, include: bool) -> bool {
        if let Some(capture) = self.captures.iter_mut().find(|c| c.id == id) {
            capture.include_in_copy = include;
            true
        } else {
            false
        }
    }

    pub fn primary_capture(&self) -> Option<&Capture> {
        self.primary_capture_id
            .as_ref()
            .and_then(|id| self.captures.iter().find(|c| &c.id == id))
    }

    pub fn captures_for_copy(&self) -> Vec<&Capture> {
        self.captures.iter().filter(|c| c.include_in_copy).collect()
    }

    pub fn mark_stale_after_reload(&mut self) {
        for element in &mut self.selected_elements {
            if element.status == ElementStatus::Valid {
                element.status = ElementStatus::StaleAfterReload;
            }
        }
    }

    pub fn mark_webview_closed(&mut self, webview_id: &str) {
        for element in &mut self.selected_elements {
            if element.snapshot.webview_id == webview_id {
                element.status = ElementStatus::WebviewClosed;
            }
        }
    }
}

/// Mark all registrations for a closed webview.
pub fn close_webview_registration(registrations: &mut [WebViewRegistration], webview_id: &str) {
    for reg in registrations.iter_mut().filter(|r| r.id == webview_id) {
        reg.status = WebviewStatus::Closed;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Bounds, CaptureType, ElementSnapshot, Visibility};

    fn sample_snapshot(webview_id: &str) -> ElementSnapshot {
        ElementSnapshot {
            webview_id: webview_id.to_string(),
            tag: "button".into(),
            text: Some("OK".into()),
            attributes: vec![],
            dom_path: "html > body > button".into(),
            visibility: Visibility::Visible,
            css_bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 40.0,
            },
            physical_bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 200.0,
                height: 80.0,
            },
            visible_bounds: None,
            full_bounds: None,
            computed_layout: vec![("display".into(), "block".into())],
        }
    }

    fn sample_element(id: &str, webview: &str) -> SelectedElement {
        SelectedElement {
            id: id.into(),
            snapshot: sample_snapshot(webview),
            selector: "button".into(),
            component: None,
            file: None,
            inspector_id: None,
            entity: None,
            status: ElementStatus::Valid,
            linked_capture_id: None,
        }
    }

    fn sample_capture(id: &str) -> Capture {
        Capture {
            id: id.into(),
            path: format!("/tmp/{id}.png"),
            capture_type: CaptureType::Webview,
            webview_id: Some("main".into()),
            device_pixel_ratio: 2.0,
            screenshot_size_physical: (2880, 1800),
            viewport_size_css: (1440, 900),
            crop_bounds_css: None,
            crop_padding_css: None,
            include_in_copy: true,
        }
    }

    #[test]
    fn add_and_remove_elements() {
        let mut session = Session::new();
        session.add_element(sample_element("e1", "main"));
        assert_eq!(session.selected_elements.len(), 1);
        assert!(session.remove_element("e1"));
        assert!(session.selected_elements.is_empty());
    }

    #[test]
    fn primary_capture_defaults_to_first() {
        let mut session = Session::new();
        session.add_capture(sample_capture("c1"));
        assert_eq!(session.primary_capture_id.as_deref(), Some("c1"));
        session.add_capture(sample_capture("c2"));
        session.set_primary_capture("c2");
        assert_eq!(session.primary_capture().unwrap().id, "c2");
    }

    #[test]
    fn stale_and_webview_closed_marks() {
        let mut session = Session::new();
        session.add_element(sample_element("e1", "modal"));
        session.mark_stale_after_reload();
        assert_eq!(
            session.selected_elements[0].status,
            ElementStatus::StaleAfterReload
        );
        session.selected_elements[0].status = ElementStatus::Valid;
        session.mark_webview_closed("modal");
        assert_eq!(
            session.selected_elements[0].status,
            ElementStatus::WebviewClosed
        );
    }

    #[test]
    fn unlimited_elements_and_captures() {
        let mut session = Session::new();
        for i in 0..100 {
            session.add_element(sample_element(&format!("e{i}"), "main"));
            session.add_capture(sample_capture(&format!("c{i}")));
        }
        assert_eq!(session.selected_elements.len(), 100);
        assert_eq!(session.captures.len(), 100);
    }
}
