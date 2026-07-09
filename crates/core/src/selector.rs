//! Canonical CSS selector builder from guest `ElementSnapshot` data.

use crate::types::ElementSnapshot;

const INSPECTOR_COMPONENT: &str = "data-inspector-component";
const INSPECTOR_FILE: &str = "data-inspector-file";
const INSPECTOR_ID: &str = "data-inspector-id";
const INSPECTOR_ENTITY: &str = "data-inspector-entity";
const LEGACY_COMPONENT: &str = "data-component";
const LEGACY_FILE: &str = "data-file";
const LEGACY_ID: &str = "data-inspect-id";

/// Resolved metadata extracted from element attributes.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ResolvedMetadata {
    pub component: Option<String>,
    pub file: Option<String>,
    pub inspector_id: Option<String>,
    pub entity: Option<String>,
}

/// Build the canonical CSS selector for an element snapshot.
pub fn build_selector(snapshot: &ElementSnapshot) -> String {
    let meta = resolve_metadata(snapshot);

    if let Some(id) = &meta.inspector_id {
        if let Some(component) = &meta.component {
            return format!(
                "[{INSPECTOR_COMPONENT}=\"{}\"][{INSPECTOR_ID}=\"{}\"]",
                escape_attr(component),
                escape_attr(id)
            );
        }
        return format!("[{INSPECTOR_ID}=\"{}\"]", escape_attr(id));
    }

    if let Some(id) = attr(snapshot, "id") {
        if is_valid_html_id(&id) {
            return format!("#{}", css_escape_ident(&id));
        }
    }

    if let Some(label) = attr(snapshot, "aria-label") {
        return format!("[aria-label=\"{}\"]", escape_attr(&label));
    }

    if let Some(role) = attr(snapshot, "role") {
        if let Some(name) = attr(snapshot, "name") {
            return format!(
                "[role=\"{}\"][name=\"{}\"]",
                escape_attr(&role),
                escape_attr(&name)
            );
        }
        return format!("[role=\"{}\"]", escape_attr(&role));
    }

    if let Some(class_selector) = stable_class_selector(snapshot) {
        return format!("{}{}", snapshot.tag, class_selector);
    }

    dom_path_to_selector(&snapshot.dom_path)
}

/// Extract component/file/id/entity with canonical + legacy attribute priority.
pub fn resolve_metadata(snapshot: &ElementSnapshot) -> ResolvedMetadata {
    ResolvedMetadata {
        component: attr(snapshot, INSPECTOR_COMPONENT).or_else(|| attr(snapshot, LEGACY_COMPONENT)),
        file: attr(snapshot, INSPECTOR_FILE).or_else(|| attr(snapshot, LEGACY_FILE)),
        inspector_id: attr(snapshot, INSPECTOR_ID).or_else(|| attr(snapshot, LEGACY_ID)),
        entity: attr(snapshot, INSPECTOR_ENTITY),
    }
}

fn attr(snapshot: &ElementSnapshot, key: &str) -> Option<String> {
    snapshot
        .attributes
        .iter()
        .find(|(k, _)| k == key)
        .map(|(_, v)| v.clone())
        .filter(|v| !v.is_empty())
}

fn escape_attr(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
}

fn css_escape_ident(value: &str) -> String {
    let mut out = String::new();
    for (i, ch) in value.chars().enumerate() {
        let ok = ch.is_ascii_alphanumeric() || ch == '-' || ch == '_';
        if ok && (ch.is_ascii_alphabetic() || ch == '-' || ch == '_' || i > 0) {
            out.push(ch);
        } else {
            out.push_str(&format!("\\{:x} ", ch as u32));
        }
    }
    out
}

fn is_valid_html_id(id: &str) -> bool {
    !id.is_empty()
        && id
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
}

/// Returns true when a class name looks stable (not CSS-module/hash generated).
pub fn is_stable_class(class: &str) -> bool {
    if class.is_empty() {
        return false;
    }
    if !class
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return false;
    }

    let lower = class.to_ascii_lowercase();

    // Known unstable patterns from architecture doc.
    if lower.starts_with("css-") {
        return false;
    }
    if lower.starts_with("jsx-") {
        return false;
    }
    if lower.starts_with("sc-") {
        return false;
    }

    // Hash-like suffix: Button_a8f2d1
    if let Some((prefix, suffix)) = class.rsplit_once('_') {
        if !prefix.is_empty() && suffix.len() >= 5 && suffix.chars().all(|c| c.is_ascii_hexdigit())
        {
            return false;
        }
    }

    true
}

fn stable_class_selector(snapshot: &ElementSnapshot) -> Option<String> {
    let classes = snapshot
        .attributes
        .iter()
        .find(|(k, _)| k == "class")
        .map(|(_, v)| v.split_whitespace().collect::<Vec<_>>())
        .unwrap_or_default();

    let stable: Vec<&str> = classes
        .iter()
        .copied()
        .filter(|c| is_stable_class(c))
        .collect();
    if stable.is_empty() {
        return None;
    }

    Some(stable.iter().fold(String::new(), |acc, c| acc + "." + c))
}

fn dom_path_to_selector(dom_path: &str) -> String {
    dom_path.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Bounds, Visibility};

    fn snapshot_with_attrs(attrs: Vec<(&str, &str)>, dom_path: &str) -> ElementSnapshot {
        ElementSnapshot {
            webview_id: "main".into(),
            tag: "div".into(),
            text: None,
            attributes: attrs
                .into_iter()
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect(),
            dom_path: dom_path.into(),
            visibility: Visibility::Visible,
            css_bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 10.0,
                height: 10.0,
            },
            physical_bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 20.0,
                height: 20.0,
            },
            visible_bounds: None,
            full_bounds: None,
            computed_layout: vec![],
        }
    }

    #[test]
    fn l3_inspector_id_selector() {
        let snap = snapshot_with_attrs(
            vec![
                (INSPECTOR_COMPONENT, "TimelineClip"),
                (INSPECTOR_ID, "timeline.clip.clip_123"),
            ],
            "html > body > div",
        );
        assert_eq!(
            build_selector(&snap),
            "[data-inspector-component=\"TimelineClip\"][data-inspector-id=\"timeline.clip.clip_123\"]"
        );
    }

    #[test]
    fn l1_dom_path_fallback() {
        let snap = snapshot_with_attrs(vec![], "html > body > main > button");
        assert_eq!(build_selector(&snap), "html > body > main > button");
    }

    #[test]
    fn legacy_attributes_as_fallback() {
        let snap = snapshot_with_attrs(
            vec![(LEGACY_COMPONENT, "Toolbar"), (LEGACY_ID, "toolbar.main")],
            "html > body > div",
        );
        let meta = resolve_metadata(&snap);
        assert_eq!(meta.component.as_deref(), Some("Toolbar"));
        assert_eq!(meta.inspector_id.as_deref(), Some("toolbar.main"));
    }

    #[test]
    fn unstable_classes_skipped() {
        assert!(!is_stable_class("Button_a8f2d1"));
        assert!(!is_stable_class("css-1j2k9l"));
        assert!(is_stable_class("btn-primary"));
        let snap = snapshot_with_attrs(
            vec![("class", "Button_a8f2d1 btn-primary")],
            "html > body > button",
        );
        assert_eq!(build_selector(&snap), "div.btn-primary");
    }

    #[test]
    fn id_selector_when_present() {
        let snap = snapshot_with_attrs(vec![("id", "export-btn")], "html > body > button");
        assert_eq!(build_selector(&snap), "#export-btn");
    }
}
