/**
 * Hub snapshot types for the embedded toolbar (mirrors Rust hub state).
 * Location: packages/guest/src/toolbar-types.ts
 */

export type ElementSnapshot = {
  webview_id: string;
  tag: string;
  text: string | null;
  attributes: Array<[string, string]>;
  dom_path: string;
  visibility: string;
  css_bounds: { x: number; y: number; width: number; height: number };
  computed_layout: Array<[string, string]>;
};

export type SelectedElement = {
  id: string;
  snapshot: ElementSnapshot;
  selector: string;
  component: string | null;
  file: string | null;
  inspector_id: string | null;
  entity: string | null;
  status: string;
};

export type Capture = {
  id: string;
  path: string;
  capture_type: string;
  include_in_copy: boolean;
};

export type HubSnapshot = {
  enabled: boolean;
  inspector_window_open: boolean;
  session: {
    selected_elements: SelectedElement[];
    captures: Capture[];
    primary_capture_id: string | null;
    issue_text: string | null;
  };
};
