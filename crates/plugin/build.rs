#[cfg(feature = "visual-inspector")]
const COMMANDS: &[&str] = &["get_state", "emit_state"];

#[cfg(not(feature = "visual-inspector"))]
const COMMANDS: &[&str] = &[];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
