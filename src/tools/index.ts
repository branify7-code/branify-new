// Tools index — binds the 136-entry registry (mirrored from branify.store)
// to real client-side implementations. slug → ToolDefinition.
import type { ToolDefinition, ToolField } from './types';
import type { ToolRegistryEntry } from '../data/toolsRegistry';
import { toolsRegistry } from '../data/toolsRegistry';
import { pdfTools } from './pdfTools';
import { imageTools } from './imageTools';
import { textTools } from './textTools';
import { devTools } from './devTools';
import { seoTools } from './seoTools';
import { businessTools } from './businessTools';
import { financeTools } from './financeTools';
import { marketingTools } from './marketingTools';
import { securityTools } from './securityTools';

const implementations: ToolDefinition[] = [
  ...pdfTools,
  ...imageTools,
  ...textTools,
  ...devTools,
  ...seoTools,
  ...businessTools,
  ...financeTools,
  ...marketingTools,
  ...securityTools,
];

/** slug → definition lookup */
const definitionMap = new Map<string, ToolDefinition>(
  implementations.map((t) => [t.slug, t])
);

export interface CompleteTool extends ToolRegistryEntry {
  definition: ToolDefinition;
}

/** All 136 tools with their executable definitions, in live-site registry order.
 *  Rebuilt when admin content overrides land ('branify:overrides'): overrides
 *  mutate toolsRegistry AFTER first paint (render is no longer blocked on
 *  them), so the derived list must refresh. ES live bindings + the App-level
 *  re-render make the new array visible to every consumer. */
function buildAllTools(): CompleteTool[] {
  return toolsRegistry.map((entry) => {
    const definition =
      definitionMap.get(entry.slug) ||
      ({ slug: entry.slug, fields: [], run: () => ({ output: entry.description }) } as ToolDefinition);
    return { ...entry, definition };
  });
}

export let allTools: CompleteTool[] = buildAllTools();

if (typeof window !== 'undefined') {
  window.addEventListener('branify:overrides', () => {
    allTools = buildAllTools();
  });
}

export const getCompleteTool = (slug: string): CompleteTool | undefined =>
  allTools.find((t) => t.slug === slug);

export const defaultsFor = (fields: ToolField[]): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const f of fields) out[f.name] = f.default as string | number | boolean;
  return out;
};

export type { ToolDefinition, ToolField, ToolResult, ToolRunContext, ToolFieldValue } from './types';
