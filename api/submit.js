const GENDER_VALUES = ["Femenino", "Masculino", "No binario", "Otro"];
const { MOCK_ACADEMIC_UNITS: ACADEMIC_UNITS } = require("../mock-academic-units");

const MAX_BODY_BYTES = 12 * 1024;
const rateLimitHits = new Map();

function normalizeDni(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function send(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function setCors(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.origin;

  if (allowedOrigin && origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getClientKey(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function isRateLimited(req) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const maxHits = Number(process.env.RATE_LIMIT_MAX || 10);
  const now = Date.now();
  const key = getClientKey(req);
  const record = rateLimitHits.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  rateLimitHits.set(key, record);
  return record.count > maxHits;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);

  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Payload too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function validatePayload(payload) {
  const fields = {};
  const clean = {};

  for (const key of ["firstNames", "lastNames", "dni", "gender", "email", "phone", "academicUnit", "placeOfBelonging"]) {
    clean[key] = String(payload[key] || "").trim();
    if (!clean[key]) fields[key] = "Este campo es obligatorio.";
  }

  const dniNormalized = normalizeDni(clean.dni);
  if (dniNormalized.length < 7 || dniNormalized.length > 10) fields.dni = "Ingresá un DNI válido.";
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) fields.email = "Ingresá un email válido.";
  if (clean.phone && !/^[0-9+()\-\s]{6,40}$/.test(clean.phone)) fields.phone = "Ingresá un teléfono válido.";
  if (clean.gender && !GENDER_VALUES.includes(clean.gender)) fields.gender = "Seleccioná una opción válida.";
  if (clean.academicUnit && !ACADEMIC_UNITS.includes(clean.academicUnit)) fields.academicUnit = "Seleccioná una unidad válida.";

  return { fields, clean, dniNormalized };
}

async function insertSubmission(clean, dniNormalized) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/enrollment_submissions`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      first_names: clean.firstNames,
      last_names: clean.lastNames,
      dni: clean.dni,
      dni_normalized: dniNormalized,
      gender: clean.gender,
      email: clean.email,
      phone: clean.phone,
      academic_unit: clean.academicUnit,
      place_of_belonging: clean.placeOfBelonging,
      metadata: {},
    }),
  });

  if (response.ok) return;

  const errorBody = await response.json().catch(() => ({}));
  const error = new Error("Supabase insert failed");
  error.code = errorBody.code;
  error.statusCode = response.status;
  throw error;
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    send(res, 405, { status: "failed" });
    return;
  }

  if (isRateLimited(req)) {
    send(res, 429, { status: "rate_limited" });
    return;
  }

  if (Number(req.headers["content-length"] || 0) > MAX_BODY_BYTES) {
    send(res, 400, { status: "invalid", fields: {} });
    return;
  }

  if (!String(req.headers["content-type"] || "").includes("application/json")) {
    send(res, 400, { status: "invalid", fields: {} });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    if (String(payload.website || "").trim()) {
      send(res, 429, { status: "rate_limited" });
      return;
    }

    const { fields, clean, dniNormalized } = validatePayload(payload);
    if (Object.keys(fields).length > 0) {
      send(res, 400, { status: "invalid", fields });
      return;
    }

    await insertSubmission(clean, dniNormalized);
    send(res, 201, { status: "accepted" });
  } catch (error) {
    if (error.statusCode === 413) {
      send(res, 400, { status: "invalid", fields: {} });
      return;
    }

    if (error.code === "23505" || error.statusCode === 409) {
      send(res, 409, { status: "duplicate" });
      return;
    }

    send(res, 500, { status: "failed" });
  }
};
