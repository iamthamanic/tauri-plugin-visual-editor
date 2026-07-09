export type InspectorMetadata = {
  component: string;
  file: string;
  id: string;
  entity?: string;
};

const ATTR = {
  component: 'data-inspector-component',
  file: 'data-inspector-file',
  id: 'data-inspector-id',
  entity: 'data-inspector-entity',
} as const;

export function createInspectorAttributes(metadata: InspectorMetadata): Record<string, string> {
  const attrs: Record<string, string> = {
    [ATTR.component]: metadata.component,
    [ATTR.file]: metadata.file,
    [ATTR.id]: metadata.id,
  };
  if (metadata.entity) {
    attrs[ATTR.entity] = metadata.entity;
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
    component: element.getAttribute(ATTR.component) ?? undefined,
    file: element.getAttribute(ATTR.file) ?? undefined,
    id: element.getAttribute(ATTR.id) ?? undefined,
    entity: element.getAttribute(ATTR.entity) ?? undefined,
  };
}

export { InspectorMeta, type InspectorMetaProps } from './react.js';
