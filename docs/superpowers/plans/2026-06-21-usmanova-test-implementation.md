# Usmanova Fit Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a responsive three-screen Usmanova Fit landing-page reproduction with working navigation, gallery, cookie notice, modal lead form, and Telegram delivery.

**Architecture:** A static semantic page owns all visual content and client interactions. Small ES modules isolate validation and DOM behavior, while one Vercel serverless function validates requests and forwards valid leads to Telegram. Node's built-in test runner covers pure client logic and the API handler; viewport and production checks cover browser behavior.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Vercel Functions, Node.js `node:test`, GitHub, Vercel.

---

## File map

- `index.html` — three reproduced sections, cookie notice, modal form, accessible labels.
- `styles.css` — fonts, responsive layout, component states, modal and cookie presentation.
- `js/validation.js` — pure lead-field validation.
- `js/app.js` — scrolling, gallery, cookie persistence, modal and form submission.
- `api/lead.js` — JSON validation and Telegram forwarding.
- `assets/hero-kate.png` — local hero cutout from the source page.
- `assets/trainer-gym.png`, `assets/trainer-beach.png` — local trainer gallery images.
- `assets/program-home.png`, `assets/program-gym.png`, `assets/program-recovery.png` — local program-card images.
- `tests/validation.test.mjs` — client validation tests.
- `tests/lead-api.test.mjs` — API status and forwarding tests.
- `package.json` — module mode and test command.
- `vercel.json` — static and serverless routing configuration.
- `README.md` — demo, scope, tools, timing and verification notes.

### Task 1: Project contract and validation core

**Files:**
- Create: `package.json`
- Create: `js/validation.js`
- Create: `tests/validation.test.mjs`

- [ ] **Step 1: Add failing validation tests**

```js
// tests/validation.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { validateLead } from "../js/validation.js";

test("accepts a complete lead", () => {
  assert.deepEqual(validateLead({ name: "Юлия", contact: "@julia", program: "Дом" }), {});
});

test("reports every missing field", () => {
  assert.deepEqual(validateLead({ name: "", contact: "", program: "" }), {
    name: "Введите имя",
    contact: "Введите телефон или Telegram",
    program: "Выберите программу"
  });
});
```

- [ ] **Step 2: Add package metadata and verify the test fails**

```json
{
  "name": "usmanova-fit-test",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" },
  "engines": { "node": ">=20" }
}
```

Run: `node --test tests/validation.test.mjs`

Expected: FAIL because `js/validation.js` does not exist.

- [ ] **Step 3: Implement minimal validation**

```js
// js/validation.js
export function validateLead({ name = "", contact = "", program = "" }) {
  const errors = {};
  if (!name.trim()) errors.name = "Введите имя";
  if (!contact.trim()) errors.contact = "Введите телефон или Telegram";
  if (!program.trim()) errors.program = "Выберите программу";
  return errors;
}
```

- [ ] **Step 4: Run the validation tests**

Run: `node --test tests/validation.test.mjs`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the validation core**

```powershell
git add package.json js/validation.js tests/validation.test.mjs
git commit -m "test: define lead validation"
```

### Task 2: Serverless Telegram delivery

**Files:**
- Create: `api/lead.js`
- Create: `tests/lead-api.test.mjs`
- Create: `vercel.json`

- [ ] **Step 1: Add API handler tests**

```js
// tests/lead-api.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/lead.js";

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
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
  await handler({ method: "POST", body: { name: "Юлия", contact: "@julia", program: "Дом" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `node --test tests/lead-api.test.mjs`

Expected: FAIL because `api/lead.js` does not exist.

- [ ] **Step 3: Implement the API handler**

```js
// api/lead.js
import { validateLead } from "../js/validation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const lead = req.body ?? {};
  const errors = validateLead(lead);
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({ ok: false, error: "Delivery is not configured" });
  const text = [`Новая заявка Usmanova Fit`, `Имя: ${lead.name}`, `Контакт: ${lead.contact}`, `Программа: ${lead.program}`].join("\n");
  const reply = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!reply.ok) return res.status(502).json({ ok: false, error: "Telegram delivery failed" });
  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 4: Add Vercel routing and run all tests**

