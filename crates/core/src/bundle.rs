//! Context Bundle text export (English, fixed V1 format).

use crate::relationships::{compute_relationships, RelationshipHints};
use crate::types::{Capture, CaptureType, ElementStatus, SelectedElement, Session, Visibility};

/// Target webview metadata for bundle header.
#[derive(Debug, Clone)]
pub struct BundleTarget {
    pub window_label: String,
    pub webview_label: String,
    pub url: String,
    pub captured_at: String,
}

/// Export the V1 context bundle string for clipboard copy.
pub fn export_context_bundle(
    target: &BundleTarget,
    session: &Session,
    project_root: Option<&str>,
) -> String {
    let mut out = String::new();
    out.push_str("TAURI VISUAL INSPECTOR CONTEXT\n\n");
    out.push_str("Target:\n");
    out.push_str(&format!("- Window: {}\n", target.window_label));
    out.push_str(&format!("- WebView: {}\n", target.webview_label));
    out.push_str(&format!("- URL: {}\n", target.url));
    out.push_str(&format!("- Captured at: {}\n", target.captured_at));

    if let Some(primary) = session.primary_capture().filter(|c| c.include_in_copy) {
        write_capture_section(&mut out, "Primary screenshot", primary, project_root);
    }

    let additional: Vec<_> = session
        .captures
        .iter()
        .filter(|c| c.include_in_copy)
        .filter(|c| session.primary_capture_id.as_ref() != Some(&c.id))
        .collect();

    if !additional.is_empty() {
        out.push('\n');
        out.push_str("Additional screenshots:\n");
        for capture in additional {
            write_capture_bullets(&mut out, capture, project_root);
        }
    }

    out.push_str("\nSelected elements:\n\n");
    for (idx, element) in session.selected_elements.iter().enumerate() {
        write_element(&mut out, idx + 1, element);
        out.push('\n');
    }

    if session.selected_elements.len() >= 2 {
        let hints = compute_relationships(&session.selected_elements);
        write_relationships(&mut out, &hints);
    }

    if let Some(issue) = session.issue_text.as_ref().filter(|t| !t.trim().is_empty()) {
        out.push_str("\nIssue:\n");
        out.push_str(issue);
        out.push('\n');
    }

    out
}

fn write_capture_section(
    out: &mut String,
    title: &str,
    capture: &Capture,
    project_root: Option<&str>,
) {
    out.push('\n');
    out.push_str(title);
    out.push_str(":\n");
    write_capture_bullets(out, capture, project_root);
}

fn write_capture_bullets(out: &mut String, capture: &Capture, project_root: Option<&str>) {
    out.push_str(&format!("- Path: {}\n", capture.path));
    if let Some(root) = project_root {
        if let Some(rel) = capture.path.strip_prefix(root) {
            let rel = rel.trim_start_matches('/');
            out.push_str(&format!("- Relative path: {rel}\n"));
        }
    }
    out.push_str(&format!(
        "- Type: {}\n",
        capture_type_label(capture.capture_type)
    ));
    out.push_str(&format!("- DPR: {}\n", capture.device_pixel_ratio));
    out.push_str(&format!(
        "- Screenshot size: {}x{} physical px\n",
        capture.screenshot_size_physical.0, capture.screenshot_size_physical.1
    ));
    out.push_str(&format!(
        "- Viewport size: {}x{} CSS px\n",
        capture.viewport_size_css.0, capture.viewport_size_css.1
    ));
    if let Some(padding) = capture.crop_padding_css {
        out.push_str(&format!("- Crop padding: {padding} CSS px\n"));
    }
}

fn capture_type_label(kind: CaptureType) -> &'static str {
    match kind {
        CaptureType::Window => "window",
        CaptureType::Webview => "webview",
        CaptureType::Element => "element-crop",
        CaptureType::Region => "region",
    }
}

fn write_element(out: &mut String, index: usize, element: &SelectedElement) {
    out.push_str(&format!("Element {index}\n"));
    out.push_str(&format!(
        "- Component: {}\n",
        element.component.as_deref().unwrap_or("unknown")
    ));
    out.push_str(&format!(
        "- File: {}\n",
        element.file.as_deref().unwrap_or("unknown")
    ));
    out.push_str(&format!(
        "- Inspector ID: {}\n",
        element.inspector_id.as_deref().unwrap_or("unknown")
    ));
    if let Some(entity) = &element.entity {
        out.push_str(&format!("- Entity: {entity}\n"));
    }
    out.push_str(&format!("- Tag: {}\n", element.snapshot.tag));
    if let Some(text) = &element.snapshot.text {
        out.push_str(&format!("- Text: \"{text}\"\n"));
    }
    out.push_str(&format!("- Selector: {}\n", element.selector));
    out.push_str(&format!("- DOM path: {}\n", element.snapshot.dom_path));
    out.push_str(&format!(
        "- Visibility: {}\n",
        visibility_label(element.snapshot.visibility)
    ));
    if element.status != ElementStatus::Valid {
        out.push_str(&format!("- Status: {}\n", status_label(element.status)));
    }
    write_bounds(out, "CSS bounds", &element.snapshot.css_bounds);
    write_bounds(out, "Physical bounds", &element.snapshot.physical_bounds);
    if !element.snapshot.computed_layout.is_empty() {
        out.push_str("- Computed layout:\n");
        for (k, v) in element.snapshot.computed_layout.iter().take(20) {
            out.push_str(&format!("  {k}: {v}\n"));
        }
    }
}

