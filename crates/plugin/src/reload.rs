//! Hard reload orchestration for host webviews.

use std::time::Duration;

use tauri::{AppHandle, Manager, Runtime, WebviewWindow};

use crate::config::VisualEditorConfig;
use crate::hub::InspectorHub;
use crate::webview::{activate_guest, bootstrap_guest, show_embedded_toolbar};

/// Reload a host webview, optionally clear cache, mark selections stale, restore guest UI.
pub fn hard_reload<R: Runtime>(
    app: &AppHandle<R>,
    hub: &InspectorHub,
    config: &VisualEditorConfig,
    webview_label: &str,
    clear_cache: bool,
) -> Result<(), String> {
    let webview = resolve_webview(app, webview_label)?;
    hub.mark_selections_stale_for_webview(webview_label);

    if clear_cache {
        webview
            .clear_all_browsing_data()
            .map_err(|e| format!("Cache leeren fehlgeschlagen: {e}"))?;
    }

    let overlay_open = hub.snapshot().inspector_window_open;
    let picker_enabled = hub.is_enabled();
    let uses_embedded = !config.uses_window_overlay();

    webview
        .reload()
        .map_err(|e| format!("reload failed: {e}"))?;

    if uses_embedded && (overlay_open || picker_enabled) {
        let defer_ms = config.overlay_defer_ms;
        schedule_embedded_restore(
            app.clone(),
            webview_label.to_string(),
            overlay_open,
            picker_enabled,
            defer_ms,
        );
    }

    hub.emit_state(app);
    Ok(())
}

fn resolve_webview<R: Runtime>(
    app: &AppHandle<R>,
    webview_label: &str,
) -> Result<WebviewWindow<R>, String> {
    app.get_webview_window(webview_label)
        .ok_or_else(|| format!("Unknown webview: {webview_label}"))
}

/// Toggle native WebView DevTools (debug builds only). Returns `true` when opened.
pub fn toggle_devtools<R: Runtime>(
    app: &AppHandle<R>,
    webview_label: &str,
) -> Result<bool, String> {
    #[cfg(not(debug_assertions))]
    {
        let _ = (app, webview_label);
        return Err("DevTools sind nur in Debug-Builds verfügbar.".into());
    }

    #[cfg(debug_assertions)]
    {
        let window = resolve_webview(app, webview_label)?;
        let open = if window.is_devtools_open() {
            window.close_devtools();
            false
        } else {
            window.open_devtools();
            true
        };
        Ok(open)
    }
}

const TOOLBAR_ROOT_ID: &str = "visual-editor-toolbar-root";
/// ~15s — heavy hosts (e.g. Scriptony) need time after cache-clear reload.
const RESTORE_MAX_ATTEMPTS: u32 = 150;

fn page_interactive<R: Runtime>(webview: &tauri::Webview<R>) -> bool {
    webview
        .eval(
            r#"if(document.readyState!=='complete'&&document.readyState!=='interactive')throw new Error('not-ready')"#,
        )
        .is_ok()
}

fn toolbar_mounted<R: Runtime>(webview: &tauri::Webview<R>) -> bool {
    webview
        .eval(&format!(
            r#"if(!document.getElementById('{TOOLBAR_ROOT_ID}'))throw new Error('missing-toolbar')"#,
        ))
        .is_ok()
}

fn schedule_embedded_restore<R: Runtime>(
    app: AppHandle<R>,
    label: String,
    show_toolbar: bool,
    activate_picker: bool,
    defer_ms: u64,
) {
    tauri::async_runtime::spawn(async move {
        let mut deferred = false;
        for _ in 0..RESTORE_MAX_ATTEMPTS {
            tokio::time::sleep(Duration::from_millis(100)).await;
            let Some(window) = app.get_webview_window(&label) else {
                continue;
            };
            let webview = window.as_ref();
            if !page_interactive(webview) {
                continue;
            }
            if !deferred && defer_ms > 0 {
                deferred = true;
                tokio::time::sleep(Duration::from_millis(defer_ms)).await;
            }
            if show_toolbar {
                if bootstrap_guest(webview).is_err() {
                    continue;
                }
                if show_embedded_toolbar(webview).is_err() {
                    continue;
                }
                if !toolbar_mounted(webview) {
                    continue;
                }
            } else if activate_picker && bootstrap_guest(webview).is_err() {
                continue;
            }
            if activate_picker {
                let _ = bootstrap_guest(webview);
                let _ = activate_guest(webview, &label);
                let hub = app.state::<InspectorHub>();
                let script = format!(
                    "window.__VISUAL_EDITOR_GUEST__?.configure({{ overlayColor: {:?}, cropPadding: {} }});",
                    hub.settings().overlay_color,
                    hub.settings().crop_padding
                );
                let _ = window.eval(&script);
            }
            hub_emit(&app);
            return;
        }

        // Fallback: host reload took longer than the poll window — force overlay reopen.
        if show_toolbar {
            crate::webview::open_overlay_for_app(&app);
        } else if activate_picker {
            let hub = app.state::<InspectorHub>();
            let _ = crate::webview::set_guest_active_for_app(&app, &hub, true);
            hub_emit(&app);
        }
    });
}

fn hub_emit<R: Runtime>(app: &AppHandle<R>) {
    let hub = app.state::<InspectorHub>();
    hub.emit_state(app);
}
