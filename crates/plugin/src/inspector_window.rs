//! Inspector overlay `WebviewWindow` lifecycle (`visual-inspector` label).

use tauri::{
    http::{Response, StatusCode},
    AppHandle, Manager, PhysicalPosition, Runtime, Url, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};

use crate::assets::{guess_mime, resolve_asset_path, InspectorAssets};
use crate::hub::INSPECTOR_WINDOW_LABEL;

pub const INSPECTOR_URL: &str = "tauri://visual-editor/index.html";

const OVERLAY_WIDTH: f64 = 72.0;
const OVERLAY_HEIGHT: f64 = 280.0;
const EDGE_MARGIN: f64 = 8.0;

pub fn protocol_response(path: &str) -> Response<Vec<u8>> {
    let asset_path = resolve_asset_path(path);
    match InspectorAssets::get(&asset_path) {
        Some(file) => Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", guess_mime(&asset_path))
            .header("Access-Control-Allow-Origin", "*")
            .body(file.data.into_owned())
            .unwrap_or_else(|_| not_found()),
        None => not_found(),
    }
}

fn not_found() -> Response<Vec<u8>> {
    Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(Vec::new())
        .unwrap()
}

fn inspector_url() -> Result<Url, String> {
    Url::parse(INSPECTOR_URL).map_err(|e| e.to_string())
}

pub fn label_conflict<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    let window = app.get_webview_window(INSPECTOR_WINDOW_LABEL)?;
    let url = window.url().ok()?.to_string();
    if url.starts_with("tauri://visual-editor") {
        return None;
    }
    Some(format!(
        "Das Webview-Label '{INSPECTOR_WINDOW_LABEL}' wird bereits von der Host-App verwendet (URL: {url})."
    ))
}

fn anchor_window<R: Runtime>(app: &AppHandle<R>) -> Option<WebviewWindow<R>> {
    app.webview_windows()
        .into_values()
        .find(|window| window.label() != INSPECTOR_WINDOW_LABEL)
}

pub fn position_overlay<R: Runtime>(app: &AppHandle<R>, overlay: &WebviewWindow<R>) {
    let Some(parent) = anchor_window(app) else {
        return;
    };
    let Ok(parent_pos) = parent.outer_position() else {
        return;
    };
    let Ok(parent_size) = parent.outer_size() else {
        return;
    };
    let Ok(overlay_size) = overlay.outer_size() else {
        return;
    };

    let x =
        parent_pos.x as f64 + parent_size.width as f64 - overlay_size.width as f64 - EDGE_MARGIN;
    let y = parent_pos.y as f64 + EDGE_MARGIN;
    let _ = overlay.set_position(PhysicalPosition::new(x as i32, y as i32));
}

pub fn ensure_overlay_open<R: Runtime>(app: &AppHandle<R>) {
    let config = app.state::<crate::config::VisualEditorConfig>();
    if !config.uses_window_overlay() {
        return;
    }

    if app.get_webview_window(INSPECTOR_WINDOW_LABEL).is_some() {
        if let Some(overlay) = app.get_webview_window(INSPECTOR_WINDOW_LABEL) {
            let _ = overlay.show();
            position_overlay(app, &overlay);
        }
        return;
    }

    let gates = app.state::<crate::security::RuntimeGates>();
    if let Err(denial) = gates.check() {
        eprintln!("visual-editor: overlay not opened — {}", denial.message());
        return;
    }

    match open_inspector_window(app) {
        Ok(overlay) => {
            if let Some(hub) = app.try_state::<crate::hub::InspectorHub>() {
                hub.open(false);
                hub.emit_state(app);
            }
            position_overlay(app, &overlay);
            let _ = overlay.show();
        }
        Err(err) => eprintln!("visual-editor: overlay open failed — {err}"),
    }
}

pub fn open_inspector_window<R: Runtime>(app: &AppHandle<R>) -> Result<WebviewWindow<R>, String> {
    if let Some(message) = label_conflict(app) {
        return Err(message);
    }

    if let Some(window) = app.get_webview_window(INSPECTOR_WINDOW_LABEL) {
        window
            .show()
            .map_err(|e| format!("Overlay anzeigen fehlgeschlagen: {e}"))?;
        position_overlay(app, &window);
        return Ok(window);
    }

    let url = WebviewUrl::External(inspector_url()?);
    let window = WebviewWindowBuilder::new(app, INSPECTOR_WINDOW_LABEL, url)
        .title("Visual Inspector")
        .decorations(false)
        .always_on_top(true)
        .resizable(false)
        .inner_size(OVERLAY_WIDTH, OVERLAY_HEIGHT)
        .visible(true)
        .build()
        .map_err(|e| format!("Overlay erstellen fehlgeschlagen: {e}"))?;
    position_overlay(app, &window);
    Ok(window)
}

pub fn close_inspector_window<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(INSPECTOR_WINDOW_LABEL) {
        window
            .hide()
            .map_err(|e| format!("Overlay ausblenden fehlgeschlagen: {e}"))?;
    }
    Ok(())
}

pub fn toggle_inspector_window<R: Runtime>(app: &AppHandle<R>) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window(INSPECTOR_WINDOW_LABEL) {
        let visible = window.is_visible().unwrap_or(true);
        if visible {
            window
                .hide()
                .map_err(|e| format!("Overlay ausblenden fehlgeschlagen: {e}"))?;
            return Ok(false);
        }
        window
            .show()
            .map_err(|e| format!("Overlay anzeigen fehlgeschlagen: {e}"))?;
        position_overlay(app, &window);
        return Ok(true);
    }
    let window = open_inspector_window(app)?;
    position_overlay(app, &window);
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn overlay_dimensions_are_positive() {
        assert!(OVERLAY_WIDTH > 0.0);
        assert!(OVERLAY_HEIGHT > 0.0);
    }
}
