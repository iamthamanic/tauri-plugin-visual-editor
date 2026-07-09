/**
 * Hub snapshot types mirrored from Rust `HubSnapshot`.
 * Location: packages/inspector-app/src/types.ts
 */

export type Visibility = 'visible' | 'partially_visible' | 'outside_viewport';
export type ElementStatus = 'valid' | 'stale_after_reload' | 'not_found' | 'webview_closed';
export type WebviewStatus = 'active' | 'closed';

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

export type CaptureType = 'window' | 'webview' | 'element' | 'region';

export type Capture = {
  id: string;
  path: string;
  capture_type: CaptureType;
  webview_id: string | null;
  device_pixel_ratio: number;
  screenshot_size_physical: [number, number];
  viewport_size_css: [number, number];
  crop_bounds_css: Bounds | null;
  crop_padding_css: number | null;
  include_in_copy: boolean;
};

export type WebViewRegistration = {
  id: string;
  label: string;
  window_label: string;
  url: string;
  status: WebviewStatus;
};

export type InspectionTarget = {
  webview_id: string;
  pinned: boolean;
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
  webviews: WebViewRegistration[];
  active_target: InspectionTarget | null;
};

export type ActionState = 'idle' | 'loading' | 'success' | 'error';
