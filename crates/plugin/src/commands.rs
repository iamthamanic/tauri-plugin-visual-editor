//! Tauri command handlers for the visual editor plugin.

use tauri::{command, AppHandle, Runtime, State};
use tauri_plugin_visual_editor_core::types::ElementSnapshot;

use crate::hub::InspectorHub;
use crate::models::{CaptureOptions, HubSnapshot, OpenOptions};
use crate::security::{gate_error, RuntimeGates};

fn require_gates(gates: &RuntimeGates) -> Result<(), String> {
    gates.check().map_err(gate_error)
}

fn emit_after<R: Runtime>(app: &AppHandle<R>, hub: &InspectorHub) {
    hub.emit_state(app);
}

#[command]
pub fn get_state(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<HubSnapshot, String> {
    require_gates(&gates)?;
    Ok(hub.snapshot())
}

#[command]
pub fn emit_state<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.emit_state(&app);
    Ok(())
}

#[command]
pub fn enable<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.set_enabled(true);
    crate::webview::set_guest_active_for_app(&app, &hub, true)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn disable<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    crate::webview::set_guest_active_for_app(&app, &hub, false)?;
    hub.set_enabled(false);
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn open<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    options: Option<OpenOptions>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let auto_enable = options.map(|o| o.auto_enable).unwrap_or(false);
    hub.open(auto_enable);
    if auto_enable {
        crate::webview::set_guest_active_for_app(&app, &hub, true)?;
    }
    crate::inspector_window::open_inspector_window(&app)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn close<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    crate::inspector_window::close_inspector_window(&app)?;
    hub.close();
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn toggle<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<bool, String> {
    require_gates(&gates)?;
    let visible = crate::inspector_window::toggle_inspector_window(&app)?;
    if visible {
        hub.open(false);
    } else {
        hub.close();
    }
    emit_after(&app, &hub);
    Ok(visible)
}

#[command]
pub fn clear_session<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.clear_session();
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn set_target_webview<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    webview_id: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.set_target_webview(&webview_id)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn pin_target_webview<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    webview_id: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.pin_target(&webview_id)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn unpin_target_webview<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.unpin_target();
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn export_context(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<String, String> {
    require_gates(&gates)?;
    let captured_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into());
    Ok(hub.export_context(&captured_at))
}

#[command]
pub async fn capture<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    options: Option<CaptureOptions>,
) -> Result<String, String> {
    require_gates(&gates)?;
    let opts = options.unwrap_or_default();
    let capture = crate::screenshot::capture_with_timeout(app.clone(), &hub, opts).await?;
    let path = capture.path.clone();
    hub.record_capture(capture);
    hub.emit_state(&app);
    Ok(path)
}

#[command]
pub fn revalidate<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<usize, String> {
    require_gates(&gates)?;
    let updated = hub.revalidate();
    emit_after(&app, &hub);
    Ok(updated)
}

#[command]
pub fn report_selection<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    snapshot: ElementSnapshot,
    action: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.report_selection(snapshot, &action)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn copy_context_bundle(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let captured_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into());
    let bundle = hub.export_context(&captured_at);
    crate::clipboard::write_text(&bundle)
}

#[command]
pub fn copy_screenshot_image(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    capture_id: Option<String>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let path = match capture_id {
        Some(id) => hub
            .capture_path(&id)
            .ok_or_else(|| format!("Unknown capture: {id}"))?,
        None => hub
            .primary_capture_path()
            .ok_or_else(|| "No primary screenshot in session".to_string())?,
    };
    crate::clipboard::write_png_file(std::path::Path::new(&path))
}

#[command]
pub fn copy_screenshot_path(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    capture_id: Option<String>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let path = match capture_id {
        Some(id) => hub
            .capture_path(&id)
            .ok_or_else(|| format!("Unknown capture: {id}"))?,
        None => hub
            .primary_capture_path()
            .ok_or_else(|| "No primary screenshot in session".to_string())?,
    };
    crate::clipboard::write_path(std::path::Path::new(&path))
}

#[command]
pub fn open_screenshot_folder<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
) -> Result<(), String> {
    require_gates(&gates)?;
    crate::paths::open_screenshots_folder(&app)
}

#[command]
pub fn hard_reload<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    webview_id: Option<String>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let target = webview_id.unwrap_or_else(|| {
        hub.snapshot()
            .active_target
            .map(|t| t.webview_id)
            .unwrap_or_else(|| "main".into())
    });
    crate::reload::hard_reload(&app, &hub, &target)
}

#[command]
pub fn set_issue_text<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    text: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.set_issue_text(Some(text));
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn set_primary_capture<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    capture_id: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.set_primary_capture(&capture_id)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn set_capture_included<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    capture_id: String,
    include: bool,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.set_capture_included(&capture_id, include)?;
    emit_after(&app, &hub);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::VisualEditorConfig;
    use crate::security::Gate;

    #[test]
    fn require_gates_surfaces_dev_mode_error() {
        let gates = RuntimeGates::new(
            VisualEditorConfig {
                enabled: true,
                allow: true,
                allow_in_production: false,
            },
            false,
        );
        let err = require_gates(&gates).unwrap_err();
        assert!(err.contains("allowInProduction"));
    }

    #[test]
    fn log_capability_denial_does_not_panic() {
        crate::security::log_capability_denial("enable", "missing visual-editor:inspect");
        assert_eq!(
            Gate::DevMode,
            RuntimeGates::new(
                VisualEditorConfig {
                    enabled: true,
                    allow: true,
                    allow_in_production: false,
                },
                false,
            )
            .check()
            .unwrap_err()
            .gate
        );
    }
}
