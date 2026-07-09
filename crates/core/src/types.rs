//! Shared types between guest snapshots and hub state.
//!
//! Full structs are implemented in issue #2.

use serde::{Deserialize, Serialize};

/// Placeholder element status until session model lands in #2.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ElementStatus {
    Valid,
    StaleAfterReload,
    NotFound,
    WebviewClosed,
}

#[cfg(test)]
mod tests {
    #[test]
    fn element_status_serializes() {
        let s = super::ElementStatus::Valid;
        assert_eq!(serde_json::to_string(&s).unwrap(), "\"valid\"");
    }
}
