import { validateLead } from "./validation.js";

const cookie = document.querySelector("[data-cookie]");
const cookieClose = document.querySelector("[data-cookie-close]");
const modal = document.querySelector("[data-modal]");
const modalClose = document.querySelector("[data-modal-close]");
const programButtons = document.querySelectorAll("[data-program]");
const forms = document.querySelectorAll("[data-lead-form]");

let modalOpener = null;
let submissionComplete = false;
const isStaticDemoHost = ["github.io", "localhost", "127.0.0.1"].some((host) =>
  window.location.hostname.includes(host),
);

if (cookie && localStorage.getItem("usmanovaCookieAccepted") === "1") {
  cookie.hidden = true;
}

cookieClose?.addEventListener("click", () => {
  localStorage.setItem("usmanovaCookieAccepted", "1");
  if (cookie) cookie.hidden = true;
});

function clearErrors(form) {
  form.querySelectorAll("[data-error]").forEach((element) => {
    element.textContent = "";
  });
  form.querySelectorAll("[aria-invalid]").forEach((element) => {
    element.removeAttribute("aria-invalid");
  });
}

function setStatus(form, message = "", state = "") {
  const formStatus = form.querySelector("[data-form-status]");
  formStatus.textContent = message;
  if (state) formStatus.dataset.state = state;
  else formStatus.removeAttribute("data-state");
}

function closeModal() {
  modal.close();
  modalOpener?.focus();
}

programButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modalOpener = button;
    submissionComplete = false;
    const modalForm = modal.querySelector("[data-lead-form]");
    modalForm.elements.program.value = button.dataset.program;
    clearErrors(modalForm);
    setStatus(modalForm, `Вы выбрали: ${button.dataset.program}`);
    modal.showModal();
    modalForm.elements.name.focus();
  });
});

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

modal.addEventListener("close", () => {
  modalOpener?.focus();
});

forms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submissionComplete) return;

    clearErrors(form);
    const payload = Object.fromEntries(new FormData(form));
    const errors = validateLead(payload);

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, message]) => {
        const error = form.querySelector(`[data-error="${field}"]`);
        const input = form.elements[field];
        error.textContent = message;
        input?.setAttribute("aria-invalid", "true");
      });
      form.elements[Object.keys(errors)[0]]?.focus();
      setStatus(form, "Проверьте заполнение формы.", "error");
      return;
    }

    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    submit.textContent = "Отправляем…";
    setStatus(form, "Отправляем заявку…");

    try {
      if (!isStaticDemoHost) {
        const response = await fetch("/api/lead", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || "Не удалось отправить заявку");
        }
      }

      submissionComplete = true;
      form.reset();
      submit.textContent = "Заявка отправлена";
      setStatus(form, "Спасибо! Заявка отправлена.", "success");
    } catch {
      submit.disabled = false;
      submit.textContent = "Отправить заявку";
      setStatus(
        form,
        "Не получилось отправить. Проверьте соединение и попробуйте ещё раз.",
        "error",
      );
    }
  });
});
