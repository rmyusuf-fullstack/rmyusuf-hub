const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const FADE_SELECTOR = [
  ".section-label",
  ".section-description",
  ".section-note",
  ".work-type",
  ".approach-step",
  ".capability",
  ".tools-label",
  ".tool",
  ".tools-note",
  ".project-intro",
  ".gaming-tabs",
  ".contact-description",
  ".contact-button",
  ".contact-details",
].join(",");

const TITLE_SELECTOR =
  "#showreel h2, #approach h2, #capabilities h2, #projects h2, #contact h2";

const pendingReveals = new Set();
const revealTriggers = new Map();
const triggerTargets = new Map();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const element = triggerTargets.get(entry.target) || entry.target;

      revealElement(element);
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -8% 0px",
  }
);

function getStaggerDelay(element) {
  const item = element.closest(".project-video") || element;
  const parent = item.parentElement;

  if (!parent) return 0;

  const style = getComputedStyle(parent);

  if (style.display !== "grid") return 0;

  const columns = style.gridTemplateColumns
    .split(" ")
    .filter(Boolean).length;

  const index = Array.prototype.indexOf.call(
    parent.children,
    item
  );

  return (index % Math.max(columns, 1)) * 110;
}

function revealElement(element) {
  if (!pendingReveals.has(element)) return;

  pendingReveals.delete(element);

  const trigger = revealTriggers.get(element) || element;

  revealObserver.unobserve(trigger);

  const delay = getStaggerDelay(element);

  element.style.setProperty("--delay", `${delay}ms`);
  element.classList.add("visible");

  window.setTimeout(() => {
    element.classList.remove(
      "reveal",
      "reveal-title",
      "reveal-video",
      "visible"
    );

    element.style.removeProperty("--delay");
  }, delay + 2600);
}

function watch(element, className, trigger = element) {
  element.classList.add(className);

  pendingReveals.add(element);
  revealTriggers.set(element, trigger);
  triggerTargets.set(trigger, element);

  revealObserver.observe(trigger);
}


document.querySelectorAll(FADE_SELECTOR).forEach((element) => {
  watch(element, "reveal");
});

document.querySelectorAll(TITLE_SELECTOR).forEach((title) => {
  title.querySelectorAll(":scope > span").forEach((line, index) => {
    line.style.setProperty("--i", index);
  });

  watch(title, "reveal-title");
});

document.querySelectorAll(".yt-player").forEach((player) => {
  if (player.closest(".master-reel")) return;

  watch(player, "reveal-video", player.parentElement);
});

const progressBar = document.querySelector(".scroll-progress");
const heroSection = document.getElementById("hero");
const heroVideo = document.querySelector(".hero-video");
const masterReel = document.querySelector(".master-reel");
const masterPlayer = masterReel
  ? masterReel.querySelector(".yt-player")
  : null;

let scrollTicking = false;

function updateScrollEffects() {
  scrollTicking = false;

  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const maxScroll =
    document.documentElement.scrollHeight - viewportHeight;

  if (progressBar) {
    const progress = maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  }

  if (!prefersReducedMotion) {
    if (heroSection && heroVideo) {
      const heroProgress = clamp(
        scrollY / (heroSection.offsetHeight * 0.8),
        0,
        1
      );

      heroVideo.style.transform = `scale(${1 - heroProgress * 0.08})`;
      heroVideo.style.opacity = String(1 - heroProgress * 0.55);
    }

    if (masterReel && masterPlayer) {
      const rect = masterReel.getBoundingClientRect();
      const reelProgress = clamp(
        (viewportHeight - rect.top) / (viewportHeight * 0.85),
        0,
        1
      );

      masterPlayer.style.transform = `scale(${0.88 + reelProgress * 0.12})`;
    }
  }

  if (maxScroll - scrollY < 2) {
    Array.from(pendingReveals).forEach(revealElement);
  }
}

function requestScrollUpdate() {
  if (!scrollTicking) {
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollEffects);
  }
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);

updateScrollEffects();

const languageButtons = document.querySelectorAll(".language-button");
const translatableElements = document.querySelectorAll("[data-en][data-id]");

function setLanguage(language) {
  translatableElements.forEach((element) => {
    element.textContent = element.dataset[language];
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });

  document.documentElement.lang = language;

  try {
    localStorage.setItem("portfolio-language", language);
  } catch (error) {
  }
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
});

let savedLanguage = "en";

try {
  savedLanguage = localStorage.getItem("portfolio-language") || "en";
} catch (error) {
  savedLanguage = "en";
}

setLanguage(savedLanguage);

const YT_EMBED_URL = "https://www.youtube-nocookie.com/embed/";

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

function loadThumbnail(img, videoId) {
  const fallbackSrc = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  let usedFallback = false;

  const useFallback = () => {
    if (usedFallback) return;
    usedFallback = true;
    img.src = fallbackSrc;
  };

  img.addEventListener("error", useFallback);

  img.addEventListener("load", () => {
    if (img.naturalWidth <= 120) useFallback();
  });

  img.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

function renderPoster(player) {
  const videoId = player.dataset.videoId;
  const title = player.dataset.title || "Video";
  const tag = player.dataset.tag || "";

  player.classList.remove("is-playing");

  player.innerHTML = `
    <button type="button" class="yt-poster" aria-label="Play: ${title}">
      <img alt="" loading="lazy" />
      <span class="yt-play">${PLAY_ICON}</span>
      ${tag ? `<span class="yt-tag">${tag}</span>` : ""}
    </button>
  `;

  loadThumbnail(player.querySelector("img"), videoId);

  player
    .querySelector(".yt-poster")
    .addEventListener("click", () => playVideo(player));
}

function playVideo(player) {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  const iframe = document.createElement("iframe");

  iframe.src = `${YT_EMBED_URL}${player.dataset.videoId}?${params}`;
  iframe.title = player.dataset.title || "Video";
  iframe.allow =
    "autoplay; encrypted-media; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  player.classList.add("is-playing");
  player.replaceChildren(iframe);
}

document.querySelectorAll(".yt-player").forEach(renderPoster);

const gamingStage = document.getElementById("gaming-stage");
const gamingTabs = document.querySelectorAll(".gaming-tab");

gamingTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const alreadyActive = tab.classList.contains("active");

    gamingTabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    if (alreadyActive) {
      if (!gamingStage.classList.contains("is-playing")) {
        playVideo(gamingStage);
      }
      return;
    }

    gamingStage.dataset.videoId = tab.dataset.videoId;
    gamingStage.dataset.title = tab.dataset.title;
    gamingStage.dataset.tag = tab.dataset.tag;

    playVideo(gamingStage);
  });
});