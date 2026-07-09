//! Tauri command handlers for the visual editor plugin.

use tauri::{command, AppHandle, Runtime, State};

use crate::hub::InspectorHub;
use crate::models::HubSnapshot;

#[command]
pub fn get_state(hub: State<'_, InspectorHub>) -> Result<HubSnapshot, String> {
    Ok(hub.snapshot())
}

#[command]
pub fn emit_state<R: Runtime>(
    app: AppHandle<R>,
    hub: State<'_, InspectorHub>,
) -> Result<(), String> {
    hub.emit_state(&app);
    Ok(())
}
