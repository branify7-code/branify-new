// TEMP DIAGNOSTIC — probe 2: imports verifyAdmin/CORS_ORIGINS from api/gsc.ts
import { verifyAdmin, CORS_ORIGINS } from '../../../gsc';

export default async function handler(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return impl.apply(null, arguments as unknown as any[]);
}

function impl(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }): void {
  res.status(200).json({
    ok: true,
    probe: 'gsc-import',
    verifyAdminType: typeof verifyAdmin,
    origins: CORS_ORIGINS.length,
  });
}
