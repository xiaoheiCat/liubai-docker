let diff = 0

export function getTime(): number {
  return Date.now() + diff
}

export function getTimezone(): string {
  return (-new Date().getTimezoneOffset() / 60).toFixed(1)
}

export async function calibrateTime(apiDomain: string): Promise<void> {
  const url = `${normalizeApiDomain(apiDomain)}hello-world`
  const t1 = Date.now()
  const res = await fetch(url, { method: "POST", signal: AbortSignal.timeout(10_000) })
  const t2 = Date.now()
  const json = (await res.json()) as { code?: string; data?: { stamp?: number } }
  if (json.code !== "0000" || !json.data?.stamp) return
  const clientStamp = Math.round((t2 + t1) / 2)
  diff = json.data.stamp - clientStamp
}

function normalizeApiDomain(domain: string): string {
  return domain.endsWith("/") ? domain : `${domain}/`
}
