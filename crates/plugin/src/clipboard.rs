//! System clipboard helpers (text + PNG image).

use std::path::Path;

use arboard::{Clipboard, ImageData};
use base64::{engine::general_purpose::STANDARD, Engine as _};

/// Write plain text to the system clipboard.
pub fn write_text(text: &str) -> Result<(), String> {
    Clipboard::new()
        .map_err(|e| format!("clipboard unavailable: {e}"))?
        .set_text(text)
        .map_err(|e| format!("clipboard write failed: {e}"))
}

/// Composer clipboard: plain-text composer plus optional screenshot (HTML rich paste).
pub fn write_composer(text: &str, image_path: Option<&Path>) -> Result<(), String> {
    if let Some(path) = image_path {
        if let Ok(bytes) = std::fs::read(path) {
            let b64 = STANDARD.encode(bytes);
            let html_body = colorize_composer_html(text);
            let html = format!(
                r#"<meta charset="utf-8"><div><img src="data:image/png;base64,{b64}" alt="screenshot"/></div><pre style="font-family:ui-monospace,monospace;font-size:12px;white-space:pre-wrap">{html_body}</pre>"#
            );
            if Clipboard::new()
                .and_then(|mut cb| cb.set_html(html, Some(text.to_string())))
                .is_ok()
            {
                return Ok(());
            }
        }
    }
    write_text(text)
}

fn colorize_composer_html(text: &str) -> String {
    text.lines()
        .map(|line| {
            let escaped = escape_html(line);
            if line.contains("Screenshot #") || line.contains("image attached") {
                format!(r#"<span style="color:#3fb950">{escaped}</span>"#)
            } else if line.starts_with('[') && line.contains("selector:") {
                format!(r#"<span style="color:#58a6ff">{escaped}</span>"#)
            } else {
                escaped
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn escape_html(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// Write a PNG file to the system clipboard as an image.
pub fn write_png_file(path: &Path) -> Result<(), String> {
    let bytes = std::fs::read(path).map_err(|e| format!("read screenshot failed: {e}"))?;
    let img = image::load_from_memory(&bytes).map_err(|e| format!("decode png failed: {e}"))?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    Clipboard::new()
        .map_err(|e| format!("clipboard unavailable: {e}"))?
        .set_image(ImageData {
            width: width as usize,
            height: height as usize,
            bytes: rgba.into_raw().into(),
        })
        .map_err(|e| format!("clipboard image write failed: {e}"))
}

/// Write a filesystem path string to the text clipboard.
pub fn write_path(path: &Path) -> Result<(), String> {
    write_text(&path.to_string_lossy())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn write_text_accepts_empty_string() {
        // May fail in headless CI without clipboard — skip error on unavailable.
        if let Err(err) = write_text("") {
            assert!(err.contains("clipboard"));
        }
    }

    #[test]
    fn escape_html_encodes_special_chars() {
        assert_eq!(escape_html("<h4>"), "&lt;h4&gt;");
    }

    #[test]
    fn colorize_composer_html_marks_element_and_capture_lines() {
        let text = "[<button> | selector: button | dom: html > body > button]\n[Screenshot #1 | path: /tmp/a.png | image attached]";
        let html = colorize_composer_html(text);
        assert!(html.contains("color:#58a6ff"));
        assert!(html.contains("color:#3fb950"));
        assert!(html.contains("selector: button"));
        assert!(html.contains("path: /tmp/a.png"));
    }
}
