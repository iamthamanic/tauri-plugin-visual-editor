/** Hub snapshot types mirrored from Rust `HubSnapshot`. */

export type Visibility = 'visible' | 'partially_visible' | 'outside_viewport';
export type ElementStatus = 'valid' | 'stale_after_reload' | 'not_found' | 'webview_closed';

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ElementSnapshot = {
  webview_id: string;
  tag: string;
  text: string | null;
  attributes: Array<[string, string]>;
  dom_path: string;
  visibility: Visibility;
  css_bounds: Bounds;
  physical_bounds: Bounds;
  visible_bounds: Bounds | null;
  full_bounds: Bounds | null;
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
  status: ElementStatus;
  linked_capture_id: string | null;
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
  webviews: unknown[];
  active_target: unknown | null;
  settings: unknown;
};
