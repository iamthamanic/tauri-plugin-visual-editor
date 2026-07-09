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
];

#[cfg(not(feature = "visual-inspector"))]
const COMMANDS: &[&str] = &[];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
