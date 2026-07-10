//! Context Bundle text export (English, fixed V1 format).

use crate::relationships::{compute_relationships, RelationshipHints};
use crate::selector::is_stable_class;
use crate::types::{
    Capture, CaptureType, ElementSnapshot, ElementStatus, SelectedElement, Session, Visibility,
};

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

/// Human-readable composer text preserving DOM block order (text + chips interleaved).
pub fn export_composer_ordered(
    session: &Session,
    blocks: &[crate::types::ComposerBlock],
) -> String {
    use crate::types::ComposerBlock;

    let mut out = String::new();

    for block in blocks {
        match block {
            ComposerBlock::Text { content } => {
                let text = content.trim_matches('\u{200B}');
                if text.is_empty() {
                    continue;
                }
                if !out.is_empty() {
                    ensure_paragraph_break(&mut out);
                }
                out.push_str(text);
            }
            ComposerBlock::Element { id } => {
                let Some(element) = session.selected_elements.iter().find(|el| el.id == *id) else {
                    continue;
                };
                if !out.is_empty() {
                    ensure_paragraph_break(&mut out);
                }
                out.push_str(&element_composer_ref(element));
            }
            ComposerBlock::Capture { id } => {
                let Some((index, capture)) = session
                    .captures
                    .iter()
                    .enumerate()
                    .find(|(_, cap)| cap.id == *id)
                else {
                    continue;
                };
                if !capture.include_in_copy {
                    continue;
                }
                if !out.is_empty() {
                    ensure_paragraph_break(&mut out);
                }
                out.push_str(&capture_composer_ref(index + 1, capture));
            }
        }
    }

    out.trim_end().to_string()
}

fn ensure_paragraph_break(out: &mut String) {
    if out.ends_with("\n\n") {
        return;
    }
    if out.ends_with('\n') {
        out.push('\n');
    } else {
        out.push_str("\n\n");
    }
}

/// Human-readable composer text for AI editor paste (issue + bracketed element refs).
pub fn export_composer_context(session: &Session) -> String {
    let issue = session.issue_text.as_deref().unwrap_or("").trim();
    let mut refs: Vec<String> = Vec::new();

    for element in &session.selected_elements {
        refs.push(element_composer_ref(element));
    }
    for (index, capture) in session.captures.iter().enumerate() {
        if capture.include_in_copy {
            refs.push(capture_composer_ref(index + 1, capture));
        }
    }

    if issue.is_empty() && refs.is_empty() {
        return String::new();
    }

    let mut out = String::new();
    if !issue.is_empty() {
        out.push_str(issue);
    }
    if !refs.is_empty() {
        if !out.is_empty() {
            out.push_str("\n\n");
        }
        out.push_str(&refs.join("\n"));
    }
    out
}

fn element_composer_ref(element: &SelectedElement) -> String {
    let label = element_chip_label(element);
    let mut parts: Vec<String> = Vec::new();

    if let Some(file) = element.file.as_deref().filter(|value| !value.is_empty()) {
        parts.push(format!("file: {file}"));
    }
    if let Some(component) = element
        .component
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        parts.push(format!("component: {component}"));
    }
    if let Some(id) = element
        .inspector_id
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        parts.push(format!("inspector-id: {id}"));
    } else if let Some(id) = attr_value(&element.snapshot, "data-inspector-id") {
        parts.push(format!("inspector-id: {id}"));
    }

    parts.push(format!("selector: {}", element.selector));
    parts.push(format!("dom: {}", element.snapshot.dom_path));

    if let Some(text) = element
        .snapshot
        .text
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        let truncated: String = text.chars().take(80).collect();
        let ellipsis = if text.chars().count() > 80 { "…" } else { "" };
        parts.push(format!("text: \"{truncated}{ellipsis}\""));
    }

    format!("[{label} | {}]", parts.join(" | "))
}

fn capture_composer_ref(index: usize, capture: &Capture) -> String {
    let label = if capture.capture_type == CaptureType::Webview {
        format!("Screenshot #{index}")
    } else {
        format!("{} #{index}", capture_type_label(capture.capture_type))
    };
    format!("[{label} | path: {} | image attached]", capture.path)
}

