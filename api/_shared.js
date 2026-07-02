const { ACADEMIC_UNITS } = require("../academic-units");
const { FORM_CONFIG } = require("../form-config");

const MAX_BODY_BYTES = 12 * 1024;

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

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isAllowedOrigin(req) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.origin;

  if (!allowedOrigin || !origin) return true;
  return origin === allowedOrigin;
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

function getAcademicUnits() {
  return ACADEMIC_UNITS;
}

function getFormConfig() {
  return FORM_CONFIG;
}

function getFormExpiryDate() {
  if (!FORM_CONFIG?.expiresAt) return null;
  const expiryDate = new Date(FORM_CONFIG.expiresAt);
  return Number.isNaN(expiryDate.getTime()) ? null : expiryDate;
}

function isFormExpired() {
  const expiryDate = getFormExpiryDate();
  return expiryDate ? Date.now() >= expiryDate.getTime() : false;
}

module.exports = {
  MAX_BODY_BYTES,
  send,
  setCors,
  isAllowedOrigin,
  getSupabaseConfig,
  getAcademicUnits,
  getFormConfig,
  isFormExpired,
};
