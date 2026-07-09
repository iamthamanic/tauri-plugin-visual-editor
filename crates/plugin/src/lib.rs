//! Tauri 2 plugin entry point for Visual Editor / Visual Inspector.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(feature = "visual-inspector")]
mod commands;
#[cfg(feature = "visual-inspector")]
mod hub;
#[cfg(feature = "visual-inspector")]
mod models;

#[cfg(feature = "visual-inspector")]
pub use hub::InspectorHub;
#[cfg(feature = "visual-inspector")]
pub use models::HubSnapshot;

/// Initializes the plugin.
///
/// With `visual-inspector` disabled at compile time, only an inert plugin shell is
/// registered — no hub, commands, or webview hooks.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    #[cfg(feature = "visual-inspector")]
    {
        init_inspector::<R>()
    }

    #[cfg(not(feature = "visual-inspector"))]
    {
        Builder::new("visual-editor").build()
    }
}

#[cfg(feature = "visual-inspector")]
fn init_inspector<R: Runtime>() -> TauriPlugin<R> {
    use tauri::Manager;

    Builder::new("visual-editor")
        .setup(|app, _api| {
            let hub = InspectorHub::new();
            app.manage(hub);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_state,
            commands::emit_state,
            commands::enable,
            commands::disable,
            commands::open,
            commands::close,
            commands::toggle,
            commands::clear_session,
            commands::set_target_webview,
            commands::pin_target_webview,
            commands::unpin_target_webview,
            commands::export_context,
            commands::capture,
            commands::revalidate,
        ])
        .on_webview_ready(|webview| {
            let app = webview.app_handle();
            if let Some(hub) = app.try_state::<InspectorHub>() {
                hub.register_webview(&webview);
                hub.emit_state(app);
            }
        })
        .build()
}

#[cfg(test)]
mod tests {
    use tauri_plugin_visual_editor_core::VERSION;

    #[test]
    fn core_version_matches_workspace() {
        assert_eq!(VERSION, "0.1.0");
    }

    #[cfg(feature = "visual-inspector")]
    #[test]
    fn hub_module_available_with_feature() {
        let _hub = super::InspectorHub::new();
    }
}