```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

Run: `node --test`

Expected: 5 tests pass.

- [ ] **Step 5: Commit API delivery**

```powershell
git add api/lead.js tests/lead-api.test.mjs vercel.json
git commit -m "feat: forward leads to Telegram"
```

### Task 3: Source assets and semantic page

**Files:**
- Create: `assets/hero-kate.png`
- Create: `assets/trainer-gym.png`
- Create: `assets/trainer-beach.png`
- Create: `assets/program-home.png`
- Create: `assets/program-gym.png`
- Create: `assets/program-recovery.png`
- Create: `index.html`

- [ ] **Step 1: Download the source-owned images used by the selected sections**

Extract the exact image requests from the supplied landing page HTML and download them to the six paths above. The hero source begins at:

```text
https://fs-thb02.getcourse.ru/fileservice/file/thumbnail/h/8d7e3aa384b597937b9504925ead6325.png/s/s1200x/a/934144/sc/68
```

Run: `Get-ChildItem assets | Select-Object Name,Length`

Expected: six non-empty image files.

- [ ] **Step 2: Create the semantic page shell**

Create `index.html` with the following complete content structure (head metadata and stylesheet link precede this body):

```html
<main>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__copy">
      <h1 id="hero-title">Приведите тело в форму с чемпионкой Катей Усмановой</h1>
      <p class="hero__subtitle">без диет, голода и запретов<br>с пользой для здоровья</p>
      <p>Похудеть, подтянуть попу и живот, набрать форму в зале, восстановиться после родов — тренировки и питание под вашу цель</p>
      <a class="button" href="#programs">Выбрать программу</a>
    </div>
    <img src="assets/hero-kate.png" alt="Катя Усманова с гантелями">
  </section>
  <section class="trainer" aria-labelledby="trainer-title">
    <h2 id="trainer-title">Доверьте свое тело чемпионке<br>фитнес-бикини и тренеру <span>Кате Усмановой</span></h2>
    <p>С 2015 года создаёт топовые тренировки для идеальных ягодиц, плоского живота и стройности без жёстких диет.</p>
    <ul class="trainer__facts">
      <li>Вице-чемпионка мира и чемпионка России по фитнес-бикини</li>
      <li>Профессиональный фитнес-тренер с опытом более 15 лет</li>
      <li>Мама двоих детей</li>
      <li>Автор масштабных марафонов стройности</li>
      <li>Чемпионка России и мира по жиму лёжа</li>
    </ul>
    <div class="gallery" data-gallery>
      <img src="assets/trainer-gym.png" alt="Катя Усманова в спортивном зале" data-gallery-image>
      <button type="button" data-gallery-src="assets/trainer-gym.png" aria-current="true">Фото в зале</button>
      <button type="button" data-gallery-src="assets/trainer-beach.png">Фото на отдыхе</button>
    </div>
  </section>
  <section class="programs" id="programs" aria-labelledby="programs-title">
    <h2 id="programs-title">Выберите свою программу</h2>
    <div class="program-grid">
      <article><img src="assets/program-home.png" alt="Домашние тренировки"><h3>Тренировки дома</h3><button type="button" data-program="Тренировки дома">Выбрать</button></article>
      <article><img src="assets/program-gym.png" alt="Тренировки в зале"><h3>Тренировки в зале</h3><button type="button" data-program="Тренировки в зале">Выбрать</button></article>
      <article><img src="assets/program-recovery.png" alt="Восстановление после родов"><h3>Восстановление</h3><button type="button" data-program="Восстановление">Выбрать</button></article>
    </div>
  </section>
</main>
<aside class="cookie" data-cookie><p>Мы используем cookie-файлы. Это нужно для лучшей работы сайта.</p><button data-cookie-close>OK</button></aside>
<dialog class="lead-modal" data-modal>
  <button type="button" data-modal-close aria-label="Закрыть">×</button>
  <h2>Оставить заявку</h2>
  <form data-lead-form novalidate>
    <label>Имя<input name="name" autocomplete="name" required><small data-error="name"></small></label>
    <label>Телефон или Telegram<input name="contact" autocomplete="tel" required><small data-error="contact"></small></label>
    <input type="hidden" name="program">
    <small data-error="program"></small>
    <button type="submit">Отправить заявку</button>
    <p role="status" aria-live="polite" data-form-status></p>
  </form>
