//! Guest runtime injection into host webviews.

use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager, Runtime, Webview};

use crate::config::VisualEditorConfig;
use crate::hub::{InspectorHub, INSPECTOR_WINDOW_LABEL};
use crate::security::RuntimeGates;

const GUEST_RUNTIME: &str = include_str!("../guest/guest-runtime.iife.js");

fn inject_runtime<R: Runtime>(webview: &Webview<R>) -> Result<(), String> {
    let script = format!("if(!window.__VISUAL_EDITOR_GUEST__){{{}}}", GUEST_RUNTIME);
    webview
        .eval(&script)
        .map_err(|e| format!("guest runtime injection failed: {e}"))
}

pub fn bootstrap_guest<R: Runtime>(webview: &Webview<R>) -> Result<(), String> {
    inject_runtime(webview)
}

pub fn show_embedded_toolbar<R: Runtime>(webview: &Webview<R>) -> Result<(), String> {
    bootstrap_guest(webview)?;
    webview
        .eval("window.__VISUAL_EDITOR_GUEST__?.openToolbar();")
        .map_err(|e| format!("embedded toolbar show failed: {e}"))
}

pub fn hide_embedded_toolbar<R: Runtime>(webview: &Webview<R>) -> Result<(), String> {
    webview
        .eval("window.__VISUAL_EDITOR_GUEST__?.closeToolbar();")
        .map_err(|e| format!("embedded toolbar hide failed: {e}"))
}

pub fn show_embedded_toolbar_for_app<R: Runtime>(
    app: &AppHandle<R>,
    hub: &InspectorHub,
) -> Result<(), String> {
    for reg in hub.snapshot().webviews {
        if reg.label == INSPECTOR_WINDOW_LABEL {
            continue;
        }
        let Some(window) = app.get_webview_window(&reg.label) else {
            continue;
        };
        show_embedded_toolbar(window.as_ref())?;
    }
    Ok(())
}

pub fn hide_embedded_toolbar_for_app<R: Runtime>(
    app: &AppHandle<R>,
    hub: &InspectorHub,
) -> Result<(), String> {
    for reg in hub.snapshot().webviews {
        if reg.label == INSPECTOR_WINDOW_LABEL {
            continue;
        }
        let Some(window) = app.get_webview_window(&reg.label) else {
            continue;
        };
        hide_embedded_toolbar(window.as_ref())?;
    }
    Ok(())
}

/// Show overlay UI according to `overlayMode` (embedded toolbar or window).
pub fn open_overlay_for_app<R: Runtime>(app: &AppHandle<R>) {
    let config = app.state::<VisualEditorConfig>();
    let hub = app.state::<InspectorHub>();
    hub.open(false);
    if config.uses_window_overlay() {
        crate::inspector_window::ensure_overlay_open(app);
    } else if let Err(err) = show_embedded_toolbar_for_app(app, &hub) {
        eprintln!("visual-editor: embedded toolbar failed — {err}");
    }
    hub.emit_state(app);
}

/// Auto-open overlay when `autoOpen` is enabled in plugin config.
pub fn maybe_auto_open_overlay<R: Runtime>(app: &AppHandle<R>) {
    let gates = app.state::<RuntimeGates>();
    if gates.check().is_err() {
        return;
    }
    let config = app.state::<VisualEditorConfig>();
    if !config.auto_open {
        return;
    }
    let app = app.clone();
    let defer_ms = config.overlay_defer_ms;
    tauri::async_runtime::spawn(async move {
        if defer_ms > 0 {
            tokio::time::sleep(Duration::from_millis(defer_ms)).await;
        }
        open_overlay_for_app(&app);
    });
}

pub fn activate_guest<R: Runtime>(webview: &Webview<R>, webview_id: &str) -> Result<(), String> {
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
            bootstrap_guest(window.as_ref())?;
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

const SUSPEND_CAPTURE_UI: &str = r#"
(function(){
  if (typeof window.__VISUAL_EDITOR_SUSPEND_CAPTURE_UI__ === 'function') {
    window.__VISUAL_EDITOR_SUSPEND_CAPTURE_UI__();
    return;
  }
  document.querySelectorAll('[data-visual-editor-capture-hide]').forEach(function(el){
    if (!(el instanceof HTMLElement) || el.dataset.veCaptureHidden === 'true') return;
    el.dataset.veCaptureHidden = 'true';
    el.dataset.veCapturePrevDisplay = el.style.display;
    el.style.display = 'none';
  });
})();
"#;

const RESUME_CAPTURE_UI: &str = r#"
(function(){
  if (typeof window.__VISUAL_EDITOR_RESUME_CAPTURE_UI__ === 'function') {
    window.__VISUAL_EDITOR_RESUME_CAPTURE_UI__();
    return;
  }
  document.querySelectorAll('[data-visual-editor-capture-hide]').forEach(function(el){
    if (!(el instanceof HTMLElement) || el.dataset.veCaptureHidden !== 'true') return;
    el.style.display = el.dataset.veCapturePrevDisplay || '';
    delete el.dataset.veCaptureHidden;
    delete el.dataset.veCapturePrevDisplay;
  });
})();
"#;

/// Tracks overlay visibility while a native screenshot is taken.
pub struct CaptureUiGuard {
    inspector_was_visible: bool,
}

impl CaptureUiGuard {
    /// Hide embedded DOM overlays and the inspector window before capture.
    pub fn suspend<R: Runtime>(app: &AppHandle<R>, hub: &InspectorHub) -> Self {
        let inspector_was_visible = app
            .get_webview_window(INSPECTOR_WINDOW_LABEL)
            .and_then(|w| w.is_visible().ok())
            .unwrap_or(false);

        if inspector_was_visible {
            let _ = crate::inspector_window::close_inspector_window(app);
        }

        for reg in hub.snapshot().webviews {
            if reg.label == INSPECTOR_WINDOW_LABEL {
                continue;
            }
            let Some(window) = app.get_webview_window(&reg.label) else {
                continue;
            };
            let _ = window.eval(SUSPEND_CAPTURE_UI);
        }

        thread::sleep(Duration::from_millis(100));

        Self {
            inspector_was_visible,
        }
    }

    /// Restore UI hidden for capture.
    pub fn resume<R: Runtime>(self, app: &AppHandle<R>, hub: &InspectorHub) {
        for reg in hub.snapshot().webviews {
            if reg.label == INSPECTOR_WINDOW_LABEL {
                continue;
            }
            let Some(window) = app.get_webview_window(&reg.label) else {
                continue;
            };
            let _ = window.eval(RESUME_CAPTURE_UI);
        }

        if self.inspector_was_visible {
            crate::inspector_window::ensure_overlay_open(app);
        }
    }
}
