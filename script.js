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
  ".cases-intro",
  ".case-header",
  ".case-notes",
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
const languageIntro = document.getElementById("language-intro");
const languageIntroButtons = document.querySelectorAll(".language-intro-button");
const translatableElements = document.querySelectorAll("[data-en][data-id]");

const BRIEF_STORAGE_KEY = "portfolio-brief";

function setLanguage(language) {
  translatableElements.forEach((element) => {
    element.textContent = element.dataset[language];
  });

  document.querySelectorAll("[data-placeholder-en][data-placeholder-id]").forEach(
    (element) => {
      element.placeholder = element.getAttribute(`data-placeholder-${language}`);
    }
  );

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

let savedLanguage = null;

try {
  savedLanguage = localStorage.getItem("portfolio-language");
} catch (error) {
  savedLanguage = null;
}

setLanguage(savedLanguage || "en");

function closeLanguageIntro() {
  if (!languageIntro) return;

  languageIntro.classList.add("is-closing");

  window.setTimeout(() => {
    languageIntro.classList.remove("is-visible", "is-closing");
    languageIntro.setAttribute("aria-hidden", "true");
  }, 720);
}

languageIntroButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.introLang);
    closeLanguageIntro();
  });
});

if (languageIntro) {
  languageIntro.classList.add("is-visible");
  languageIntro.setAttribute("aria-hidden", "false");
}

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

document.querySelectorAll(".case").forEach((caseElement) => {
  const switchElement = caseElement.querySelector(".case-switch");
  const allVersions = Array.from(caseElement.querySelectorAll(".case-version"));
  const versions = allVersions.filter((version) => (version.dataset.videoId || "").trim());
  const notes = Array.from(caseElement.querySelectorAll(".case-note"));
  const orientation = caseElement.dataset.orientation || "landscape";
  const stage = caseElement.querySelector(".case-stage");
  const player = stage ? stage.querySelector(".yt-player") : null;
  const briefNote = caseElement.querySelector('.case-note[data-version="brief"]');
  const activeVersion = versions.find((version) => version.classList.contains("active")) || versions[0];

  caseElement.dataset.orientation = orientation;

  if (player) {
    player.classList.toggle("yt-player--vertical", orientation === "portrait");
  }

  notes.forEach((note) => {
    note.hidden = note.dataset.version !== (activeVersion?.dataset.version || "brief");
  });

  if (versions.length < 2 || !switchElement) {
    if (switchElement) switchElement.hidden = true;
    if (briefNote) briefNote.hidden = false;
    const takeNote = caseElement.querySelector('.case-note[data-version="take"]');
    if (takeNote) takeNote.hidden = true;
    if (player) delete player.dataset.tag;
  } else {
    versions.forEach((version) => {
      version.addEventListener("click", () => {
        const alreadyActive = version.classList.contains("active");

        versions.forEach((item) => {
          const isActive = item === version;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });

        if (alreadyActive) {
          if (player && !player.classList.contains("is-playing")) {
            playVideo(player);
          }
          return;
        }

        if (!stage || !player) return;

        notes.forEach((note) => {
          note.hidden = note.dataset.version !== version.dataset.version;
        });

        player.dataset.videoId = version.dataset.videoId || "";
        player.dataset.title = version.dataset.title || "Video";

        if (version.dataset.tag) {
          player.dataset.tag = version.dataset.tag;
        } else {
          delete player.dataset.tag;
        }

        if ((version.dataset.orientation || orientation) !== orientation) {
          stage.dataset.fit = "contain";
        } else {
          delete stage.dataset.fit;
        }

        playVideo(player);
      });
    });
  }

  if (activeVersion && versions.length >= 2 && player) {
    player.dataset.tag = activeVersion.dataset.tag || "";
  }

  caseElement.querySelectorAll(".case-more").forEach((moreButton) => {
    moreButton.addEventListener("click", () => {
      const note = moreButton.closest(".case-note");
      const moreContent = note ? note.querySelector(".case-more-content") : null;

      if (!moreContent) return;

      const expanded = moreButton.getAttribute("aria-expanded") === "true";
      moreButton.setAttribute("aria-expanded", String(!expanded));
      moreContent.hidden = expanded;
    });
  });
});

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

const CONTACT_WHATSAPP = "6281289678945";
const CONTACT_EMAIL = "rmyusuf.collab@gmail.com";
 
const BRIEF_COPY = {
  en: {
    intro: (name) =>
      name
        ? `Hi Yusuf, I'm ${name}. I'd like to talk about a video edit.`
        : "Hi Yusuf, I'd like to talk about a video edit.",
    package: "Package",
    type: "Video type",
    footage: "Footage",
    deadline: "Deadline",
    reference: "Reference",
    details: "What I have in mind",
    subject: (name) =>
      name ? `Video edit inquiry — ${name}` : "Video edit inquiry",
    copied: "COPIED",
    failed: "COPY FAILED",
  },
  id: {
    intro: (name) =>
      name
        ? `Halo Yusuf, saya ${name}. Saya ingin membahas editing video.`
        : "Halo Yusuf, saya ingin membahas editing video.",
    package: "Paket",
    type: "Jenis video",
    footage: "Footage",
    deadline: "Deadline",
    reference: "Referensi",
    details: "Yang saya inginkan",
    subject: (name) =>
      name ? `Permintaan editing video — ${name}` : "Permintaan editing video",
    copied: "TERSALIN",
    failed: "GAGAL MENYALIN",
  },
};
 
