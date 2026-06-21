import test from "node:test";
import assert from "node:assert/strict";
import { validateLead } from "../js/validation.js";

test("accepts a complete lead", () => {
  assert.deepEqual(
    validateLead({ name: "Юлия", contact: "@julia", program: "Дом" }),
    {},
  );
});

test("reports every missing field", () => {
  assert.deepEqual(validateLead({ name: "", contact: "", program: "" }), {
    name: "Введите имя",
    contact: "Введите телефон или Telegram",
    program: "Выберите программу",
  });
});
