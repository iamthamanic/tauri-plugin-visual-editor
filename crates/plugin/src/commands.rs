//! Tauri command handlers for the visual editor plugin.

use tauri::{command, AppHandle, Runtime, State};

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
    let open = hub.toggle_window();
    emit_after(&app, &hub);
    Ok(open)
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
pub fn capture(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    options: Option<CaptureOptions>,
) -> Result<String, String> {
    require_gates(&gates)?;
    let mode = options.map(|o| o.mode).unwrap_or_else(|| "webview".into());
    hub.capture(&mode)
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
