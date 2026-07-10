//! Tauri command handlers for the visual editor plugin.

use tauri::{command, AppHandle, Runtime, State};
use tauri_plugin_visual_editor_core::types::ElementSnapshot;

use crate::config::VisualEditorConfig;
use crate::hub::InspectorHub;
use crate::models::{CaptureOptions, HubSnapshot, OpenOptions};
use crate::security::{gate_error, RuntimeGates};
use crate::settings::PersistentSettingsPatch;

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
    config: State<'_, VisualEditorConfig>,
    hub: State<'_, InspectorHub>,
    options: Option<OpenOptions>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let auto_enable = options.map(|o| o.auto_enable).unwrap_or(false);
    hub.open(auto_enable);
    if auto_enable {
        crate::webview::set_guest_active_for_app(&app, &hub, true)?;
    }
    if config.uses_window_overlay() {
        crate::inspector_window::open_inspector_window(&app)?;
    } else {
        crate::webview::show_embedded_toolbar_for_app(&app, &hub)?;
    }
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn close<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    config: State<'_, VisualEditorConfig>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    require_gates(&gates)?;
    if config.uses_window_overlay() {
        crate::inspector_window::close_inspector_window(&app)?;
    } else {
        crate::webview::hide_embedded_toolbar_for_app(&app, &hub)?;
    }
    hub.close();
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn toggle<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    config: State<'_, VisualEditorConfig>,
    hub: State<'_, InspectorHub>,
) -> Result<bool, String> {
    require_gates(&gates)?;
    let visible = if config.uses_window_overlay() {
        let visible = crate::inspector_window::toggle_inspector_window(&app)?;
        if visible {
            hub.open(false);
        } else {
            hub.close();
        }
        visible
    } else {
        let visible = hub.toggle_window();
        if visible {
            crate::webview::show_embedded_toolbar_for_app(&app, &hub)?;
        } else {
            crate::webview::hide_embedded_toolbar_for_app(&app, &hub)?;
        }
        visible
    };
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
pub fn notify_navigation<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    webview_id: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.mark_selections_stale_for_webview(&webview_id);
    emit_after(&app, &hub);
    Ok(())
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
    full: Option<bool>,
    blocks: Option<Vec<tauri_plugin_visual_editor_core::types::ComposerBlock>>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let captured_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into());

    if full.unwrap_or(false) {
        let bundle = hub.export_context(&captured_at);
        return crate::clipboard::write_text(&bundle);
    }

    let composer = match blocks {
        Some(ref ordered) if !ordered.is_empty() => hub.export_composer_ordered(ordered),
        _ => hub.export_composer(),
    };
    if composer.trim().is_empty() {
        return Err("Nichts zu kopieren — Elemente, Screenshot oder Text hinzufügen".into());
    }

    let image_path = hub.primary_capture_path().map(std::path::PathBuf::from);
    crate::clipboard::write_composer(&composer, image_path.as_deref().filter(|p| p.exists()))
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
    hub: State<'_, InspectorHub>,
    config: State<'_, VisualEditorConfig>,
) -> Result<(), String> {
    require_gates(&gates)?;
    crate::paths::open_screenshots_folder(&app, &hub.settings(), &config)
}

#[command]
pub fn hard_reload<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    config: State<'_, VisualEditorConfig>,
    webview_id: Option<String>,
    clear_cache: Option<bool>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let target = webview_id.unwrap_or_else(|| {
        hub.snapshot()
            .active_target
            .map(|t| t.webview_id)
            .unwrap_or_else(|| "main".into())
    });
    crate::reload::hard_reload(&app, &hub, &config, &target, clear_cache.unwrap_or(true))
}

#[command]
pub fn toggle_devtools<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    webview_id: Option<String>,
) -> Result<bool, String> {
    require_gates(&gates)?;
    let target = webview_id.unwrap_or_else(|| {
        hub.snapshot()
            .active_target
            .map(|t| t.webview_id)
            .unwrap_or_else(|| "main".into())
    });
    crate::reload::toggle_devtools(&app, &target)
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
pub fn remove_element<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    element_id: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.remove_element(&element_id)?;
    emit_after(&app, &hub);
    Ok(())
}

#[command]
pub fn remove_capture<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    capture_id: String,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.remove_capture(&capture_id)?;
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

#[command]
pub fn save_capture_image(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    capture_id: String,
    png_bytes: Vec<u8>,
) -> Result<(), String> {
    require_gates(&gates)?;
    let path = hub
        .capture_path(&capture_id)
        .ok_or_else(|| format!("Unknown capture: {capture_id}"))?;
    std::fs::write(&path, &png_bytes).map_err(|e| format!("Failed to save capture: {e}"))?;
    Ok(())
}

#[command]
pub fn read_capture_image(
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    capture_id: String,
) -> Result<Vec<u8>, String> {
    require_gates(&gates)?;
    let path = hub
        .capture_path(&capture_id)
        .ok_or_else(|| format!("Unknown capture: {capture_id}"))?;
    std::fs::read(&path).map_err(|e| format!("Failed to read capture: {e}"))
}

#[command]
pub fn update_settings<R: Runtime>(
    app: AppHandle<R>,
    gates: State<'_, RuntimeGates>,
    hub: State<'_, InspectorHub>,
    patch: PersistentSettingsPatch,
) -> Result<(), String> {
    require_gates(&gates)?;
    hub.update_settings(&patch)?;
    crate::settings::save_settings(&app, &hub.settings())?;
    if hub.is_enabled() {
        crate::webview::apply_guest_settings_for_app(&app, &hub)?;
    }
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
                auto_open: true,
                overlay_defer_ms: 100,
                overlay_mode: crate::config::OverlayMode::default(),
                project_root: None,
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
                    auto_open: true,
                    overlay_defer_ms: 100,
                    overlay_mode: crate::config::OverlayMode::default(),
                    project_root: None,
                },
                false,
            )
            .check()
            .unwrap_err()
            .gate
        );
    }
}
