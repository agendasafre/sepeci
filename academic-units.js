(function exposeAcademicUnits(globalScope) {
  const academicUnits = [
    { id: "rectorado", name: "Rectorado" },
    { id: "facultad-ciencias-exactas", name: "Facultad de Ciencias Exactas" },
    { id: "facultad-ciencias-humanas", name: "Facultad de Ciencias Humanas" },
    { id: "facultad-ciencias-sociales", name: "Facultad de Ciencias Sociales" },
    { id: "facultad-ingenieria", name: "Facultad de Ingeniería" },
    { id: "otra-unidad-academica", name: "Otra unidad académica" },
  ];

  if (globalScope) {
    globalScope.ACADEMIC_UNITS = academicUnits;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ACADEMIC_UNITS: academicUnits };
  }
})(typeof window !== "undefined" ? window : globalThis);