fn visibility_label(v: Visibility) -> &'static str {
    match v {
        Visibility::Visible => "visible",
        Visibility::PartiallyVisible => "partially_visible",
        Visibility::OutsideViewport => "outside_viewport",
    }
}

fn status_label(s: ElementStatus) -> &'static str {
    match s {
        ElementStatus::Valid => "valid",
        ElementStatus::StaleAfterReload => "stale_after_reload",
        ElementStatus::NotFound => "not_found",
        ElementStatus::WebviewClosed => "webview_closed",
    }
}

fn write_bounds(out: &mut String, label: &str, bounds: &crate::types::Bounds) {
    out.push_str(&format!(
        "- {label}: x={:.0} y={:.0} w={:.0} h={:.0}\n",
        bounds.x, bounds.y, bounds.width, bounds.height
    ));
}

fn write_relationships(out: &mut String, hints: &RelationshipHints) {
    if hints.dom.is_empty() && hints.visual.is_empty() {
        return;
    }
    out.push_str("\nRelationships:\n\n");
    if !hints.dom.is_empty() {
        out.push_str("DOM:\n");
        for line in &hints.dom {
            out.push_str(&format!("- {line}\n"));
        }
        out.push('\n');
    }
    if !hints.visual.is_empty() {
        out.push_str("Visual:\n");
        for line in &hints.visual {
            out.push_str(&format!("- {line}\n"));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Bounds, ElementSnapshot, Visibility};

    fn sample_session_l1() -> Session {
        let mut session = Session::new();
        session.add_capture(Capture {
            id: "c1".into(),
            path: "/tmp/shot.png".into(),
            capture_type: CaptureType::Webview,
            webview_id: Some("main".into()),
            device_pixel_ratio: 2.0,
            screenshot_size_physical: (2880, 1800),
            viewport_size_css: (1440, 900),
            crop_bounds_css: None,
            crop_padding_css: None,
            include_in_copy: true,
        });
        session.add_element(SelectedElement {
            id: "e1".into(),
            selector: "button".into(),
            component: None,
            file: None,
            inspector_id: None,
            entity: None,
            status: ElementStatus::Valid,
            linked_capture_id: None,
            snapshot: ElementSnapshot {
                webview_id: "main".into(),
                tag: "button".into(),
                text: Some("Export".into()),
                attributes: vec![],
                dom_path: "html > body > button".into(),
                visibility: Visibility::Visible,
                css_bounds: Bounds {
                    x: 1184.0,
                    y: 24.0,
                    width: 96.0,
                    height: 40.0,
                },
                physical_bounds: Bounds {
                    x: 2368.0,
                    y: 48.0,
                    width: 192.0,
                    height: 80.0,
                },
                visible_bounds: None,
                full_bounds: None,
                computed_layout: vec![("display".into(), "flex".into())],
            },
        });
        session
    }

    #[test]
    fn l1_bundle_has_unknown_metadata() {
        let bundle = export_context_bundle(
            &BundleTarget {
                window_label: "main".into(),
                webview_label: "main-webview".into(),
                url: "tauri://localhost/".into(),
                captured_at: "2026-07-09T13:42:18+02:00".into(),
            },
            &sample_session_l1(),
            None,
        );
        assert!(bundle.contains("Component: unknown"));
        assert!(bundle.contains("TAURI VISUAL INSPECTOR CONTEXT"));
        assert!(!bundle.contains("Issue:"));
    }

    #[test]
    fn issue_block_only_when_set() {
        let mut session = sample_session_l1();
        session.set_issue_text(Some("Fix overlap".into()));
        let bundle = export_context_bundle(
            &BundleTarget {
                window_label: "main".into(),
                webview_label: "main".into(),
                url: "tauri://localhost/".into(),
                captured_at: "2026-07-09T13:00:00+02:00".into(),
            },
            &session,
            None,
        );
        assert!(bundle.contains("Issue:\nFix overlap"));
    }
}
