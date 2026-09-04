// Tool execution framework types.
// Every tool in the registry gets a ToolDefinition: declarative form fields
// plus an async run() that executes 100% client-side (privacy-first).

export type ToolFieldValue = string | number | boolean;

export type ToolField =
  | {
      name: string;
      label: string;
      type: 'number';
      default: number;
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: 'text';
      default: string;
      placeholder?: string;
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: 'select';
      default: string;
      options: { value: string; label: string }[];
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: 'textarea';
      default: string;
      placeholder?: string;
      rows?: number;
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: 'checkbox';
      default: boolean;
      hint?: string;
    };

export interface ToolRunContext {
  /** Rendered form values keyed by field name. */
  values: Record<string, ToolFieldValue>;
  /** Uploaded files keyed by input name (usually 'file'). */
  files: Record<string, File | undefined>;
  /** Data URLs of uploaded images / files keyed by input name. */
  dataUrls: Record<string, string | undefined>;
}

export interface ToolResult {
  /** Primary text output (rendered in styled output panel or textarea). */
  output?: string;
  /** Structured JSON output (pretty printed). */
  json?: unknown;
  /** Image output (data URL) — rendered with a Download Image button. */
  imageDataUrl?: string;
  /** Ready-made data URL for file downloads (e.g. decoded PDF). */
  downloadDataUrl?: string;
  /** Download name for image/file outputs. */
  downloadName?: string;
  downloadMime?: string;
  /** Small note displayed under the output panel. */
  note?: string;
}

export interface ToolDefinition {
  slug: string;
  /** Form fields rendered in the "Input & Configuration" grid. */
  fields: ToolField[];
  /** File accept attribute for upload zones. */
  accept?: string;
  /** Human hint shown under the upload zone. */
  fileHint?: string;
  /** Whether RUN requires an uploaded file/image first. */
  requiresFile?: boolean;
  /** Executes the tool. Must be pure client-side. */
  run: (ctx: ToolRunContext) => ToolResult | Promise<ToolResult>;
}

export const num = (v: ToolFieldValue | undefined, fallback = 0): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

export const str = (v: ToolFieldValue | undefined, fallback = ''): string =>
  typeof v === 'string' ? v : v === undefined || v === null ? fallback : String(v);

export const bool = (v: ToolFieldValue | undefined, fallback = false): boolean =>
  typeof v === 'boolean' ? v : v === undefined ? fallback : String(v) === 'true';
