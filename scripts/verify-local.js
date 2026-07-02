const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { MOCK_ACADEMIC_UNITS } = require("../mock-academic-units");

const root = path.join(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");

assert.ok(MOCK_ACADEMIC_UNITS.length > 0, "Mock academic units must not be empty");

for (const unit of MOCK_ACADEMIC_UNITS) {
  assert.ok(indexHtml.includes(`value="${unit}"`), `index.html is missing option: ${unit}`);
}

assert.match(indexHtml, /Lista provisoria\/mock/i, "UI must disclose that academic units are provisional/mock");
assert.doesNotMatch(indexHtml, /href="\//, "index.html stylesheet links must not be root-relative");
assert.doesNotMatch(indexHtml, /src="\//, "index.html script and image sources must not be root-relative");
assert.match(readme, /mock\/provisional controlled list/i, "README must document the provisional academic-unit list");
assert.match(readme, /file:\/\//i, "README must document direct file:// preview behavior");
assert.match(readme, /vercel dev/i, "README must document Vercel local endpoint usage");
assert.match(envExample, /Add the real values/i, ".env.example must tell where Supabase keys are added later");
assert.match(readme, /SUPABASE_SERVICE_ROLE_KEY/i, "README must mention the server-only Supabase key");
assert.match(
  fs.readFileSync(path.join(root, "main.js"), "utf8"),
  /window\.location\.protocol === "file:"/,
  "main.js must guard submit attempts during direct file:// preview",
);

console.log("Local verification passed: assets, file preview guard, mock academic units, docs, and env guidance are aligned.");
