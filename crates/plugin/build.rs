#[cfg(feature = "visual-inspector")]
const COMMANDS: &[&str] = &[
    "get_state",
    "emit_state",
    "enable",
    "disable",
    "open",
    "close",
    "toggle",
    "clear_session",
    "set_target_webview",
    "pin_target_webview",
    "unpin_target_webview",
    "export_context",
    "capture",
    "revalidate",
    "copy_context_bundle",
    "copy_screenshot_image",
    "copy_screenshot_path",
    "open_screenshot_folder",
    "hard_reload",
    "report_selection",
    "set_issue_text",
    "set_primary_capture",
    "set_capture_included",
];

#[cfg(not(feature = "visual-inspector"))]
const COMMANDS: &[&str] = &[];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
