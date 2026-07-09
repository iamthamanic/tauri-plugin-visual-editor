//! Guest runtime injection into host webviews.

use tauri::{AppHandle, Manager, Runtime, Webview};

use crate::hub::{InspectorHub, INSPECTOR_WINDOW_LABEL};

const GUEST_RUNTIME: &str = include_str!("../guest/guest-runtime.iife.js");

fn inject_runtime<R: Runtime>(webview: &Webview<R>) -> Result<(), String> {
    webview
        .eval(GUEST_RUNTIME)
        .map_err(|e| format!("guest runtime injection failed: {e}"))
}

pub fn activate_guest<R: Runtime>(webview: &Webview<R>, webview_id: &str) -> Result<(), String> {
    inject_runtime(webview)?;
    let script = format!("window.__VISUAL_EDITOR_GUEST__?.activate({webview_id:?});");
    webview
        .eval(&script)
        .map_err(|e| format!("guest activate failed: {e}"))
}

pub fn deactivate_guest<R: Runtime>(webview: &Webview<R>) -> Result<(), String> {
    webview
        .eval("window.__VISUAL_EDITOR_GUEST__?.deactivate();")
        .map_err(|e| format!("guest deactivate failed: {e}"))
}

fn guest_settings_script(hub: &InspectorHub) -> String {
    let settings = hub.settings();
    format!(
        "window.__VISUAL_EDITOR_GUEST__?.configure({{ overlayColor: {:?}, cropPadding: {} }});",
        settings.overlay_color, settings.crop_padding
    )
}

pub fn apply_guest_settings_for_app<R: Runtime>(
    app: &AppHandle<R>,
    hub: &InspectorHub,
) -> Result<(), String> {
    let script = guest_settings_script(hub);
    for reg in hub.snapshot().webviews {
        if reg.label == INSPECTOR_WINDOW_LABEL {
            continue;
        }
        let Some(window) = app.get_webview_window(&reg.label) else {
            continue;
        };
        window
            .eval(&script)
            .map_err(|e| format!("guest settings apply failed: {e}"))?;
    }
    Ok(())
}

pub fn set_guest_active_for_app<R: Runtime>(
    app: &AppHandle<R>,
    hub: &InspectorHub,
    enabled: bool,
) -> Result<(), String> {
    for reg in hub.snapshot().webviews {
        if reg.label == INSPECTOR_WINDOW_LABEL {
            continue;
        }
        let Some(window) = app.get_webview_window(&reg.label) else {
            continue;
        };
        if enabled {
            activate_guest(window.as_ref(), &reg.id)?;
            let script = guest_settings_script(hub);
            window
                .eval(&script)
                .map_err(|e| format!("guest settings apply failed: {e}"))?;
        } else {
            deactivate_guest(window.as_ref())?;
        }
    }
    Ok(())
}
