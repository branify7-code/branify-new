// =============================================================================
// BRANIFY ADMIN — AI Image Generation client (browser side, Phase 3)
// -----------------------------------------------------------------------------
// Talks to the serverless endpoint /api/admin/ai/image/generate (mirrors the
// social/aiBlog client pattern). The browser sends only the visual brief;
// GEMINI_API_KEY stays server-side and the browser receives the STORED public
// URL + metadata only — never raw image bytes, never credentials.
// =============================================================================

import { supabase } from '../../lib/supabase';

// In local dev (sandbox preview) there is no /api route — call the live
// endpoint (CORS-allowlisted). Compiled out of production builds.
const DEV = Boolean((import.meta as { env?: Record<string, unknown> }).env?.DEV);
const BASE = DEV ? 'https://branify.store/api/admin/ai/image' : '/api/admin/ai/image';

// ------------------------------------------------------------------ types (strict)
export type ImageAspectRatio = 'auto' | '1:1' | '4:5' | '16:9' | '9:16';
export type ImageSize = '1K' | '2K' | '4K';
export type ImageVisualStyle = 'auto' | 'professional' | 'editorial' | '3d' | 'photorealistic' | 'minimal';
export type ImagePurpose = 'social_post' | 'blog' | 'manual';

export interface GenerateImageRequest {
  /** Visual description. Optional when `brief` is provided (the AI crafts it). */
  prompt?: string;
  /** Topic / caption the visual supports — used to craft the prompt when empty. */
  brief?: string;
  aspectRatio?: ImageAspectRatio;
  imageSize?: ImageSize;
  visualStyle?: ImageVisualStyle;
  purpose?: ImagePurpose;
  platform?: 'facebook' | 'instagram' | 'both';
}

export interface GeneratedImageAsset {
  imageUrl: string;
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  prompt: string;
  altText: string;
  provider: string;
  model: string;
  filename: string;
  sizeBytes: number;
  mediaId: string;
  durationMs: number;
}

export type GenerateImageResponse = GeneratedImageAsset;

export class AiImageError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ------------------------------------------------------------------ call
const REQUEST_TIMEOUT_MS = 150_000;

async function adminToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new AiImageError('unauthorized', 401, 'Sign in to BRANIFY Admin first.');
  return token;
}

/** Generate ONE image (server uploads it to the media library and returns the URL). */
export async function generateAiImage(payload: GenerateImageRequest): Promise<GeneratedImageAsset> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await adminToken()}` },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message || ''));
    throw new AiImageError(aborted ? 'timeout' : 'network', aborted ? 504 : 502,
      aborted
        ? 'Image generation took too long and was stopped. Try again.'
        : 'Could not reach the image service. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  let json: { ok?: boolean; data?: GeneratedImageAsset; error?: { code: string; message: string } } | null = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || !json?.ok || !json.data) {
    const code = json?.error?.code || (res.status === 404 ? 'service_missing' : 'upstream');
    const message = json?.error?.message
      || (code === 'service_missing'
        ? 'The image service is not reachable yet — deploy the latest build or retry in a minute.'
        : 'Image generation is temporarily unavailable. Please try again.');
    throw new AiImageError(code, res.status, message);
  }
  return json.data;
}

/** Default aspect ratio for a platform/purpose pair (mirrors the server). */
export function defaultAspect(platform?: 'facebook' | 'instagram' | 'both', purpose?: ImagePurpose): ImageAspectRatio {
  if (purpose === 'blog') return '16:9';
  if (platform === 'instagram') return '4:5';
  return '1:1';
}
