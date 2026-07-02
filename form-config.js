(function exposeFormConfig(globalScope) {
  const formConfig = {
    expiresAt: "2026-07-30T00:00:00-03:00",
    expiredMessage:
      "El formulario de inscripción ya no se encuentra disponible.",
  };

  if (globalScope) {
    globalScope.FORM_CONFIG = formConfig;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { FORM_CONFIG: formConfig };
  }
})(typeof window !== "undefined" ? window : globalThis);
