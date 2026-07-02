const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ACADEMIC_UNITS } = require("../academic-units");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const mainJs = fs.readFileSync(path.join(root, "main.js"), "utf8");
const submitJs = fs.readFileSync(path.join(root, "api", "submit.js"), "utf8");
const sql = fs.readFileSync(path.join(root, "sql", "001_enrollment_submissions.sql"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

assert.ok(ACADEMIC_UNITS.length > 0, "Academic units must not be empty");

for (const unit of ACADEMIC_UNITS) {
  assert.ok(unit.id, `Academic unit is missing id: ${unit.name}`);
  assert.ok(unit.name, `Academic unit is missing name: ${unit.id}`);
}

assert.ok(indexHtml.includes('src="academic-units.js"'), "index.html must load academic-units.js before main.js");
assert.ok(!indexHtml.includes("Facultad de Ciencias Exactas</option>"), "index.html must not hardcode academic-unit options");
assert.ok(mainJs.includes("window.ACADEMIC_UNITS"), "main.js must read academic units from the shared browser global");
assert.ok(submitJs.includes("getAcademicUnits()"), "submit.js must validate against the shared academic-unit list");
assert.ok(sql.includes("academic_unit_id text not null"), "SQL must include academic_unit_id because submit.js inserts it");
assert.ok(!sql.includes("academic_unit in ("), "SQL must not duplicate the academic-unit controlled list");
assert.match(readme, /academic-units\.js/i, "README must document the centralized academic-unit list");

console.log("Local verification passed: centralized academic units, SQL columns, frontend, server validation, and docs are aligned.");
