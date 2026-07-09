//! Tauri 2 plugin entry point for Visual Editor / Visual Inspector.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(feature = "visual-inspector")]
mod clipboard;
#[cfg(feature = "visual-inspector")]
mod commands;
#[cfg(feature = "visual-inspector")]
mod config;
#[cfg(feature = "visual-inspector")]
mod hub;
#[cfg(feature = "visual-inspector")]
mod models;
#[cfg(feature = "visual-inspector")]
mod paths;
#[cfg(feature = "visual-inspector")]
mod reload;
#[cfg(feature = "visual-inspector")]
mod security;

#[cfg(feature = "visual-inspector")]
pub use config::VisualEditorConfig;
#[cfg(feature = "visual-inspector")]
pub use hub::InspectorHub;
#[cfg(feature = "visual-inspector")]
pub use models::HubSnapshot;
#[cfg(feature = "visual-inspector")]
pub use security::{log_capability_denial, RuntimeGates};

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
            let gates = RuntimeGates::new(config::from_app(app), cfg!(debug_assertions));
            app.manage(hub);
            app.manage(gates);
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
            commands::copy_context_bundle,
            commands::copy_screenshot_image,
            commands::copy_screenshot_path,
            commands::open_screenshot_folder,
            commands::hard_reload,
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
