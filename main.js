const GENDER_VALUES = ["Femenino", "Masculino", "No binario", "Otro"];
const ACADEMIC_UNITS = window.MOCK_ACADEMIC_UNITS || [];

const form = document.querySelector("#enrollment-form");
const result = document.querySelector("#result");
const submitButton = document.querySelector("#submit-button");
const dniInput = document.querySelector("#dni");
const dniPreview = document.querySelector("#dni-preview");
const SUBMIT_ENDPOINT = "/api/submit";

function showForm() {
  document.querySelector("#splash").hidden = true;
  document.querySelector("#form-view").hidden = false;
  document.querySelector("#firstNames").focus();
}

window.setTimeout(showForm, 2400);

function normalizeDni(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function setFieldError(name, message = "") {
  const input = form.elements[name];
  const field = input?.closest(".field");
  const error = document.querySelector(`#${name}-error`);
  if (!field || !error) return;
  field.classList.toggle("has-error", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
}

function clearErrors() {
  ["firstNames", "lastNames", "dni", "gender", "email", "phone", "academicUnit", "placeOfBelonging"].forEach((name) =>
    setFieldError(name),
  );
}

function validateForm(data) {
  const errors = {};
  const required = ["firstNames", "lastNames", "dni", "gender", "email", "phone", "academicUnit", "placeOfBelonging"];

  required.forEach((name) => {
    if (!String(data[name] || "").trim()) errors[name] = "Este campo es obligatorio.";
  });

  const dni = normalizeDni(data.dni);
  if (dni && (dni.length < 7 || dni.length > 10)) errors.dni = "Ingresá un DNI válido, solo con números.";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Ingresá un email válido.";
  if (data.phone && !/^[0-9+()\-\s]{6,40}$/.test(data.phone)) errors.phone = "Ingresá un teléfono válido.";
  if (data.gender && !GENDER_VALUES.includes(data.gender)) errors.gender = "Seleccioná una opción válida.";
  if (data.academicUnit && !ACADEMIC_UNITS.includes(data.academicUnit)) errors.academicUnit = "Seleccioná una unidad válida.";

  return errors;
}

function collectFormData() {
  return Object.fromEntries(new FormData(form).entries());
}

function showResult(status, message) {
  result.hidden = false;
  result.className = `result result--${status}`;
  result.textContent = message;
}

function isStaticFilePreview() {
  return window.location.protocol === "file:";
}

function applyServerFieldErrors(fields = {}) {
  Object.entries(fields).forEach(([name, message]) => setFieldError(name, message || "Revisá este campo."));
  const firstError = Object.keys(fields)[0];
  if (firstError && form.elements[firstError]) form.elements[firstError].focus();
}

dniInput.addEventListener("input", () => {
  const normalized = normalizeDni(dniInput.value);
  dniPreview.textContent = normalized ? `DNI normalizado: ${normalized}` : "Se guardará normalizado solo con números.";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  result.hidden = true;

  const payload = collectFormData();
  const errors = validateForm(payload);
  if (Object.keys(errors).length > 0) {
    applyServerFieldErrors(errors);
    showResult("invalid", "Revisá los campos marcados antes de enviar.");
    return;
  }

  if (isStaticFilePreview()) {
    showResult(
      "local",
      "Esta vista local sirve para revisar la interfaz. Para enviar la inscripción, abrí el proyecto con `vercel dev` o usá la versión desplegada.",
    );
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando…";

  try {
    const response = await fetch(SUBMIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));

    if (response.status === 201 && body.status === "accepted") {
      showResult("success", "Tu inscripción fue recibida correctamente.");
      form.reset();
      dniPreview.textContent = "Se guardará normalizado solo con números.";
    } else if (response.status === 409 || body.status === "duplicate") {
      showResult("duplicate", "Ya existe una inscripción registrada con ese DNI.");
    } else if (response.status === 400 || body.status === "invalid") {
      applyServerFieldErrors(body.fields || {});
      showResult("invalid", "Revisá los campos marcados antes de enviar.");
    } else if (response.status === 429 || body.status === "rate_limited") {
      showResult("rate_limited", "Esperá unos minutos antes de volver a intentar.");
    } else {
      showResult("failed", "No pudimos completar la inscripción. Intentá nuevamente más tarde.");
    }
  } catch (_error) {
    showResult("network", "No pudimos conectar con el servidor. Revisá la conexión e intentá nuevamente.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar inscripción";
  }
});
