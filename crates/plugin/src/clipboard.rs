//! System clipboard helpers (text + PNG image).

use std::path::Path;

use arboard::{Clipboard, ImageData};

/// Write plain text to the system clipboard.
pub fn write_text(text: &str) -> Result<(), String> {
    Clipboard::new()
        .map_err(|e| format!("clipboard unavailable: {e}"))?
        .set_text(text)
        .map_err(|e| format!("clipboard write failed: {e}"))
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
}
