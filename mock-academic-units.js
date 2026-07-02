const MOCK_ACADEMIC_UNITS = [
  "Rectorado",
  "Facultad de Ciencias Exactas",
  "Facultad de Ciencias Humanas",
  "Facultad de Ciencias Sociales",
  "Facultad de Ingeniería",
  "Otra unidad académica",
];

if (typeof window !== "undefined") {
  window.MOCK_ACADEMIC_UNITS = MOCK_ACADEMIC_UNITS;
}

if (typeof module !== "undefined") {
  module.exports = { MOCK_ACADEMIC_UNITS };
}
