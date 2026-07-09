//! Tauri command handlers for the visual editor plugin.

use tauri::{command, AppHandle, Runtime, State};

use crate::hub::InspectorHub;
use crate::models::{CaptureOptions, HubSnapshot, OpenOptions};

fn emit_after<R: Runtime>(app: &AppHandle<R>, hub: &InspectorHub) {
    hub.emit_state(app);
}

#[command]
pub fn get_state(hub: State<'_, InspectorHub>) -> Result<HubSnapshot, String> {
    Ok(hub.snapshot())
}

#[command]
pub fn emit_state<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    hub.emit_state(&app);
    Ok(())
}

#[command]
pub fn enable<R: Runtime>(app: AppHandle<R>, hub: State<'_, InspectorHub>) -> Result<(), String> {
    hub.set_enabled(true);
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn disable<R: Runtime>(app: AppHandle<R>, hub: State<'_, InspectorHub>) -> Result<(), String> {
    hub.set_enabled(false);
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn open<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
    options: Option<OpenOptions>,
) -> Result<(), String> {
    let auto_enable = options.map(|o| o.auto_enable).unwrap_or(false);
    hub.open(auto_enable);
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn close<R: Runtime>(app: AppHandle<R>, hub: State<'_, InspectorHub>) -> Result<(), String> {
    hub.close();
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn toggle<R: Runtime>(app: AppHandle<R>, hub: State<'_, InspectorHub>) -> Result<bool, String> {
    let open = hub.toggle_window();
    emit_after(&app, &hub);
    Ok(open)
}

#[command]
pub fn clear_session<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    hub.clear_session();
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn set_target_webview<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
    webview_id: String,
) -> Result<(), String> {
    hub.set_target_webview(&webview_id)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn pin_target_webview<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
    webview_id: String,
) -> Result<(), String> {
    hub.pin_target(&webview_id)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn unpin_target_webview<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    hub.unpin_target();
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn export_context(hub: State<'_, InspectorHub>) -> Result<String, String> {
    let captured_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into());
    Ok(hub.export_context(&captured_at))
}

#[command]
pub fn capture(
    hub: State<'_, InspectorHub>,
    options: Option<CaptureOptions>,
) -> Result<String, String> {
    let mode = options.map(|o| o.mode).unwrap_or_else(|| "webview".into());
    hub.capture(&mode)
}

#[command]
pub fn revalidate<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
) -> Result<usize, String> {
    let updated = hub.revalidate();
    emit_after(&app, &hub);
    Ok(updated)
}