</dialog>
<script type="module" src="js/app.js"></script>
```

- [ ] **Step 3: Check structural and accessibility requirements**

Run: `Select-String -Path index.html -Pattern '<h1|id="programs"|data-program|data-lead-form|aria-live|<dialog'`

Expected: one `h1`, the programs anchor, three `data-program` buttons, one lead form, one live region and one dialog.

- [ ] **Step 4: Commit page content and assets**

```powershell
git add index.html assets
git commit -m "feat: add three landing sections"
```

### Task 4: Responsive visual reproduction

**Files:**
- Create: `styles.css`
- Modify: `index.html`

- [ ] **Step 1: Add the stylesheet link and design tokens**

```css
:root {
  --pink: #f65f96;
  --ink: #171717;
  --muted: #777;
  --surface: #f4f4f4;
  --radius: 34px;
  --shadow: 0 16px 45px rgb(0 0 0 / 12%);
}
```

Use local fallbacks matching the rounded Gilroy appearance, a 1200px content width, the source pink CTA, white hero background and light-gray trainer/program surfaces.

- [ ] **Step 2: Implement desktop layout**

Use a two-column hero, centered trainer content, rounded gallery card and a three-card program grid. Buttons must have 48px minimum height, visible focus styles, hover and active states.

- [ ] **Step 3: Implement tablet and mobile layouts**

At `max-width: 900px`, stack hero content and image and reduce headings. At `max-width: 600px`, use 20px gutters, one-column program cards, full-width CTA buttons, a bottom-sheet-like modal and touch targets of at least 44px.

- [ ] **Step 4: Check for accidental fixed-width overflow**

Run: `Select-String -Path styles.css -Pattern 'width:\s*[7-9][0-9]{2,}px'`

Expected: no content component with a fixed width over 699px.

- [ ] **Step 5: Commit responsive styling**

```powershell
git add index.html styles.css
git commit -m "style: reproduce responsive landing design"
```

### Task 5: Browser interactions and form states

**Files:**
- Create: `js/app.js`
- Modify: `index.html`

- [ ] **Step 1: Implement cookie and gallery behavior**

On startup, hide the cookie notice when `localStorage.usmanovaCookieAccepted === "1"`. The close button stores that value. Gallery buttons update the active image and `aria-current` without changing layout height.

- [ ] **Step 2: Implement modal lifecycle**

Each `[data-program]` button writes its program name into the hidden field and calls `showModal()`. Closing restores focus to the opener. Native Escape behavior is preserved; backdrop clicks close only when `event.target === dialog`.

- [ ] **Step 3: Implement form validation and submission**

Import `validateLead`, render its exact messages beside fields, disable the submit button while `fetch("/api/lead")` runs, and preserve entered data on failure. On success, replace the form status with `Спасибо! Заявка отправлена.`, reset the form and prevent a second submission until the modal is reopened.

- [ ] **Step 4: Run automated tests**

Run: `node --test`

Expected: all tests pass.

- [ ] **Step 5: Commit interactions**

```powershell
git add js/app.js index.html
git commit -m "feat: add landing interactions"
```

### Task 6: Documentation, production deployment and QA

**Files:**
- Create: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Write the project README**

Document the three selected screens, HTML/CSS/JavaScript with Codex as the vibe-coding tool, actual elapsed time, implemented interactions, local test command, Vercel URL and the source-page attribution. Include desktop and mobile screenshots after QA.

- [ ] **Step 2: Run the complete local verification**

Run: `node --test`

Expected: all tests pass with zero failures.

Serve locally and verify at 1440×900, 768×1024 and 375×812:

- no horizontal scroll;
- hero CTA reaches programs;
- all three program buttons open the correctly named form;
- invalid fields show errors;
- modal closes by button, Escape and backdrop;
- cookie notice stays dismissed after reload;
- Telegram test submission arrives in the configured private chat.

- [ ] **Step 3: Create the GitHub repository and push `master`**

Create a public repository named `usmanova-fit-test`, set it as `origin`, and push the complete history.

Expected: GitHub displays source code and README without secrets.

- [ ] **Step 4: Deploy to Vercel and configure secrets**

Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for Production, deploy, and repeat the form submission against the public URL.

Expected: deployment is ready and the production Telegram message arrives.

- [ ] **Step 5: Run production visual QA and save evidence**

Capture desktop and mobile screenshots from the deployed page, add them to `README.md`, verify links and run one final form submission.

- [ ] **Step 6: Commit documentation and QA evidence**

```powershell
git add README.md package.json
git commit -m "docs: add delivery and QA notes"
git push origin master
```

Expected: remote repository and deployed page contain the final verified version.
