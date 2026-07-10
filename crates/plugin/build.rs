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
    "toggle_devtools",
    "report_selection",
    "notify_navigation",
    "set_issue_text",
    "remove_element",
    "remove_capture",
    "set_primary_capture",
    "set_capture_included",
    "save_capture_image",
    "read_capture_image",
    "update_settings",
];

#[cfg(not(feature = "visual-inspector"))]
const COMMANDS: &[&str] = &[];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
