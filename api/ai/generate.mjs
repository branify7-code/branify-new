/* GENERATED FILE — do not edit by hand. Source: server/ai/*.ts + lib/ai/*. Regenerate with `npm run api:build`. */

// lib/ai/omniroute.ts
var OmniRouteError = class extends Error {
  constructor(kind, message, status, detail) {
    super(message);
    this.name = "OmniRouteError";
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
};
var DEFAULT_TIMEOUT_MS = 6e4;
function getOmniRouteEnv() {
  const baseUrl = (process.env.OMNIROUTE_BASE_URL || "").trim().replace(/\/+$/, "");
  const apiKey = (process.env.OMNIROUTE_API_KEY || "").trim();
  if (!baseUrl) {
    throw new OmniRouteError(
      "config",
      "The AI gateway is not configured (missing OMNIROUTE_BASE_URL).",
      500,
      "Set OMNIROUTE_BASE_URL (e.g. http://localhost:20128/v1) in the server environment."
    );
  }
  if (!apiKey) {
    throw new OmniRouteError(
      "config",
      "The AI gateway is not configured (missing OMNIROUTE_API_KEY).",
      500,
      "Set OMNIROUTE_API_KEY to the OmniRoute client key created for BRANIFY."
    );
  }
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new OmniRouteError(
      "config",
      "The AI gateway is configured with an invalid OMNIROUTE_BASE_URL.",
      500,
      "OMNIROUTE_BASE_URL must start with http:// or https://."
    );
  }
  const parsedTimeout = Number(process.env.OMNIROUTE_TIMEOUT_MS || "");
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout >= 1e3 ? parsedTimeout : DEFAULT_TIMEOUT_MS;
  return { baseUrl, apiKey, timeoutMs };
}
function resolveDefaultModel() {
  const def = (process.env.OMNIROUTE_DEFAULT_MODEL || "").trim();
  if (def) return { model: def, source: "OMNIROUTE_DEFAULT_MODEL" };
  const blog = (process.env.OMNIROUTE_BLOG_MODEL || "").trim();
  if (blog) return { model: blog, source: "OMNIROUTE_BLOG_MODEL" };
  return { model: null, source: "unset" };
}
function modelAllowedByAllowlist(model) {
  const raw = (process.env.OMNIROUTE_ALLOWED_MODELS || "").trim();
  if (!raw) return false;
  return raw.split(",").map((m) => m.trim()).filter(Boolean).includes(model);
}
function redactSecrets(input) {
  let out = input;
  const key = (process.env.OMNIROUTE_API_KEY || "").trim();
  if (key && out.includes(key)) out = out.split(key).join("[redacted]");
  out = out.replace(/sk-[A-Za-z0-9_-]{6,}/g, "[redacted]");
  out = out.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]");
  return out;
}
function logSafe(...parts) {
  const line = parts.map((p) => typeof p === "string" ? p : JSON.stringify(p)).map((p) => typeof p === "string" ? redactSecrets(p) : p).join(" ");
  console.log(`[omniroute] ${line}`);
}
function mapHttpStatus(status, bodyPreview) {
  const detail = bodyPreview ? bodyPreview.slice(0, 400) : void 0;
  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      status: 502,
      message: "The AI gateway rejected this application\u2019s credentials.",
      detail
    };
  }
  if (status === 404) {
    return {
      kind: "model_not_found",
      status: 502,
      message: "The AI gateway does not know the requested model or combo.",
      detail
    };
  }
  if (status === 429) {
    return {
      kind: "rate_limit",
      status: 429,
      message: "The AI gateway is rate limiting requests. Please retry in a moment.",
      detail
    };
  }
  if (status === 400) {
    return {
      kind: "provider",
      status: 502,
      message: "The AI gateway rejected the request as invalid.",
      detail
    };
  }
  if (status >= 500) {
    return {
      kind: "provider",
      status: 502,
      message: "The AI gateway\u2019s upstream provider failed to complete the request.",
      detail
    };
  }
  return {
    kind: "provider",
    status: 502,
    message: `The AI gateway returned an unexpected status (${status}).`,
    detail
  };
}
async function generateWithOmniRoute(opts) {
  const env = getOmniRouteEnv();
  const { model, messages } = opts;
  if (!model || typeof model !== "string") {
    throw new OmniRouteError(
      "config",
      "No AI model was configured for this request.",
      500,
      "Pass a model/combo id or set OMNIROUTE_BLOG_MODEL / OMNIROUTE_DEFAULT_MODEL."
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new OmniRouteError("provider", "The AI request contained no messages.", 502);
  }
  const url = `${env.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutMs = opts.timeout_ms && opts.timeout_ms >= 1e3 ? opts.timeout_ms : env.timeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        ...opts.temperature !== void 0 ? { temperature: opts.temperature } : {},
        ...opts.max_tokens !== void 0 ? { max_tokens: opts.max_tokens } : {},
        ...opts.top_p !== void 0 ? { top_p: opts.top_p } : {},
        ...opts.stream ? { stream: true } : {}
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    const e = err;
    const isAbort = e.name === "AbortError" || String(e?.message || "").includes("abort");
    if (isAbort) {
      throw new OmniRouteError(
        "timeout",
        "The AI request timed out before the gateway responded.",
        504,
        `Aborted after ${timeoutMs}ms.`
      );
    }
    const causeCode = e.cause?.code || e.code || "";
    const causeMsg = e.cause?.message || "";
    throw new OmniRouteError(
      "unavailable",
      "The AI gateway could not be reached. It may be offline.",
      503,
      redactSecrets(`${causeCode ? `${causeCode} ` : ""}${causeMsg}`.trim())
    );
  }
  if (opts.stream) {
    if (!res.ok || !res.body) {
      clearTimeout(timer);
      const preview = await safeBodyPreview(res);
      const mapped = mapHttpStatus(res.status, preview);
      throw new OmniRouteError(mapped.kind, mapped.message, mapped.status, mapped.detail);
    }
    return { stream: true, body: res.body, content_type: res.headers.get("content-type") || "text/event-stream", status: res.status };
  }
  try {
    if (!res.ok) {
      const preview = await safeBodyPreview(res);
      const mapped = mapHttpStatus(res.status, preview);
      throw new OmniRouteError(mapped.kind, mapped.message, mapped.status, mapped.detail);
    }
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new OmniRouteError(
        "malformed",
        "The AI gateway returned a response that could not be parsed.",
        502,
        redactSecrets(text.slice(0, 200))
      );
    }
    const content = extractContent(json);
    const usageRaw = json.usage;
    const usage = usageRaw && typeof usageRaw === "object" ? usageRaw : null;
    return {
      stream: false,
      content,
      finish_reason: json.choices?.[0]?.finish_reason ?? null,
      model: json.model || model,
      usage
    };
  } finally {
    clearTimeout(timer);
  }
}
function extractContent(json) {
  const choices = json.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new OmniRouteError("malformed", "The AI gateway response had no completion choices.", 502);
  }
  const message = choices[0].message;
  const content = message && typeof message === "object" ? message.content : void 0;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new OmniRouteError("malformed", "The AI gateway response contained no message content.", 502);
  }
  return content;
}
async function safeBodyPreview(res) {
  try {
    const text = await res.text();
    return redactSecrets(text).slice(0, 400);
  } catch {
    return "";
  }
}

// lib/ai/routes.ts
var MAX_BODY_BYTES = 64 * 1024;
async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw new OmniRouteError("provider", "The AI request body was too large.", 413);
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw new OmniRouteError("provider", "The AI request body was not valid JSON.", 400);
  }
}
function errorResult(err) {
  if (err instanceof OmniRouteError) {
    return {
      status: err.status,
      json: { ok: false, error: { kind: err.kind, message: err.message, ...err.detail ? { detail: err.detail } : {} } }
    };
  }
  logSafe("unhandled error:", err instanceof Error ? redactSecrets(`${err.name}: ${err.message}`) : String(err));
  return {
    status: 500,
    json: { ok: false, error: { kind: "internal", message: "Something went wrong while handling the AI request." } }
  };
}
function okResult(status, json) {
  return { status, json: { ok: true, ...json } };
}
function requireMethod(req, method) {
  if (!req.method || req.method.toUpperCase() !== method) {
    return new OmniRouteError("provider", "Method not allowed for this AI endpoint.", 405);
  }
  return null;
}
async function handleAiGenerate(req) {
  const methodErr = requireMethod(req, "POST");
  if (methodErr) return errorResult(methodErr);
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return errorResult(err);
  }
  const fallback = resolveDefaultModel();
  const requested = typeof body.model === "string" ? body.model.trim() : "";
  let model;
  if (requested && requested !== fallback.model) {
    if (!modelAllowedByAllowlist(requested)) {
      return errorResult(new OmniRouteError(
        "provider",
        "The requested AI model is not available for this application.",
        400,
        "Add it to OMNIROUTE_ALLOWED_MODELS on the server to allow client overrides."
      ));
    }
    model = requested;
  } else if (fallback.model) {
    model = fallback.model;
  } else {
    return errorResult(new OmniRouteError(
      "config",
      "No AI model is configured. Set OMNIROUTE_BLOG_MODEL (or OMNIROUTE_DEFAULT_MODEL) in the server environment.",
      500
    ));
  }
  let messages;
  if (Array.isArray(body.messages)) {
    messages = body.messages.map((m) => {
      const rec = m && typeof m === "object" ? m : {};
      const rawRole = typeof rec.role === "string" ? rec.role : "";
      const role = rawRole === "system" || rawRole === "assistant" ? rawRole : "user";
      const content = typeof rec.content === "string" ? rec.content : "";
      return { role, content };
    }).filter((m) => m.content.length > 0).slice(0, 32);
  } else if (typeof body.prompt === "string" && body.prompt.trim()) {
    messages = [{ role: "user", content: body.prompt.trim().slice(0, 12e3) }];
  } else {
    return errorResult(new OmniRouteError("provider", "Provide a `prompt` string or a `messages` array.", 400));
  }
  const temperatureRaw = Number(body.temperature);
  const maxTokensRaw = Number(body.max_tokens);
  const baseOpts = {
    model,
    messages,
    temperature: Number.isFinite(temperatureRaw) ? Math.min(Math.max(temperatureRaw, 0), 2) : void 0,
    max_tokens: Number.isFinite(maxTokensRaw) ? Math.min(Math.max(Math.floor(maxTokensRaw), 16), 8e3) : void 0
  };
  try {
    if (body.stream === true) {
      const result2 = await generateWithOmniRoute({ ...baseOpts, stream: true });
      return {
        status: 0,
        json: null,
        stream: { body: result2.body, contentType: result2.content_type, status: result2.status }
      };
    }
    const result = await generateWithOmniRoute(baseOpts);
    logSafe(`generate ok (model=${result.model}, chars=${result.content.length})`);
    return okResult(200, {
      content: result.content,
      model: result.model,
      finish_reason: result.finish_reason,
      usage: result.usage
    });
  } catch (err) {
    return errorResult(err);
  }
}
function sendJson(res, result) {
  if (res.headersSent) return;
  const body = JSON.stringify(result.json);
  res.writeHead(result.status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}
function sendStream(res, result) {
  if (res.headersSent || !result.stream) return;
  res.writeHead(result.stream.status, {
    "Content-Type": result.stream.contentType,
    "Cache-Control": "no-store"
  });
  const reader = result.stream.body.getReader();
  const pump = () => reader.read().then(({ done, value }) => {
    if (done) {
      res.end();
      return;
    }
    res.write(Buffer.from(value));
    return pump();
  }).catch(() => {
    try {
      res.end();
    } catch {
    }
  });
  void pump();
}

// server/ai/generate.ts
async function handler(req, res) {
  try {
    const result = await handleAiGenerate(req);
    if (result.stream) sendStream(res, result);
    else sendJson(res, result);
  } catch (err) {
    sendJson(res, {
      status: 500,
      json: { ok: false, error: { kind: "internal", message: "Something went wrong while handling the AI request." } }
    });
    void err;
  }
}
export {
  handler as default
};
