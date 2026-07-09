//! Relationship hints between selected elements (DOM + visual).

use crate::types::{Bounds, SelectedElement};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RelationshipHints {
    pub dom: Vec<String>,
    pub visual: Vec<String>,
}

pub fn compute_relationships(elements: &[SelectedElement]) -> RelationshipHints {
    let mut dom = Vec::new();
    let mut visual = Vec::new();

    for i in 0..elements.len() {
        for j in (i + 1)..elements.len() {
            let a = &elements[i];
            let b = &elements[j];

            if dom_parent_of(&a.snapshot.dom_path, &b.snapshot.dom_path) {
                dom.push(format!(
                    "Element {} is a DOM parent of Element {}",
                    i + 1,
                    j + 1
                ));
            } else if dom_parent_of(&b.snapshot.dom_path, &a.snapshot.dom_path) {
                dom.push(format!(
                    "Element {} is a DOM parent of Element {}",
                    j + 1,
                    i + 1
                ));
            } else {
                dom.push(format!(
                    "Element {} is not a DOM parent of Element {}",
                    i + 1,
                    j + 1
                ));
            }

            if let Some(overlap) = overlap_px(&a.snapshot.css_bounds, &b.snapshot.css_bounds) {
                if overlap > 0.0 {
                    visual.push(format!(
                        "Element {} visually overlaps Element {}",
                        i + 1,
                        j + 1
                    ));
                    let a_bottom = a.snapshot.css_bounds.y + a.snapshot.css_bounds.height;
                    let b_top = b.snapshot.css_bounds.y;
                    visual.push(format!(
                        "Element {} bottom edge: {a_bottom:.0} CSS px",
                        i + 1
                    ));
                    visual.push(format!("Element {} top edge: {b_top:.0} CSS px", j + 1));
                    visual.push(format!("Overlap: {overlap:.0} CSS px"));
                }
            }

            if contains_bounds(&a.snapshot.css_bounds, &b.snapshot.css_bounds) {
                visual.push(format!(
                    "Element {} is visually contained in Element {}",
                    j + 1,
                    i + 1
                ));
            } else if contains_bounds(&b.snapshot.css_bounds, &a.snapshot.css_bounds) {
                visual.push(format!(
                    "Element {} is visually contained in Element {}",
                    i + 1,
                    j + 1
                ));
            }
        }
    }

    RelationshipHints { dom, visual }
}

fn dom_parent_of(parent_path: &str, child_path: &str) -> bool {
    if parent_path == child_path {
        return false;
    }
    child_path.starts_with(parent_path)
        && child_path
            .strip_prefix(parent_path)
            .is_some_and(|rest| rest.starts_with(" > "))
}

fn overlap_px(a: &Bounds, b: &Bounds) -> Option<f64> {
    let top = a.y.max(b.y);
    let bottom = (a.y + a.height).min(b.y + b.height);
    if bottom > top {
        Some(bottom - top)
    } else {
        Some(0.0)
    }
}

fn contains_bounds(outer: &Bounds, inner: &Bounds) -> bool {
    inner.x >= outer.x
        && inner.y >= outer.y
        && inner.x + inner.width <= outer.x + outer.width
        && inner.y + inner.height <= outer.y + outer.height
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Bounds, ElementSnapshot, ElementStatus, SelectedElement, Visibility};

    fn element(idx: usize, dom_path: &str, bounds: Bounds) -> SelectedElement {
        SelectedElement {
            id: format!("e{idx}"),
            selector: "div".into(),
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
                attributes: vec![],
                dom_path: dom_path.into(),
                visibility: Visibility::Visible,
                css_bounds: bounds,
                physical_bounds: bounds,
                visible_bounds: None,
                full_bounds: None,
                computed_layout: vec![],
            },
        }
    }

    #[test]
    fn detects_visual_overlap() {
        let a = element(
            1,
            "html > body > a",
            Bounds {
                x: 0.0,
                y: 500.0,
                width: 100.0,
                height: 40.0,
            },
        );
        let b = element(
            2,
            "html > body > b",
            Bounds {
                x: 0.0,
                y: 510.0,
                width: 100.0,
                height: 40.0,
            },
        );
        let hints = compute_relationships(&[a, b]);
        assert!(hints.visual.iter().any(|l| l.contains("overlaps")));
    }
}
