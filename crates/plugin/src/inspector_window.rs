//! Inspector `WebviewWindow` lifecycle (`visual-inspector` label).

use tauri::{
    http::{Response, StatusCode},
    AppHandle, Manager, Runtime, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

use crate::assets::{guess_mime, resolve_asset_path, InspectorAssets};
use crate::hub::INSPECTOR_WINDOW_LABEL;

pub const INSPECTOR_URL: &str = "tauri://visual-editor/index.html";

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

pub fn open_inspector_window<R: Runtime>(app: &AppHandle<R>) -> Result<WebviewWindow<R>, String> {
    if let Some(message) = label_conflict(app) {
        return Err(message);
    }

    if let Some(window) = app.get_webview_window(INSPECTOR_WINDOW_LABEL) {
        window
            .show()
            .map_err(|e| format!("Inspector-Fenster anzeigen fehlgeschlagen: {e}"))?;
        window
            .set_focus()
            .map_err(|e| format!("Inspector-Fokus setzen fehlgeschlagen: {e}"))?;
        return Ok(window);
    }

    let url = WebviewUrl::External(inspector_url()?);
    WebviewWindowBuilder::new(app, INSPECTOR_WINDOW_LABEL, url)
        .title("Visual Inspector")
        .inner_size(420.0, 720.0)
        .resizable(true)
        .build()
        .map_err(|e| format!("Inspector-Fenster erstellen fehlgeschlagen: {e}"))
}

pub fn close_inspector_window<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(INSPECTOR_WINDOW_LABEL) {
        window
            .hide()
            .map_err(|e| format!("Inspector-Fenster schließen fehlgeschlagen: {e}"))?;
    }
    Ok(())
}

pub fn toggle_inspector_window<R: Runtime>(app: &AppHandle<R>) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window(INSPECTOR_WINDOW_LABEL) {
        let visible = window.is_visible().unwrap_or(true);
        if visible {
            window
                .hide()
                .map_err(|e| format!("Inspector-Fenster ausblenden fehlgeschlagen: {e}"))?;
            return Ok(false);
        }
        window
            .show()
            .map_err(|e| format!("Inspector-Fenster anzeigen fehlgeschlagen: {e}"))?;
        return Ok(true);
    }
    open_inspector_window(app)?;
    Ok(true)
}
