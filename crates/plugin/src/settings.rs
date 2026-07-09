//! Persistent inspector settings loaded from disk.

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, Runtime};

use crate::config::VisualEditorConfig;
use crate::screenshot::DEFAULT_CROP_PADDING_CSS;

pub const SETTINGS_FILE: &str = "visual-editor/settings.json";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    #[default]
    System,
    Light,
    Dark,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum ScreenshotDirMode {
    #[default]
    AppData,
    Project,
    Temp,
    AbsolutePath,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PersistentSettings {
    pub theme: ThemeMode,
    pub shortcut: String,
    pub overlay_color: String,
    pub crop_padding: u32,
    pub screenshot_dir: ScreenshotDirMode,
    pub screenshot_absolute_path: Option<String>,
}

impl Default for PersistentSettings {
    fn default() -> Self {
        Self {
            theme: ThemeMode::System,
            shortcut: "CommandOrControl+Shift+I".into(),
            overlay_color: "#3b82f6".into(),
            crop_padding: DEFAULT_CROP_PADDING_CSS,
            screenshot_dir: ScreenshotDirMode::AppData,
            screenshot_absolute_path: None,
        }
    }
}

impl PersistentSettings {
    pub fn validate(&self) -> Result<(), String> {
        const ALLOWED_PADDING: [u32; 5] = [0, 8, 16, 24, 48];
        if !ALLOWED_PADDING.contains(&self.crop_padding) {
            return Err(format!(
                "cropPadding muss einer von {:?} sein",
                ALLOWED_PADDING
            ));
        }
        if !self.overlay_color.starts_with('#') || self.overlay_color.len() < 4 {
            return Err("overlayColor muss ein gültiger Hex-Farbwert sein".into());
        }
        if self.screenshot_dir == ScreenshotDirMode::AbsolutePath
            && self
                .screenshot_absolute_path
                .as_ref()
                .map(|p| p.trim().is_empty())
                .unwrap_or(true)
        {
            return Err("screenshotDir absolutePath erfordert einen absoluten Pfad".into());
        }
        Ok(())
    }

    pub fn merge_patch(&mut self, patch: &PersistentSettingsPatch) {
        if let Some(theme) = patch.theme {
            self.theme = theme;
        }
        if let Some(shortcut) = &patch.shortcut {
            self.shortcut = shortcut.clone();
        }
        if let Some(overlay_color) = &patch.overlay_color {
            self.overlay_color = overlay_color.clone();
        }
        if let Some(crop_padding) = patch.crop_padding {
            self.crop_padding = crop_padding;
        }
        if let Some(screenshot_dir) = patch.screenshot_dir {
            self.screenshot_dir = screenshot_dir;
        }
        if patch.screenshot_absolute_path.is_some() {
            self.screenshot_absolute_path = patch.screenshot_absolute_path.clone();
        }
    }
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PersistentSettingsPatch {
    pub theme: Option<ThemeMode>,
    pub shortcut: Option<String>,
    pub overlay_color: Option<String>,
    pub crop_padding: Option<u32>,
    pub screenshot_dir: Option<ScreenshotDirMode>,
    pub screenshot_absolute_path: Option<String>,
}

fn settings_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| e.to_string())
        .map(|dir| dir.join(SETTINGS_FILE))
}

pub fn load_settings<R: Runtime>(app: &AppHandle<R>) -> PersistentSettings {
    let path = match settings_path(app) {
        Ok(path) => path,
        Err(_) => return PersistentSettings::default(),
    };
    let Ok(raw) = fs::read_to_string(&path) else {
        return PersistentSettings::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn save_settings<R: Runtime>(
    app: &AppHandle<R>,
    settings: &PersistentSettings,
) -> Result<(), String> {
    settings.validate()?;
    let path = settings_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

pub fn resolve_screenshots_dir<R: Runtime>(
    app: &AppHandle<R>,
    settings: &PersistentSettings,
    config: &VisualEditorConfig,
) -> Result<PathBuf, String> {
    match settings.screenshot_dir {
        ScreenshotDirMode::AppData => app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())
            .map(|dir| dir.join(crate::paths::SCREENSHOTS_DIR_NAME)),
        ScreenshotDirMode::Project => {
            let root = config
                .project_root
                .as_deref()
                .filter(|p| !p.is_empty())
                .ok_or_else(|| {
                    "screenshotDir project erfordert projectRoot in der Plugin-Konfiguration"
                        .to_string()
                })?;
            Ok(PathBuf::from(root).join("visual-editor/screenshots"))
        }
        ScreenshotDirMode::Temp => Ok(std::env::temp_dir().join("visual-editor/screenshots")),
        ScreenshotDirMode::AbsolutePath => {
            let path = settings
                .screenshot_absolute_path
                .as_deref()
                .filter(|p| !p.is_empty())
                .ok_or_else(|| {
                    "screenshotDir absolutePath erfordert einen absoluten Pfad".to_string()
                })?;
            Ok(PathBuf::from(path))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_settings_are_valid() {
        PersistentSettings::default().validate().unwrap();
    }

    #[test]
    fn rejects_invalid_crop_padding() {
        let mut settings = PersistentSettings::default();
        settings.crop_padding = 12;
        assert!(settings.validate().is_err());
    }
}