const briefForm = document.getElementById("brief-form");

function saveBriefState() {
  if (!briefForm) return;

  const state = {};

  Array.from(briefForm.elements).forEach((field) => {
    if (!field.name) return;

    if (field.type === "checkbox" || field.type === "radio") {
      if (!state[field.name]) state[field.name] = [];
      if (field.checked) state[field.name].push(field.value);
      return;
    }

    state[field.name] = field.value;
  });

  try {
    localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
  }
}

function restoreBriefState() {
  if (!briefForm) return;

  let savedState;

  try {
    savedState = JSON.parse(localStorage.getItem(BRIEF_STORAGE_KEY) || "null");
  } catch (error) {
    savedState = null;
  }

  if (!savedState) return;

  Array.from(briefForm.elements).forEach((field) => {
    if (!field.name || savedState[field.name] === undefined) return;

    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = savedState[field.name].includes(field.value);
      return;
    }

    field.value = savedState[field.name];
  });
}

restoreBriefState();

if (briefForm) {
  briefForm.addEventListener("input", saveBriefState);
  briefForm.addEventListener("change", saveBriefState);

  briefForm.querySelectorAll('.chip input[type="radio"]').forEach((input) => {
    const label = input.closest(".chip");

    if (!label) return;

    label.addEventListener("pointerdown", () => {
      label.dataset.wasChecked = String(input.checked);
    });

    label.addEventListener("click", (event) => {
      if (label.dataset.wasChecked !== "true") return;

      event.preventDefault();
      input.checked = false;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      delete label.dataset.wasChecked;
    });
  });
}
 
function currentLanguage() {
  return document.documentElement.lang === "id" ? "id" : "en";
}
 

function getBriefLabel(input) {
  const label = input.closest("label");
  const textElement = label
    ? label.querySelector("[data-brief-label]")
    : null;
 
  return textElement ? textElement.textContent.trim() : input.value;
}
 

function formatBriefLabel(input) {
  const text = getBriefLabel(input).toLowerCase();

  if (input.name === "package" && input.value !== "not-sure") {
    return text.replace(/(^|\s)(\S)/g, (match, space, letter) => {
      return space + letter.toUpperCase();
    });
  }
 
  return text.charAt(0).toUpperCase() + text.slice(1);
}
 
function buildBriefMessage() {
  const copy = BRIEF_COPY[currentLanguage()];
  const field = (name) => briefForm.elements[name].value.trim();
 
  const name = field("clientName");
  const selectedPackage = briefForm.querySelector(
    'input[name="package"]:checked'
  );
  const selectedFootage = briefForm.querySelector(
    'input[name="footage"]:checked'
  );
  const types = Array.from(
    briefForm.querySelectorAll('input[name="type"]:checked')
  ).map(formatBriefLabel);
 
  const rows = [
    [copy.package, selectedPackage ? formatBriefLabel(selectedPackage) : ""],
    [copy.type, types.map((type, index) => (index ? type.toLowerCase() : type)).join(", ")],
    [
      copy.footage,
      selectedFootage && !selectedFootage.dataset.skip
        ? formatBriefLabel(selectedFootage)
        : "",
    ],
    [copy.deadline, field("deadline")],
    [copy.reference, field("reference")],
  ];
 
  const lines = [copy.intro(name), ""];
 
  rows.forEach(([label, value]) => {
    if (value) lines.push(`${label}: ${value}`);
  });
 
  const details = field("details");
 
  if (details) {
    lines.push("", `${copy.details}:`, details);
  }
 
  return lines.join("\n");
}
 
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {

    const area = document.createElement("textarea");
 
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
 
    document.body.appendChild(area);
    area.select();
 
    let success = false;
 
    try {
      success = document.execCommand("copy");
    } catch (fallbackError) {
      success = false;
    }
 
    area.remove();
 
    return success;
  }
}
 
if (briefForm) {
  briefForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
 
  briefForm.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-brief-action]");
 
    if (!button) return;
 
    const action = button.dataset.briefAction;
    const copy = BRIEF_COPY[currentLanguage()];
    const message = buildBriefMessage();
 
    if (action === "whatsapp") {
      window.open(
        `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener"
      );
    }
 
    if (action === "email") {
      const name = briefForm.elements.clientName.value.trim();
      const subject = copy.subject(name);

      window.open(
        "https://mail.google.com/mail/?view=cm&fs=1" +
          `&to=${encodeURIComponent(CONTACT_EMAIL)}` +
          `&su=${encodeURIComponent(subject)}` +
          `&body=${encodeURIComponent(message)}`,
        "_blank",
        "noopener"
      );
    }
 
    if (action === "copy") {
      const success = await copyToClipboard(message);
 
      button.textContent = success ? copy.copied : copy.failed;
 
      window.setTimeout(() => {
        button.textContent = button.dataset[currentLanguage()];
      }, 1800);
    }
  });
}
 