fn element_chip_label(element: &SelectedElement) -> String {
    let tag = &element.snapshot.tag;
    if let Some(comp) = element
        .component
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        return format!("<{comp}>");
    }
    if let Some(comp) = attr_value(&element.snapshot, "data-inspector-component") {
        return format!("<{comp}>");
    }
    if let Some(id) = element
        .inspector_id
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        return format!("<{tag} data-inspector-id=\"{id}\">");
    }
    if let Some(id) = attr_value(&element.snapshot, "data-inspector-id") {
        return format!("<{tag} data-inspector-id=\"{id}\">");
    }
    if let Some(id) = attr_value(&element.snapshot, "id") {
        return format!("<{tag} id=\"{id}\">");
    }
    if let Some(class) = chip_class_from_snapshot(&element.snapshot) {
        return format!("<{tag} class=\"{class}\">");
    }
    format!("<{tag}>")
}

fn attr_value<'a>(snapshot: &'a ElementSnapshot, key: &str) -> Option<&'a str> {
    snapshot
        .attributes
        .iter()
        .find(|(attr_key, _)| attr_key == key)
        .map(|(_, value)| value.as_str())
}

fn is_layout_utility_class(class: &str) -> bool {
    const SINGLE: &[&str] = &[
        "flex",
        "inline-flex",
        "grid",
        "inline-grid",
        "block",
        "inline-block",
        "inline",
        "hidden",
        "contents",
        "relative",
        "absolute",
        "fixed",
        "sticky",
        "static",
        "container",
        "truncate",
        "sr-only",
    ];
    let lower = class.to_ascii_lowercase();
    if SINGLE.contains(&lower.as_str()) {
        return true;
    }
    const PREFIXES: &[&str] = &[
        "flex-",
        "items-",
        "justify-",
        "gap-",
        "space-",
        "p-",
        "px-",
        "py-",
        "pt-",
        "pb-",
        "pl-",
        "pr-",
        "m-",
        "mx-",
        "my-",
        "mt-",
        "mb-",
        "ml-",
        "mr-",
        "w-",
        "h-",
        "min-",
        "max-",
        "col-",
        "row-",
        "grid-",
        "self-",
        "place-",
        "overflow-",
        "z-",
        "order-",
        "basis-",
    ];
    PREFIXES.iter().any(|prefix| lower.starts_with(prefix))
}

