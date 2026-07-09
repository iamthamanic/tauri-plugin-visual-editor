//! Native screenshot capture, crop, and PNG persistence.

use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use image::{imageops, RgbaImage};
use tauri::{AppHandle, Manager, Runtime, WebviewWindow};
use tauri_plugin_visual_editor_core::types::{Bounds, Capture, CaptureType};
use tokio::time::{timeout, Duration};

use crate::hub::InspectorHub;
use crate::models::CaptureOptions;
use crate::paths;

pub const CAPTURE_TIMEOUT_SECS: u64 = 5;
pub const DEFAULT_CROP_PADDING_CSS: u32 = 24;

/// Expand CSS bounds by padding on all sides.
pub fn bounds_with_padding(bounds: &Bounds, padding_css: u32) -> Bounds {
    let pad = padding_css as f64;
    Bounds {
        x: bounds.x - pad,
        y: bounds.y - pad,
        width: bounds.width + pad * 2.0,
        height: bounds.height + pad * 2.0,
    }
}

/// Convert CSS bounds to physical pixel crop `(x, y, width, height)`.
pub fn css_to_physical_crop(bounds: &Bounds, dpr: f64) -> (u32, u32, u32, u32) {
    let x = (bounds.x * dpr).floor().max(0.0) as u32;
    let y = (bounds.y * dpr).floor().max(0.0) as u32;
    let width = (bounds.width * dpr).ceil().max(1.0) as u32;
    let height = (bounds.height * dpr).ceil().max(1.0) as u32;
    (x, y, width, height)
}

/// Crop an RGBA buffer, clamping to image bounds.
pub fn crop_rgba(
    img: &RgbaImage,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
) -> Result<RgbaImage, String> {
    let (img_w, img_h) = img.dimensions();
    if x >= img_w || y >= img_h {
        return Err("Crop region is outside the screenshot".into());
    }
    let w = width.min(img_w - x);
    let h = height.min(img_h - y);
    if w == 0 || h == 0 {
        return Err("Crop region has zero size".into());
    }
    Ok(imageops::crop_imm(img, x, y, w, h).to_image())
}

fn parse_mode(mode: &str) -> CaptureType {
    match mode {
        "window" => CaptureType::Window,
        "element" => CaptureType::Element,
        "region" => CaptureType::Region,
        _ => CaptureType::Webview,
    }
}

fn capture_id() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("shot_{secs}")
}

fn capture_window_rgba(window: &WebviewWindow<impl Runtime>) -> Result<RgbaImage, String> {
    let title = window.title().map_err(|e| e.to_string())?;
    let windows = xcap::Window::all().map_err(|e| format!("xcap enumerate failed: {e}"))?;
    let target = windows
        .into_iter()
        .find(|w| w.title().unwrap_or_default() == title)
        .ok_or_else(|| format!("No capture target for window title '{title}'"))?;
    target
        .capture_image()
        .map_err(|e| format!("native window capture failed: {e}"))
}

fn save_png(img: &RgbaImage, path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    img.save(path).map_err(|e| format!("save png failed: {e}"))
}

#[derive(Debug, Clone)]
struct CaptureContext {
    window_label: String,
    webview_id: String,
    dpr: f64,
    viewport_css: (u32, u32),
}

fn resolve_context(hub: &InspectorHub, options: &CaptureOptions) -> CaptureContext {
    let snap = hub.snapshot();
    let webview_id = options
        .webview_id
        .clone()
        .or_else(|| snap.active_target.as_ref().map(|t| t.webview_id.clone()))
        .unwrap_or_else(|| "main".into());

    let window_label = snap
        .webviews
        .iter()
        .find(|w| w.id == webview_id)
        .map(|w| w.window_label.clone())
        .unwrap_or_else(|| webview_id.clone());

    let dpr = options.device_pixel_ratio.unwrap_or(1.0).max(1.0);
    let viewport_css = options.viewport_size_css.unwrap_or((1440, 900));

    CaptureContext {
        window_label,
        webview_id,
        dpr,
        viewport_css,
    }
}

