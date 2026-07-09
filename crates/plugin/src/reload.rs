//! Hard reload orchestration for host webviews.

use tauri::{AppHandle, Manager, Runtime, WebviewWindow};

use crate::hub::InspectorHub;

/// Reload a host webview, mark its selections stale, and broadcast hub state.
pub fn hard_reload<R: Runtime>(
    app: &AppHandle<R>,
    hub: &InspectorHub,
    webview_id: &str,
) -> Result<(), String> {
    let webview = resolve_webview(app, webview_id)?;
    hub.mark_selections_stale_for_webview(webview_id);
    webview
        .reload()
        .map_err(|e| format!("reload failed: {e}"))?;
    hub.emit_state(app);
    Ok(())
}

fn resolve_webview<R: Runtime>(
    app: &AppHandle<R>,
    webview_id: &str,
) -> Result<WebviewWindow<R>, String> {
    app.get_webview_window(webview_id)
        .ok_or_else(|| format!("Unknown webview: {webview_id}"))
}
