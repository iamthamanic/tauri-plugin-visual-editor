//! Five-gate AND security model (feature, enabled, allow, capability, devMode).

use crate::config::VisualEditorConfig;

pub const LOG_TARGET: &str = "visual-editor::security";

/// Runtime gates evaluated before command handlers (capability is enforced by Tauri ACL).
#[derive(Debug, Clone)]
pub struct RuntimeGates {
    pub feature_compiled: bool,
    pub config: VisualEditorConfig,
    pub is_debug: bool,
}

/// Which runtime gate failed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Gate {
    Feature,
    ConfigEnabled,
    ConfigAllow,
    DevMode,
}

/// Structured denial for diagnostics and error messages.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GateDenial {
    pub gate: Gate,
    pub message: String,
}

impl GateDenial {
    pub fn message(&self) -> &str {
        &self.message
    }
}

impl RuntimeGates {
    pub fn new(config: VisualEditorConfig, is_debug: bool) -> Self {
        Self {
            feature_compiled: cfg!(feature = "visual-inspector"),
            config,
            is_debug,
        }
    }

    pub fn dev_mode_allowed(&self) -> bool {
        dev_mode_allowed(&self.config, self.is_debug)
    }

    pub fn check(&self) -> Result<(), GateDenial> {
        if !self.feature_compiled {
            return Err(denial(
                Gate::Feature,
                "visual-inspector Cargo feature is not enabled",
            ));
        }
        if !self.config.enabled {
            return Err(denial(
                Gate::ConfigEnabled,
                "plugins.visualEditor.enabled is false",
            ));
        }
        if !self.config.allow {
            return Err(denial(
                Gate::ConfigAllow,
                "plugins.visualEditor.allow is false",
            ));
        }
        if !self.dev_mode_allowed() {
            return Err(denial(
                Gate::DevMode,
                "release build requires plugins.visualEditor.allowInProduction=true",
            ));
        }
        Ok(())
    }
}

pub fn dev_mode_allowed(config: &VisualEditorConfig, is_debug: bool) -> bool {
    is_debug || config.allow_in_production
}

fn denial(gate: Gate, message: &str) -> GateDenial {
    GateDenial {
        gate,
        message: message.to_string(),
    }
}

/// Log a runtime gate denial (German-friendly prefix for host operators).
pub fn log_gate_denial(denial: &GateDenial) {
    eprintln!("[{LOG_TARGET}] gate={:?}: {}", denial.gate, denial.message);
}

/// Log when Tauri capability ACL denies a command (call from bridges/tests).
pub fn log_capability_denial(command: &str, detail: &str) {
    eprintln!("[{LOG_TARGET}] capability denied for command '{command}': {detail}");
}

pub fn gate_error(denial: GateDenial) -> String {
    log_gate_denial(&denial);
    denial.message
}

#[cfg(test)]
mod tests {
    use super::*;

    fn gates(config: VisualEditorConfig, is_debug: bool) -> RuntimeGates {
        RuntimeGates {
            feature_compiled: true,
            config,
            is_debug,
        }
    }

    fn open_config() -> VisualEditorConfig {
        VisualEditorConfig {
            enabled: true,
            allow: true,
            allow_in_production: false,
            project_root: None,
        }
    }

    #[test]
    fn all_runtime_gates_pass_in_debug() {
        assert!(gates(open_config(), true).check().is_ok());
    }

    #[test]
    fn release_blocked_without_production_override() {
        assert_eq!(
            gates(open_config(), false).check().unwrap_err().gate,
            Gate::DevMode
        );
    }

    #[test]
    fn allow_in_production_unlocks_release() {
        let config = VisualEditorConfig {
            allow_in_production: true,
            ..open_config()
        };
        assert!(gates(config, false).check().is_ok());
    }

    #[test]
    fn disabled_config_blocks() {
        let config = VisualEditorConfig {
            enabled: false,
            ..open_config()
        };
        assert_eq!(
            gates(config, true).check().unwrap_err().gate,
            Gate::ConfigEnabled
        );
    }

    #[test]
    fn disallowed_config_blocks() {
        let config = VisualEditorConfig {
            allow: false,
            ..open_config()
        };
        assert_eq!(
            gates(config, true).check().unwrap_err().gate,
            Gate::ConfigAllow
        );
    }

    #[test]
    fn feature_gate_blocks_when_not_compiled() {
        let mut g = gates(open_config(), true);
        g.feature_compiled = false;
        assert_eq!(g.check().unwrap_err().gate, Gate::Feature);
    }

    #[test]
    fn gate_combinations_matrix() {
        for enabled in [false, true] {
            for allow in [false, true] {
                for debug in [false, true] {
                    for prod in [false, true] {
                        let config = VisualEditorConfig {
                            enabled,
                            allow,
                            allow_in_production: prod,
                            project_root: None,
                        };
                        let ok = gates(config, debug).check().is_ok();
                        let expected = enabled && allow && (debug || prod);
                        assert_eq!(
                            ok, expected,
                            "enabled={enabled} allow={allow} debug={debug} prod={prod}"
                        );
                    }
                }
            }
        }
    }
}
