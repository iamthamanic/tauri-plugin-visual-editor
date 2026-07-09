//! Guest runtime injection into host webviews.

use tauri::{AppHandle, Manager, Runtime, Webview};

use crate::hub::INSPECTOR_WINDOW_LABEL;

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

pub fn set_guest_active_for_app<R: Runtime>(
    app: &AppHandle<R>,
    enabled: bool,
) -> Result<(), String> {
    for (label, webview) in app.webviews() {
        if label == INSPECTOR_WINDOW_LABEL {
            continue;
        }
        if enabled {
            activate_guest(&webview, label)?;
        } else {
            deactivate_guest(&webview)?;
        }
    }
    Ok(())
}
