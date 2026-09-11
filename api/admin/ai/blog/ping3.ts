// TEMP PROBE: baseline + maxDuration export
export const maxDuration = 60;
export default async function handler(): Promise<void> {
  return impl.apply(null, arguments as unknown as any[]);
}
function impl(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }): void {
  res.status(200).json({ ok: true, probe: 'ping3-maxduration' });
}
