(function exposeFormConfig(globalScope) {
  const formConfig = {
    // Desde las 00:00 de esta fecha el formulario deja de mostrarse.
    // Cambiá solo este valor cuando definas la fecha final.
    expiresAt: "2026-12-31T00:00:00-03:00",
    expiredMessage: "El formulario de inscripción ya no se encuentra disponible.",
  };

  if (globalScope) {
    globalScope.FORM_CONFIG = formConfig;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { FORM_CONFIG: formConfig };
  }
})(typeof window !== "undefined" ? window : globalThis);
