import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/lead.js";

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("rejects non-POST requests", async () => {
  const res = response();
  await handler({ method: "GET" }, res);
  assert.equal(res.statusCode, 405);
});

test("rejects incomplete leads", async () => {
  const res = response();
  await handler({ method: "POST", body: { name: "" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
});

test("forwards a valid lead", async (t) => {
  process.env.TELEGRAM_BOT_TOKEN = "token";
  process.env.TELEGRAM_CHAT_ID = "42";
  t.mock.method(globalThis, "fetch", async () => ({ ok: true }));
  const res = response();
  await handler(
    {
      method: "POST",
      body: { name: "Юлия", contact: "@julia", program: "Дом" },
    },
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});
