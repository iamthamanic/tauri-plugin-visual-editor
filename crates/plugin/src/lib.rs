//! Tauri 2 plugin entry point for Visual Editor / Visual Inspector.
//!
//! Full hub, commands, and webview lifecycle are implemented in later issues.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

/// Initializes the plugin.
///
/// When the `visual-inspector` feature is disabled at compile time, only a
/// minimal plugin shell is registered (zero runtime overhead in host builds).
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("visual-editor")
        .setup(|_app, _api| Ok(()))
        .build()
}

#[cfg(test)]
mod tests {
    use tauri_plugin_visual_editor_core::VERSION;

    #[test]
    fn core_version_matches_workspace() {
        assert_eq!(VERSION, "0.1.0");
    }
}
