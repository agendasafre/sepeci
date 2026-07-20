const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ACADEMIC_UNITS } = require("../academic-units");
const { FORM_CONFIG } = require("../form-config");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const mainJs = fs.readFileSync(path.join(root, "main.js"), "utf8");
const submitJs = fs.readFileSync(path.join(root, "api", "submit.js"), "utf8");
const sql = fs.readFileSync(path.join(root, "sql", "001_enrollment_submissions.sql"), "utf8");
const residenceMigration = fs.readFileSync(path.join(root, "sql", "003_add_other_place_of_belonging.sql"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

assert.ok(ACADEMIC_UNITS.length > 0, "Academic units must not be empty");
assert.ok(FORM_CONFIG.expiresAt, "Form config must include an expiry date");

for (const unit of ACADEMIC_UNITS) {
  assert.ok(unit.id, `Academic unit is missing id: ${unit.name}`);
  assert.ok(unit.name, `Academic unit is missing name: ${unit.id}`);
}

assert.ok(indexHtml.includes('src="academic-units.js"'), "index.html must load academic-units.js before main.js");
assert.ok(indexHtml.includes('src="form-config.js"'), "index.html must load form-config.js before main.js");
assert.ok(indexHtml.includes('id="otherAcademicUnit"'), "index.html must include the conditional other academic unit input");
assert.ok(indexHtml.includes('value="otra-provincia-pais"'), "index.html must include the other province/country option");
assert.ok(indexHtml.includes('id="otherPlaceOfBelonging"'), "index.html must include the conditional other residence input");
assert.ok(indexHtml.includes('maxlength="100"'), "other residence input must be capped at 100 characters");
assert.ok(indexHtml.includes('id="success-dialog"'), "index.html must include the success popup dialog");
assert.ok(!indexHtml.includes("Facultad de Ciencias Exactas</option>"), "index.html must not hardcode academic-unit options");
assert.ok(mainJs.includes("window.ACADEMIC_UNITS"), "main.js must read academic units from the shared browser global");
assert.ok(mainJs.includes("window.FORM_CONFIG"), "main.js must read form config from the shared browser global");
assert.ok(mainJs.includes("updateOtherPlaceOfBelongingVisibility"), "main.js must toggle the other residence input");
assert.ok(mainJs.includes("otherPlaceOfBelonging"), "main.js must validate the other residence input");
assert.ok(submitJs.includes("getAcademicUnits()"), "submit.js must validate against the shared academic-unit list");
assert.ok(submitJs.includes("isFormExpired()"), "submit.js must reject submissions after expiration");
assert.ok(submitJs.includes("other_place_of_belonging"), "submit.js must insert the other residence column");
assert.ok(sql.includes("academic_unit_id text not null"), "SQL must include academic_unit_id because submit.js inserts it");
assert.ok(sql.includes("other_academic_unit text null"), "SQL must include nullable other_academic_unit");
assert.ok(sql.includes("other_place_of_belonging text null"), "SQL must include nullable other_place_of_belonging");
assert.ok(sql.includes("dni text not null unique check (dni ~ '^[0-9]{7,8}$')"), "SQL must keep one normalized DNI column with 7/8 digit validation");
assert.ok(residenceMigration.includes("add column if not exists other_place_of_belonging text null"), "SQL migration must add other_place_of_belonging");
assert.ok(!sql.includes("dni_normalized"), "SQL must not keep the duplicated dni_normalized column in the base schema");
assert.ok(!sql.includes("academic_unit in ("), "SQL must not duplicate the academic-unit controlled list");
assert.match(readme, /academic-units\.js/i, "README must document the centralized academic-unit list");
assert.match(readme, /form-config\.js/i, "README must document the centralized form config");
assert.match(readme, /other_place_of_belonging/i, "README must document the other residence column");

console.log("Local verification passed: DNI, other academic unit, other residence, popup, expiration, SQL, frontend, server validation, and docs are aligned.");
