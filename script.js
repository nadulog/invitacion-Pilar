const EVENT_START = new Date("2026-11-13T21:00:00-03:00");
const EVENT_END = new Date("2026-11-14T05:00:00-03:00");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Cuenta regresiva. */
const countdownFields = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

function updateCountdown() {
  const remaining = Math.max(0, EVENT_START.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  countdownFields.days.textContent = String(Math.floor(totalSeconds / 86400)).padStart(2, "0");
  countdownFields.hours.textContent = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  countdownFields.minutes.textContent = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  countdownFields.seconds.textContent = String(totalSeconds % 60).padStart(2, "0");
}

/* Agujas del reloj de la cuenta regresiva: marcan la hora actual. */
const clockHands = {
  hour: document.querySelector("#hourHand"),
  minute: document.querySelector("#minuteHand"),
  second: document.querySelector("#secondHand"),
};

function updateClock() {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  clockHands.hour.setAttribute("transform", `rotate(${hours * 30})`);
  clockHands.minute.setAttribute("transform", `rotate(${minutes * 6})`);
  clockHands.second.setAttribute("transform", `rotate(${seconds * 6})`);
}

function tick() {
  updateCountdown();
  updateClock();
}

tick();
window.setInterval(tick, 1000);

/* Agregar al calendario. */
function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function downloadCalendarEvent() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pilar//Invitacion XV//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:xv-pilar-20261113@bloomdate",
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(EVENT_START)}`,
    `DTEND:${toIcsDate(EVENT_END)}`,
    "SUMMARY:XV de Pilar",
    "LOCATION:Janos Hipódromo de San Isidro",
    "DESCRIPTION:Celebramos los XV años de Pilar. Cómo llegar: https://maps.app.goo.gl/qDz6Qyx7kmiXBBxu6",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const file = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "xv-pilar.ics";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

document.querySelector("#calendarButton").addEventListener("click", downloadCalendarEvent);

/* Modal de regalos. */
const giftsModal = document.querySelector("#giftsModal");

function openModal(modal) {
  modal.showModal();
  document.body.classList.add("modal-open");
}

function syncModalState() {
  document.body.classList.toggle("modal-open", Boolean(document.querySelector("dialog[open]")));
}

function showCopyMessage(button, message) {
  const toast = button.closest(".modal-art").querySelector(".modal-toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toast.hideTimer);
  toast.hideTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

async function copyText(button) {
  const text = button.dataset.copy;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  showCopyMessage(button, button.dataset.copyMessage);
}

document.querySelector("#openGiftsModal").addEventListener("click", () => openModal(giftsModal));

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copyText(button));
});

document.querySelectorAll("dialog").forEach((modal) => {
  modal.addEventListener("close", syncModalState);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
});

/* Galería: carrusel deslizable con puntos y avance automático. */
function setupGallery() {
  const track = document.querySelector("#galleryTrack");
  const dotsBox = document.querySelector("#galleryDots");
  if (!track || !dotsBox) return;

  const slides = [...track.querySelectorAll(".gallery__slide")];
  const dots = slides.map(() => {
    const dot = document.createElement("span");
    dotsBox.append(dot);
    return dot;
  });

  let current = 0;
  let autoTimer = 0;

  const slideLeft = (index) => slides[index].offsetLeft - (track.clientWidth - slides[index].clientWidth) / 2;

  function markActive() {
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const best = slides[closest].offsetLeft + slides[closest].clientWidth / 2;
      if (Math.abs(slideCenter - center) < Math.abs(best - center)) closest = index;
    });
    current = closest;
    slides.forEach((slide, index) => slide.classList.toggle("is-active", index === current));
    dots.forEach((dot, index) => dot.classList.toggle("is-active", index === current));
  }

  function goTo(index) {
    track.scrollTo({ left: slideLeft(index), behavior: reducedMotion ? "auto" : "smooth" });
  }

  function restartAuto() {
    window.clearInterval(autoTimer);
    if (reducedMotion) return;
    autoTimer = window.setInterval(() => goTo((current + 1) % slides.length), 4500);
  }

  let scrollFrame = 0;
  track.addEventListener("scroll", () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(markActive);
  });
  ["pointerdown", "touchstart", "keydown"].forEach((type) =>
    track.addEventListener(type, restartAuto, { passive: true })
  );

  markActive();
  restartAuto();

  /* Tocar una foto la abre completa; se puede pasar a la siguiente con flechas o deslizando. */
  const photoModal = document.querySelector("#photoModal");
  const photoImage = document.querySelector("#photoModalImage");
  const photoCount = document.querySelector("#photoCount");
  let photoIndex = 0;

  function showPhoto(index) {
    photoIndex = (index + slides.length) % slides.length;
    const source = slides[photoIndex].querySelector("img");
    photoImage.src = source.currentSrc || source.src;
    photoImage.alt = source.alt;
    photoCount.textContent = `${photoIndex + 1} / ${slides.length}`;
  }

  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
      window.clearInterval(autoTimer);
      showPhoto(index);
      openModal(photoModal);
    });
  });

  document.querySelector("#photoPrev").addEventListener("click", () => showPhoto(photoIndex - 1));
  document.querySelector("#photoNext").addEventListener("click", () => showPhoto(photoIndex + 1));

  photoModal.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(photoIndex - 1);
    if (event.key === "ArrowRight") showPhoto(photoIndex + 1);
  });

  let touchStartX = null;
  photoModal.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });
  photoModal.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(deltaX) > 45) showPhoto(photoIndex + (deltaX < 0 ? 1 : -1));
  });

  photoModal.addEventListener("close", () => {
    goTo(photoIndex);
    restartAuto();
  });
}

setupGallery();

/* Notas musicales que salen de la vitrola mientras la sección está en pantalla. */
function setupMusicNotes() {
  const box = document.querySelector("#musicNotes");
  if (!box || reducedMotion) return;

  const symbols = ["♪", "♫", "♬", "♩"];
  let timer = 0;

  function spawnNote() {
    const note = document.createElement("span");
    note.className = "music-note";
    note.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    // Salen de la boca de la bocina y suben flotando hacia arriba y a la izquierda.
    note.style.setProperty("--x", `${9 + Math.random() * 22}%`);
    note.style.setProperty("--y", `${27 + Math.random() * 24}%`);
    note.style.setProperty("--dx", `${-8 + Math.random() * 12}cqw`);
    note.style.setProperty("--dy", `${-(16 + Math.random() * 14)}cqw`);
    note.style.setProperty("--rot", `${-25 + Math.random() * 50}deg`);
    note.style.setProperty("--size", `${8 + Math.random() * 5}cqw`);
    note.style.setProperty("--dur", `${3.2 + Math.random() * 1.6}s`);
    note.addEventListener("animationend", () => note.remove());
    box.append(note);
  }

  const observer = new IntersectionObserver(([entry]) => {
    window.clearInterval(timer);
    if (entry.isIntersecting) {
      spawnNote();
      timer = window.setInterval(spawnNote, 650);
    }
  }, { threshold: 0.25 });

  observer.observe(box.closest(".panel"));
}

setupMusicNotes();

/* Destellos: estrellitas que titilan sobre puntos elegidos (en % de la pieza). */
// Ribetes dorados y satén del vestido y el traje, sacados de la imagen del dress code.
const DRESS_POINTS = [[47.1,17],[47.7,17.6],[68.4,17.9],[65.5,18.1],[71.3,18.2],[66.6,18.4],[47.3,18.6],[66.3,18.8],[47.2,19.2],[66.2,19.4],[65.7,19.7],[34.3,20],[46,20.3],[60.6,20.9],[70,21.3],[68.8,21.6],[69,21.8],[72.4,21.9],[67.7,22.1],[71.1,22.2],[67.2,22.3],[67.4,22.5],[67.6,22.7],[67.8,22.8],[47.7,23.1],[38.2,23.3],[70.1,23.4],[72.1,23.7],[69.1,23.9],[69.3,24.1],[46.8,24.3],[72.2,24.5],[46.4,24.8],[70.4,25],[72.3,25.2],[69.3,25.5],[71.2,25.7],[78.7,25.9],[70.9,26.1],[70.4,26.4],[72.3,26.6],[63.9,27.1],[70.7,27.3],[41.8,27.7],[43.7,27.9],[44.1,28.3],[65.5,29.1],[47.3,31],[47.4,31.8],[47.9,32.9],[45.8,33.9],[75,34.4],[54.6,35.1],[58,36.6],[59.9,36.8],[47.4,37.3],[46.5,37.9],[46.1,38.9],[52.5,40.2],[52.2,40.6],[57.2,41.4],[53.9,42],[55.5,42.7],[65.4,43.5],[65,43.9],[49.6,45.3],[57.4,47.1],[58.6,48.7],[59.2,49.3],[59.7,50.4],[60.6,51.1],[53.5,52.7],[54.4,55.6],[6.1,56.7],[68.4,57.8],[70,58.4],[71.6,59.1],[70.8,59.7],[10.3,60.3],[54.7,60.6],[62.4,61.6],[58.3,62.3],[16.2,63.2],[61,63.9],[25.5,64.2],[20.1,64.4],[28.8,64.9],[65.7,65.1],[47.3,65.4],[50.9,65.7],[47.7,17.5],[72.9,19.1],[46,20.4],[67.2,21.5],[79.9,22],[70.5,23.3],[74.4,24],[52.1,24.9],[69.2,25.4],[76.2,25.8],[65.8,26.3],[67,26.7],[65.2,27.2],[66.4,27.6],[76.2,28.3],[38.2,28.8],[75.6,29.4],[82.5,30],[76.3,30.6],[32.3,31.3],[52.2,32.1],[74.9,32.9],[43.7,34.2],[35.7,35.3],[45.4,36.2],[69.4,37.3],[45.6,38.3],[50.9,39.1],[28.6,40],[83.4,40.6],[56.7,41.5],[64.9,42.4],[48.5,43.2],[39,44.5],[82,45.4],[83,46.2],[84.1,46.9],[50.3,47.5],[38,48.6],[53.7,49.2],[51.9,49.8],[28.3,50.4],[22.1,51],[54.7,52.3],[17.6,53.6],[40.5,54.2],[40.2,54.8],[48.4,55.7],[21.7,56.6],[64.7,57.5],[68.8,58],[20.4,58.7],[18.6,59.3],[58.9,60],[54.2,60.5],[59.6,61.2],[41.7,62.1],[58.4,63.2],[66.7,63.9],[44.6,64.4]];
// Alrededor de la P del sobre de confirmación.
const P_POINTS = [[50.6, 37.2], [57.8, 38.4], [51.4, 41.5], [54.2, 44.6], [58.6, 43.2], [52.3, 36.6], [56.8, 41]];

function setupSparkles(selector, points, every, sizeMin, sizeMax) {
  const box = document.querySelector(selector);
  if (!box || reducedMotion) return;
  let timer = 0;

  function spawn() {
    const [x, y] = points[Math.floor(Math.random() * points.length)];
    const star = document.createElement("span");
    star.className = "sparkle";
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.setProperty("--size", `${sizeMin + Math.random() * (sizeMax - sizeMin)}cqw`);
    star.style.setProperty("--dur", `${0.9 + Math.random() * 0.8}s`);
    star.addEventListener("animationend", () => star.remove());
    box.append(star);
  }

  new IntersectionObserver(([entry]) => {
    window.clearInterval(timer);
    if (entry.isIntersecting) timer = window.setInterval(spawn, every);
  }, { threshold: 0.2 }).observe(box.closest(".panel"));
}

setupSparkles("#dressSparkles", DRESS_POINTS, 45, 3, 6.5);
setupSparkles("#pSparkles", P_POINTS, 260, 2.6, 4.4);

/* Música: botón flotante para reproducir y pausar. */
const audioToggle = document.querySelector("#audioToggle");
const invitationAudio = document.querySelector("#invitationAudio");
let audioFadeFrame = 0;

function syncAudioControl(isPlaying) {
  audioToggle.classList.toggle("is-playing", isPlaying);
  audioToggle.setAttribute("aria-pressed", String(isPlaying));
  audioToggle.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
}

function fadeAudioTo(targetVolume = 0.6, duration = 1600) {
  window.cancelAnimationFrame(audioFadeFrame);
  const startedAt = performance.now();
  const startingVolume = invitationAudio.volume;

  function step(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    invitationAudio.volume = startingVolume + (targetVolume - startingVolume) * eased;
    if (progress < 1) audioFadeFrame = window.requestAnimationFrame(step);
  }

  audioFadeFrame = window.requestAnimationFrame(step);
}

async function startInvitationAudio() {
  window.cancelAnimationFrame(audioFadeFrame);
  invitationAudio.volume = 0.05;

  try {
    await invitationAudio.play();
    fadeAudioTo();
  } catch {
    syncAudioControl(false);
  }
}

// El botón solo aparece si el archivo de música existe (en iPhone el audio no se
// precarga hasta que se toca la pantalla, por eso se consulta el archivo directamente).
fetch(invitationAudio.src, { method: "HEAD" })
  .then((response) => {
    if (response.ok) audioToggle.hidden = false;
  })
  .catch(() => {});

audioToggle.addEventListener("click", () => {
  if (invitationAudio.paused) {
    startInvitationAudio();
  } else {
    window.cancelAnimationFrame(audioFadeFrame);
    invitationAudio.pause();
  }
});

invitationAudio.addEventListener("play", () => syncAudioControl(true));
invitationAudio.addEventListener("pause", () => syncAudioControl(false));

/* Intro: entrar con o sin música. */
function setupInvitationIntro() {
  const intro = document.querySelector(".invitation-intro");
  const main = document.querySelector("#invitationMain");
  if (!intro) return;

  let leaving = false;

  const enter = (withMusic) => {
    if (leaving) return;
    leaving = true;
    intro.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
    });

    // Se llama dentro del toque para que los celulares permitan reproducir.
    if (withMusic) startInvitationAudio();

    intro.classList.add("is-leaving");
    window.setTimeout(() => {
      document.body.classList.remove("intro-is-open");
      intro.remove();
      window.scrollTo(0, 0);
      main?.focus({ preventScroll: true });
    }, reducedMotion ? 260 : 2100);
  };

  intro.querySelector("#introWithMusic")?.addEventListener("click", () => enter(true));
  intro.querySelector("#introWithoutMusic")?.addEventListener("click", () => enter(false));
}

setupInvitationIntro();
