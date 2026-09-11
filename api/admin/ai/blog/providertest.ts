// TEMP DIAGNOSTIC — probe 3: imports from server/ai + maxDuration export
import { resolveProvider, wordCountOf } from '../../../../server/ai/aiProvider';
import { BRANIFY_SYSTEM_PROMPT } from '../../../../server/ai/aiPrompt';

export const maxDuration = 60;

export default async function handler(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return impl.apply(null, arguments as unknown as any[]);
}

function impl(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }): void {
  res.status(200).json({
    ok: true,
    probe: 'server-ai-import',
    promptLen: BRANIFY_SYSTEM_PROMPT.length,
    words: wordCountOf('<p>one two three</p>'),
    providerConfigured: (() => { try { resolveProvider(); return true; } catch { return false; } })(),
  });
}
