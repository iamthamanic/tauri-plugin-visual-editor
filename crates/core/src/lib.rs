//! Core logic for `tauri-plugin-visual-editor`.
//!
//! Session state, selector algorithm, relationship calculation, and context
//! bundle export live here. No Tauri dependency.

pub mod types;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