fn capture_sync<R: Runtime>(
    app: &AppHandle<R>,
    settings: &crate::settings::PersistentSettings,
    config: &crate::config::VisualEditorConfig,
    ctx: CaptureContext,
    options: CaptureOptions,
) -> Result<Capture, String> {
    let mode = parse_mode(&options.mode);
    let window = app
        .get_webview_window(&ctx.webview_id)
        .or_else(|| app.get_webview_window(&ctx.window_label))
        .ok_or_else(|| format!("Webview window not found: {}", ctx.webview_id))?;

    let mut rgba = capture_window_rgba(&window)?;

    let (crop_bounds_css, crop_padding_css) = match mode {
        CaptureType::Element => {
            let bounds = options
                .css_bounds
                .map(Into::into)
                .ok_or_else(|| "element capture requires css_bounds from guest".to_string())?;
            let padding = options.crop_padding_css.unwrap_or(settings.crop_padding);
            let padded = bounds_with_padding(&bounds, padding);
            let (x, y, w, h) = css_to_physical_crop(&padded, ctx.dpr);
            rgba = crop_rgba(&rgba, x, y, w, h)?;
            (Some(bounds), Some(padding))
        }
        CaptureType::Region => {
            let bounds = options
                .region_bounds
                .map(Into::into)
                .ok_or_else(|| "region capture requires region_bounds".to_string())?;
            let (x, y, w, h) = css_to_physical_crop(&bounds, ctx.dpr);
            rgba = crop_rgba(&rgba, x, y, w, h)?;
            (Some(bounds), None)
        }
        _ => (None, None),
    };

    let id = capture_id();
    let dir = paths::screenshots_dir(app, settings, config)?;
    let file_path: PathBuf = dir.join(format!("{id}.png"));
    save_png(&rgba, &file_path)?;

    let (out_w, out_h) = rgba.dimensions();
    Ok(Capture {
        id,
        path: file_path.to_string_lossy().into_owned(),
        capture_type: mode,
        webview_id: Some(ctx.webview_id),
        device_pixel_ratio: ctx.dpr,
        screenshot_size_physical: (out_w, out_h),
        viewport_size_css: ctx.viewport_css,
        crop_bounds_css,
        crop_padding_css,
        include_in_copy: true,
    })
}

/// Capture with 5s timeout; session is updated only after success.
pub async fn capture_with_timeout<R: Runtime>(
    app: AppHandle<R>,
    hub: &InspectorHub,
    options: CaptureOptions,
) -> Result<Capture, String> {
    let ctx = resolve_context(hub, &options);
    let settings = hub.settings();
    let config = crate::config::from_app(&app);
    let app_clone = app.clone();

    timeout(
        Duration::from_secs(CAPTURE_TIMEOUT_SECS),
        tauri::async_runtime::spawn_blocking(move || {
            capture_sync(&app_clone, &settings, &config, ctx, options)
        }),
    )
    .await
    .map_err(|_| format!("Screenshot capture timed out after {CAPTURE_TIMEOUT_SECS}s"))?
    .map_err(|e| e.to_string())?
}

impl From<crate::models::BoundsDto> for Bounds {
    fn from(value: crate::models::BoundsDto) -> Self {
        Bounds {
            x: value.x,
            y: value.y,
            width: value.width,
            height: value.height,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn padding_expands_bounds() {
        let padded = bounds_with_padding(
            &Bounds {
                x: 10.0,
                y: 20.0,
                width: 100.0,
                height: 50.0,
            },
            24,
        );
        assert_eq!(padded.x, -14.0);
        assert_eq!(padded.width, 148.0);
    }

    #[test]
    fn physical_crop_scales_with_dpr() {
        let (x, y, w, h) = css_to_physical_crop(
            &Bounds {
                x: 10.0,
                y: 20.0,
                width: 100.0,
                height: 50.0,
            },
            2.0,
        );
        assert_eq!((x, y, w, h), (20, 40, 200, 100));
    }

    #[test]
    fn crop_clamps_to_image() {
        let img = RgbaImage::new(100, 80);
        let cropped = crop_rgba(&img, 90, 70, 20, 20).unwrap();
        assert_eq!(cropped.dimensions(), (10, 10));
    }
}