fn chip_class_from_snapshot(snapshot: &ElementSnapshot) -> Option<String> {
    let classes = attr_value(snapshot, "class")?;
    for class in classes.split_whitespace() {
        if is_stable_class(class) && !is_layout_utility_class(class) {
            return Some(class.to_string());
        }
    }
    None
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

    #[test]
    fn composer_joins_issue_and_bracketed_refs() {
        let mut session = sample_session_l1();
        session.set_issue_text(Some("Fix header on mobile".into()));
        let composer = export_composer_context(&session);
        assert!(composer.starts_with("Fix header on mobile"));
        assert!(composer.contains(
            "[<button> | selector: button | dom: html > body > button | text: \"Export\"]"
        ));
        assert!(composer.contains("[Screenshot #1 | path: /tmp/shot.png | image attached]"));
        assert!(composer.contains("\n\n["));
    }

    #[test]
    fn composer_includes_file_and_component_when_known() {
        let mut session = Session::new();
        session.add_element(SelectedElement {
            id: "e1".into(),
            selector: "[data-inspector-id=\"nav.export\"]".into(),
            component: Some("ExportButton".into()),
            file: Some("src/components/ExportButton.tsx".into()),
            inspector_id: Some("nav.export".into()),
            entity: None,
            status: ElementStatus::Valid,
            linked_capture_id: None,
            snapshot: ElementSnapshot {
                webview_id: "main".into(),
                tag: "button".into(),
                text: Some("Export".into()),
                attributes: vec![("data-inspector-id".into(), "nav.export".into())],
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
                computed_layout: vec![],
            },
        });
        let composer = export_composer_context(&session);
        assert!(composer.contains("file: src/components/ExportButton.tsx"));
        assert!(composer.contains("component: ExportButton"));
        assert!(composer.contains("inspector-id: nav.export"));
    }

    #[test]
    fn composer_chip_label_uses_first_class() {
        let mut session = Session::new();
        session.add_element(SelectedElement {
            id: "e1".into(),
            selector: "h4".into(),
            component: None,
            file: None,
            inspector_id: None,
            entity: None,
            status: ElementStatus::Valid,
            linked_capture_id: None,
            snapshot: ElementSnapshot {
                webview_id: "main".into(),
                tag: "h4".into(),
                text: None,
                attributes: vec![("class".into(), "text-2xl font-bold".into())],
                dom_path: "html > h4".into(),
                visibility: Visibility::Visible,
                css_bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 100.0,
                    height: 24.0,
                },
                physical_bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 200.0,
                    height: 48.0,
                },
                visible_bounds: None,
                full_bounds: None,
                computed_layout: vec![],
            },
        });
        let composer = export_composer_context(&session);
        assert!(composer.contains("[<h4 class=\"text-2xl\"> | selector: h4 | dom: html > h4]"));
    }

    #[test]
    fn composer_chip_skips_layout_utilities() {
        let mut session = Session::new();
        session.add_element(SelectedElement {
            id: "e1".into(),
            selector: "div.card".into(),
            component: None,
            file: None,
            inspector_id: None,
            entity: None,
            status: ElementStatus::Valid,
            linked_capture_id: None,
            snapshot: ElementSnapshot {
                webview_id: "main".into(),
                tag: "div".into(),
                text: None,
                attributes: vec![("class".into(), "flex items-center card".into())],
                dom_path: "html > div".into(),
                visibility: Visibility::Visible,
                css_bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 100.0,
                    height: 24.0,
                },
                physical_bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 200.0,
                    height: 48.0,
                },
                visible_bounds: None,
                full_bounds: None,
                computed_layout: vec![],
            },
        });
        let composer = export_composer_context(&session);
        assert!(composer.contains("[<div class=\"card\"> | selector: div.card | dom: html > div]"));
        assert!(!composer.contains("class=\"flex\""));
    }

    #[test]
    fn composer_empty_when_no_content() {
        assert!(export_composer_context(&Session::new()).is_empty());
    }

    #[test]
    fn composer_ordered_preserves_dom_block_sequence() {
        use crate::types::ComposerBlock;

        let mut session = sample_session_l1();
        session.set_issue_text(Some("ignored when blocks provided".into()));
        let blocks = vec![
            ComposerBlock::Element {
                id: session.selected_elements[0].id.clone(),
            },
            ComposerBlock::Capture {
                id: session.captures[0].id.clone(),
            },
            ComposerBlock::Text {
                content: "was das problem ist\n".into(),
            },
            ComposerBlock::Text {
                content: "guck wenn du hier sachen machst".into(),
            },
        ];
        let composer = export_composer_ordered(&session, &blocks);
        let el_pos = composer.find("[<button>").expect("element ref");
        let cap_pos = composer.find("[Screenshot #1").expect("capture ref");
        let text_pos = composer.find("was das problem ist").expect("inline text");
        assert!(el_pos < cap_pos);
        assert!(cap_pos < text_pos);
        assert!(composer.contains("guck wenn du hier sachen machst"));
        assert!(!composer.starts_with("ignored"));
    }

    #[test]
    fn composer_ordered_adds_paragraph_breaks_between_blocks() {
        use crate::types::ComposerBlock;

        let session = sample_session_l1();
        let blocks = vec![
            ComposerBlock::Element {
                id: session.selected_elements[0].id.clone(),
            },
            ComposerBlock::Text {
                content: "hier ist das problem".into(),
            },
            ComposerBlock::Capture {
                id: session.captures[0].id.clone(),
            },
        ];
        let composer = export_composer_ordered(&session, &blocks);
        assert!(composer.starts_with("[<button>"));
        assert!(composer.contains("\n\nhier ist das problem\n\n"));
        assert!(composer.contains("[Screenshot #1"));
    }
}
