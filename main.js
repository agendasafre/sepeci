const GENDER_VALUES = ["Femenino", "Masculino", "No binario", "Otro"];
const academicUnits = window.ACADEMIC_UNITS || [];
const formConfig = window.FORM_CONFIG || {};

const form = document.querySelector("#enrollment-form");
const result = document.querySelector("#result");
const submitButton = document.querySelector("#submit-button");
const dniInput = document.querySelector("#dni");
const dniPreview = document.querySelector("#dni-preview");
const academicUnitSelect = document.querySelector("#academicUnit");
const academicUnitHint = document.querySelector("#academicUnit-hint");
const otherAcademicUnitField = document.querySelector("#otherAcademicUnit-field");
const otherAcademicUnitInput = document.querySelector("#otherAcademicUnit");
const successDialog = document.querySelector("#success-dialog");
const successDialogClose = document.querySelector("#success-dialog-close");
const SUBMIT_ENDPOINT = "/api/submit";

function getFormExpiryDate() {
  if (!formConfig.expiresAt) return null;
  const expiryDate = new Date(formConfig.expiresAt);
  return Number.isNaN(expiryDate.getTime()) ? null : expiryDate;
}

function isFormExpired() {
  const expiryDate = getFormExpiryDate();
  return expiryDate ? Date.now() >= expiryDate.getTime() : false;
}

function showExpiredMessage() {
  const splash = document.querySelector("#splash");
  const card = splash.querySelector(".splash__card");
  card.innerHTML = `
    <p class="eyebrow">Inscripción</p>
    <h1>Formulario cerrado</h1>
    <p class="splash__text">${formConfig.expiredMessage || "El formulario ya no se encuentra disponible."}</p>
  `;
}

function showForm() {
  if (isFormExpired()) {
    showExpiredMessage();
    return;
  }

  document.querySelector("#splash").hidden = true;
  document.querySelector("#form-view").hidden = false;
  document.querySelector("#firstNames").focus();
}

window.setTimeout(showForm, 2400);

function normalizeDni(value) {
  return String(value || "").replace(/[^0-9]/g, "").slice(0, 8);
}

function isOtherAcademicUnit(unitId) {
  return unitId === "otra-unidad-academica";
}

function renderAcademicUnitOptions(units) {
  academicUnitSelect.replaceChildren(new Option("Seleccioná una unidad", ""));

  for (const unit of units) {
    academicUnitSelect.add(new Option(unit.name, unit.id));
  }
}

function loadAcademicUnits() {
  if (!Array.isArray(academicUnits) || academicUnits.length === 0) {
    academicUnitSelect.disabled = true;
    academicUnitHint.textContent = "No se pudo cargar la lista de unidades académicas.";
    return;
  }

  renderAcademicUnitOptions(academicUnits);
  academicUnitSelect.disabled = false;
  academicUnitHint.textContent = "";
}

function updateOtherAcademicUnitVisibility() {
  const shouldShow = isOtherAcademicUnit(academicUnitSelect.value);
  otherAcademicUnitField.hidden = !shouldShow;
  otherAcademicUnitInput.required = shouldShow;

  if (!shouldShow) {
    otherAcademicUnitInput.value = "";
    setFieldError("otherAcademicUnit");
  }
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
  [
    "firstNames",
    "lastNames",
    "dni",
    "gender",
    "email",
    "phone",
    "academicUnit",
    "otherAcademicUnit",
    "placeOfBelonging",
  ].forEach((name) => setFieldError(name));
}

function validateForm(data) {
  const errors = {};
  const required = ["firstNames", "lastNames", "dni", "gender", "email", "phone", "academicUnit", "placeOfBelonging"];

  required.forEach((name) => {
    if (!String(data[name] || "").trim()) errors[name] = "Este campo es obligatorio.";
  });

  const dni = normalizeDni(data.dni);
  if (dni.length !== String(data.dni || "").replace(/[^0-9]/g, "").length) {
    errors.dni = "El DNI debe tener como máximo 8 números.";
  }
  if (dni && !/^[0-9]{7,8}$/.test(dni)) errors.dni = "Ingresá un DNI válido de 8 números.";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Ingresá un email válido.";
  if (data.phone && !/^[0-9+()\-\s]{6,40}$/.test(data.phone)) errors.phone = "Ingresá un teléfono válido.";
  if (data.gender && !GENDER_VALUES.includes(data.gender)) errors.gender = "Seleccioná una opción válida.";

  if (data.academicUnit && !academicUnits.some((unit) => unit.id === data.academicUnit)) {
    errors.academicUnit = "Seleccioná una unidad válida.";
  }

  if (isOtherAcademicUnit(data.academicUnit) && !String(data.otherAcademicUnit || "").trim()) {
    errors.otherAcademicUnit = "Indicá el nombre de la unidad académica.";
  }

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

function showSuccessPopup() {
  if (successDialog?.showModal) {
    successDialog.showModal();
  } else {
    window.alert("Tu inscripción fue recibida correctamente.");
  }
}

function isStaticFilePreview() {
  return window.location.protocol === "file:";
}

function applyServerFieldErrors(fields = {}) {
  Object.entries(fields).forEach(([name, message]) => setFieldError(name, message || "Revisá este campo."));
  const firstError = Object.keys(fields)[0];
  if (firstError && form.elements[firstError]) form.elements[firstError].focus();
}

loadAcademicUnits();
updateOtherAcademicUnitVisibility();

academicUnitSelect.addEventListener("change", updateOtherAcademicUnitVisibility);
successDialogClose.addEventListener("click", () => successDialog.close());

dniInput.addEventListener("input", () => {
  const normalized = normalizeDni(dniInput.value);
  dniInput.value = normalized;
  dniPreview.textContent = normalized ? `DNI: ${normalized}` : "Ingresá 8 números, sin puntos.";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  result.hidden = true;

  if (isFormExpired()) {
    document.querySelector("#form-view").hidden = true;
    document.querySelector("#splash").hidden = false;
    showExpiredMessage();
    return;
  }

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
      form.reset();
      updateOtherAcademicUnitVisibility();
      dniPreview.textContent = "Ingresá 8 números, sin puntos.";
      showSuccessPopup();
    } else if (response.status === 409 || body.status === "duplicate") {
      showResult("duplicate", "Ya existe una inscripción registrada con ese DNI.");
    } else if (response.status === 400 || body.status === "invalid") {
      applyServerFieldErrors(body.fields || {});
      showResult("invalid", "Revisá los campos marcados antes de enviar.");
    } else if (response.status === 410 || body.status === "expired") {
      document.querySelector("#form-view").hidden = true;
      document.querySelector("#splash").hidden = false;
      showExpiredMessage();
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
