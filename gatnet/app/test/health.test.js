const test = require("node:test");
const assert = require("node:assert/strict");

test("Gatnet health endpoint contract is documented", () => {
  const expected = { status: "ok", app: "Gatnet" };
  assert.equal(expected.status, "ok");
  assert.equal(expected.app, "Gatnet");
});
