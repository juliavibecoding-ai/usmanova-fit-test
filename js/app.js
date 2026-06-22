import { validateLead } from "./validation.js";

const cookie = document.querySelector("[data-cookie]");
const cookieClose = document.querySelector("[data-cookie-close]");
const galleryTrack = document.querySelector("[data-gallery-track]");
const galleryProgress = document.querySelector("[data-gallery-progress]");
const modal = document.querySelector("[data-modal]");
const modalClose = document.querySelector("[data-modal-close]");
const programButtons = document.querySelectorAll("[data-program]");
const form = document.querySelector("[data-lead-form]");
const formStatus = document.querySelector("[data-form-status]");

let modalOpener = null;
let submissionComplete = false;
const isStaticDemoHost = ["github.io", "localhost", "127.0.0.1"].some((host) =>
  window.location.hostname.includes(host),
);

if (localStorage.getItem("usmanovaCookieAccepted") === "1") {
  cookie.hidden = true;
}

cookieClose.addEventListener("click", () => {
  localStorage.setItem("usmanovaCookieAccepted", "1");
  cookie.hidden = true;
});

function updateGalleryProgress() {
  const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
  const progress = maxScroll > 0 ? galleryTrack.scrollLeft / maxScroll : 0;
  galleryProgress.style.transform = `scaleX(${0.38 + progress * 0.62})`;
}

let isDraggingGallery = false;
let galleryStartX = 0;
let galleryStartScroll = 0;

galleryTrack.addEventListener("scroll", updateGalleryProgress, { passive: true });
window.addEventListener("resize", updateGalleryProgress);

galleryTrack.addEventListener("pointerdown", (event) => {
  isDraggingGallery = true;
  galleryStartX = event.clientX;
  galleryStartScroll = galleryTrack.scrollLeft;
  galleryTrack.setPointerCapture(event.pointerId);
});

galleryTrack.addEventListener("pointermove", (event) => {
  if (!isDraggingGallery) return;
  galleryTrack.scrollLeft = galleryStartScroll - (event.clientX - galleryStartX);
});

galleryTrack.addEventListener("pointerup", () => {
  isDraggingGallery = false;
});

galleryTrack.addEventListener("pointercancel", () => {
  isDraggingGallery = false;
});

updateGalleryProgress();

function clearErrors() {
  form.querySelectorAll("[data-error]").forEach((element) => {
    element.textContent = "";
  });
  form.querySelectorAll("[aria-invalid]").forEach((element) => {
    element.removeAttribute("aria-invalid");
  });
}

function setStatus(message = "", state = "") {
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
    form.elements.program.value = button.dataset.program;
    clearErrors();
    setStatus(`Вы выбрали: ${button.dataset.program}`);
    modal.showModal();
    form.elements.name.focus();
  });
});

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

modal.addEventListener("close", () => {
  modalOpener?.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submissionComplete) return;

  clearErrors();
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
    setStatus("Проверьте заполнение формы.", "error");
    return;
  }

  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  submit.textContent = "Отправляем…";
  setStatus("Отправляем заявку…");

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
    setStatus("Спасибо! Заявка отправлена.", "success");
  } catch {
    submit.disabled = false;
    submit.textContent = "Отправить заявку";
    setStatus(
      "Не получилось отправить. Проверьте соединение и попробуйте ещё раз.",
      "error",
    );
  }
});
