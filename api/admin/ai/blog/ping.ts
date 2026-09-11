// TEMP DIAGNOSTIC — probe 1: fully self-contained function (no imports, no maxDuration)
export default async function handler(): Promise<void> {
  // @vercel/node passes (req, res); use a loose signature for the probe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return handlerImpl.apply(null, arguments as unknown as any[]);
}

function handlerImpl(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }): void {
  res.status(200).json({ ok: true, probe: 'bare', time: new Date().toISOString() });
}
