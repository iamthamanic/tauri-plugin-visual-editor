import { INSPECTOR_ATTRIBUTES } from './constants.js';

export type InspectorMetadata = {
  component: string;
  file: string;
  id: string;
  entity?: string;
};

export { INSPECTOR_ATTRIBUTES };

export function createInspectorAttributes(metadata: InspectorMetadata): Record<string, string> {
  const attrs: Record<string, string> = {
    [INSPECTOR_ATTRIBUTES.component]: metadata.component,
    [INSPECTOR_ATTRIBUTES.file]: metadata.file,
    [INSPECTOR_ATTRIBUTES.id]: metadata.id,
  };
  if (metadata.entity) {
    attrs[INSPECTOR_ATTRIBUTES.entity] = metadata.entity;
  }
  return attrs;
}

export function setInspectorMetadata(element: HTMLElement, metadata: InspectorMetadata): void {
  Object.entries(createInspectorAttributes(metadata)).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

export function getInspectorMetadata(element: HTMLElement): Partial<InspectorMetadata> {
  return {
    component: element.getAttribute(INSPECTOR_ATTRIBUTES.component) ?? undefined,
    file: element.getAttribute(INSPECTOR_ATTRIBUTES.file) ?? undefined,
    id: element.getAttribute(INSPECTOR_ATTRIBUTES.id) ?? undefined,
    entity: element.getAttribute(INSPECTOR_ATTRIBUTES.entity) ?? undefined,
  };
}
