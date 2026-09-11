// TEMP PROBE: re-baseline (exact copy of the previously-working bare probe)
export default async function handler(): Promise<void> {
  return impl.apply(null, arguments as unknown as any[]);
}
function impl(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }): void {
  res.status(200).json({ ok: true, probe: 'ping2-baseline', time: new Date().toISOString() });
}
