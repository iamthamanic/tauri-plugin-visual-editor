import type { ReactNode } from 'react';
import { createInspectorAttributes, type InspectorMetadata } from './index.js';

export type InspectorMetaProps = InspectorMetadata & {
  children: ReactNode;
};

export function InspectorMeta({ children, ...metadata }: InspectorMetaProps) {
  const attrs = createInspectorAttributes(metadata);
  return <span {...attrs}>{children}</span>;
}
