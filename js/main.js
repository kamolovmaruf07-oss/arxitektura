/* ============================================================
   ARXA Studio — Soft UI interaktiv funksiyalar
   Kun (day) / Tun (night) rejimi + portfolio funksiyalari
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const navLinks = document.querySelectorAll(".nav-link");
  const toTop = document.getElementById("toTop");
  const toast = document.getElementById("toast");
  const root = document.documentElement;

  /* Toast — barcha bo'limlar uchun (funksiya e'loni, shuning uchun istalgan joydan chaqiriladi) */
  let toastTimer;
  function showToast(msg, ms = 3500) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), ms);
  }

  /* ==========================================================
     1. KUN / TUN / AVTO REJIMI
     ========================================================== */
  const THEME_KEY = "arxa-theme";
  const MODES = ["day", "night", "auto"];
  const META_COLORS = { day: "#e9f1fb", night: "#0a1c38" };
  const LABELS = { day: "Kun", night: "Tun" };
  const NIGHT_FROM = 19; // 19:00 dan — tun
  const NIGHT_UNTIL = 7; // 07:00 gacha — tun

  const themeToggles = ["themeToggle", "themeToggleMobile"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const themeAutoBtns = ["themeAuto", "themeAutoMobile"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const themeLabels = ["themeLabel", "themeLabelMobile"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const themeMeta = document.getElementById("themeColor");

  let themingTimer;

  const readMode = () => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return MODES.indexOf(v) > -1 ? v : "auto";
    } catch (e) {
      return "auto";
    }
  };

  let mode = readMode();

  const autoTheme = () => {
    const h = new Date().getHours();
    return h >= NIGHT_FROM || h < NIGHT_UNTIL ? "night" : "day";
  };
  const resolve = (m) => (m === "auto" ? autoTheme() : m);
  const currentTheme = () => (root.getAttribute("data-theme") === "night" ? "night" : "day");

  /* Rasmni kunning/tunning fotosiga almashtirish (silliq fade bilan) */
  const swapThemedImages = (theme) => {
    document.querySelectorAll("img[data-night]").forEach((img) => {
      const next = img.dataset[theme] || img.getAttribute("src");
      if (!next || img.getAttribute("src").endsWith(next)) return;

      img.classList.add("fade");
      const reveal = () => {
        img.classList.remove("fade");
        img.removeEventListener("load", reveal);
      };
      img.addEventListener("load", reveal);
      setTimeout(reveal, 900); // fallback (keshlangan rasm load hodisasini tashlamasa)
      img.setAttribute("src", next);
    });
  };

  const applyMode = (nextMode, opts = {}) => {
    mode = MODES.indexOf(nextMode) > -1 ? nextMode : "auto";
    const theme = resolve(mode);

    root.classList.add("theming");
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-mode", mode);

    themeToggles.forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "night" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        `Rejim: ${LABELS[theme]} (${mode === "auto" ? "avto" : "qo'lda"}). ` +
          `${theme === "night" ? "Kun" : "Tun"} rejimiga o'tish`
      );
      btn.setAttribute("title", `${LABELS[theme]} · ${mode === "auto" ? "Avto" : "Qo'lda"} — bosing (T)`);
    });
    themeLabels.forEach((el) => (el.textContent = LABELS[theme]));
    themeAutoBtns.forEach((btn) => {
      btn.setAttribute("aria-pressed", mode === "auto" ? "true" : "false");
      btn.classList.toggle("on", mode === "auto");
      btn.setAttribute("title",
        mode === "auto"
          ? `Avto yoqilgan: ${LABELS[theme]} (soat ${theme === "night" ? "kechki" : "kunduzgi"})`
          : "Avto-rejimni yoqish — soat bo'yicha kun/tun (A)"
      );
    });

    if (themeMeta) themeMeta.setAttribute("content", META_COLORS[theme]);

    swapThemedImages(theme);

    if (opts.persist !== false) {
      try {
        localStorage.setItem(THEME_KEY, mode);
      } catch (e) {}
    }

    clearTimeout(themingTimer);
    themingTimer = setTimeout(() => root.classList.remove("theming"), 650);

    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme, mode } }));
  };

  /* Perklyuchatel: avto holatidan chiqib, qo'lda qarama-qarshi rejimga o'tadi */
  const toggleTheme = (announce = true) => {
    const next = currentTheme() === "night" ? "day" : "night";
    applyMode(next);
    if (announce) showToast(next === "night" ? "🌙 Tun rejimi yoqildi" : "☀️ Kun rejimi yoqildi", 1800);
  };

  /* Avto tugmasi: yoqish/o'chirish */
  const toggleAuto = (announce = true) => {
    if (mode === "auto") {
      applyMode(currentTheme());
      if (announce) showToast("⏱ Avto o'chirildi — rejim qo'lda saqlanadi", 1800);
    } else {
      applyMode("auto");
      if (announce) showToast(`⏱ Avto yoqildi — ${LABELS[resolve("auto")]} rejimi`, 1800);
    }
  };

  themeToggles.forEach((btn) => btn.addEventListener("click", () => toggleTheme()));
  themeAutoBtns.forEach((btn) => btn.addEventListener("click", () => toggleAuto()));

  /* Klaviatura: T — kun/tun, A — avto */
  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "t") toggleTheme();
    else if (k === "a") toggleAuto();
  });

  /* Boshqa oynada rejim o'zgarsa — shu oynaga ham o'tadi */
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY && MODES.indexOf(e.newValue) > -1) applyMode(e.newValue, { persist: false });
  });

  /* Avto holatida soat yurganda o'zi almashinadi (30 soniyada tekshiriladi) */
  setInterval(() => {
    if (mode === "auto" && resolve("auto") !== currentTheme()) {
      applyMode("auto");
      showToast(autoTheme() === "night" ? "🌙 Kech bo'ldi — tun rejimi" : "☀️ Tong otildi — kun rejimi", 2600);
    }
  }, 30000);

  /* Sahifa chizilgach holatni UI'ga yozamiz va ikkinchi rasmlarni yuklaymiz */
  applyMode(mode, { persist: false });

  const preload = () => {
    try {
      document.querySelectorAll("img[data-night]").forEach((img) => {
        const other = currentTheme() === "night" ? img.dataset.day : img.dataset.night;
        if (other) new Image().src = other;
      });
    } catch (e) {}
  };
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(preload, { timeout: 2500 });
  else setTimeout(preload, 1600);

  /* ---------- Navbar: scroll'da soyali ko'rinish ---------- */
  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    toTop.classList.toggle("show", window.scrollY > 500);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobil menyu ---------- */
  const closeMenu = () => {
    burger.classList.remove("open");
    mobileMenu.classList.remove("open");
  };

  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });

  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------- Aktiv bo'limni belgilash ---------- */
  const sections = [...document.querySelectorAll("section[id]")];
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}` ||
                (id === "home" && link.getAttribute("href") === "#top")
            );
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Reveal animatsiyasi (scroll'da) ---------- */
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- Hisoblagichlar (counters) ---------- */
  const animateCounter = (el) => {
    const target = +el.dataset.target;
    const duration = 1800;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll(".stat-num[data-target]").forEach((el) => counterObserver.observe(el));

  /* ---------- Loyihalar filtri ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projects = document.querySelectorAll(".project-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      projects.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        if (match) {
          card.classList.remove("hidden");
          card.style.animation = "none";
          requestAnimationFrame(() => {
            card.style.animation = "cardIn .5s cubic-bezier(.22,.68,.32,1) both";
          });
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

  // Kartalar filtrda paydo bo'lish animatsiyasi
  const style = document.createElement("style");
  style.textContent =
    "@keyframes cardIn { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }";
  document.head.appendChild(style);

  /* ==========================================================
     LOYIHA MODALI (lightbox)
     ========================================================== */
  const lbWrap = document.getElementById("lightbox");
  const lbPanel = document.getElementById("lbPanel");
  const lbImg = document.getElementById("lbImg");
  const lbTitle = document.getElementById("lbTitle");
  const lbTag = document.getElementById("lbTag");
  const lbDesc = document.getElementById("lbDesc");
  const lbPlace = document.getElementById("lbPlace");
  const lbYear = document.getElementById("lbYear");
  const lbArea = document.getElementById("lbArea");
  const lbStatus = document.getElementById("lbStatus");
  const lbCount = document.getElementById("lbCount");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  const lb = { card: null, lastFocus: null };

  const lbCards = () => [...document.querySelectorAll(".project-card[data-lb]")];
  const lbVisible = () => lbCards().filter((c) => !c.classList.contains("hidden"));

  const lbFill = (card) => {
    if (!card) return;
    lb.card = card;

    const srcImg = card.querySelector("img");
    const theme = currentTheme();
    const nextSrc = (srcImg && srcImg.dataset[theme]) || srcImg.getAttribute("src");

    lbImg.classList.add("swap");
    const settle = () => {
      lbImg.classList.remove("swap");
      lbImg.removeEventListener("load", settle);
    };
    lbImg.addEventListener("load", settle);
    lbImg.setAttribute("src", nextSrc);
    lbImg.alt = srcImg.alt || card.dataset.title;
    setTimeout(settle, 400);

    lbTitle.textContent = card.dataset.title;
    lbTag.textContent = card.dataset.tag;
    const descEl = card.querySelector(".project-desc");
    lbDesc.textContent = card.dataset.desc || (descEl ? descEl.textContent.trim() : srcImg.alt);
    lbPlace.textContent = card.dataset.place;
    lbYear.textContent = card.dataset.year;
    lbArea.textContent = card.dataset.area;
    lbStatus.textContent = card.dataset.status;

    const list = lbVisible();
    const i = list.indexOf(card);
    lbCount.textContent = (i + 1) + " / " + list.length;
    const single = list.length < 2;
    lbPrev.disabled = single;
    lbNext.disabled = single;
    lbPrev.setAttribute("aria-label", single ? "Loyiha yo'q" : "Oldingi loyiha");
    lbNext.setAttribute("aria-label", single ? "Loyiha yo'q" : "Keyingi loyiha");

    lbCards().forEach((c) => c.classList.toggle("opened", c === card));
  };

  const lbOpen = (card) => {
    if (!card || !lbWrap) return;
    lb.lastFocus = document.activeElement;
    lbWrap.hidden = false;
    requestAnimationFrame(() => {
      lbWrap.classList.add("open");
      document.body.classList.add("lb-lock");
    });
    lbFill(card);
    (lbPanel.querySelector(".lb-close") || lbPanel).focus({ preventScroll: true });
  };

  const lbClose = () => {
    if (!lbWrap || lbWrap.hidden) return;
    lbWrap.classList.remove("open");
    document.body.classList.remove("lb-lock");
    lbCards().forEach((c) => c.classList.remove("opened"));
    const done = () => {
      lbWrap.hidden = true;
      lbWrap.removeEventListener("transitionend", done);
    };
    lbWrap.addEventListener("transitionend", done);
    setTimeout(() => {
      if (!lbWrap.classList.contains("open")) lbWrap.hidden = true;
    }, 420);
    if (lb.lastFocus && lb.lastFocus.focus) lb.lastFocus.focus({ preventScroll: true });
    lb.card = null;
  };

  const lbStep = (dir) => {
    const list = lbVisible();
    if (list.length < 2) return;
    const i = list.indexOf(lb.card);
    const next = list[(i + dir + list.length) % list.length];
    lbFill(next);
  };

  document.querySelectorAll("[data-lb-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      lbOpen(btn.closest(".project-card"));
    });
  });

  lbCards().forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      lbOpen(card);
    });
  });

  lbWrap.querySelectorAll("[data-lb-close]").forEach((el) => el.addEventListener("click", lbClose));
  lbPrev.addEventListener("click", () => lbStep(-1));
  lbNext.addEventListener("click", () => lbStep(1));

  document.getElementById("lbCta").addEventListener("click", lbClose);

  /* Modal ochiq bo'lganda klaviatura boshqaruvi (Esc, ←/→, Tab trap) */
  document.addEventListener("keydown", (e) => {
    if (!lbWrap || lbWrap.hidden) return;

    if (e.key === "Escape") {
      e.preventDefault();
      lbClose();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      lbStep(1);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      lbStep(-1);
      return;
    }
    if (e.key === "Tab") {
      const f = [...lbPanel.querySelectorAll("button, a[href], [tabindex]:not([tabindex='-1'])")]
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* Rejim almashsa — modal rasmi ham shu rejimnikiga o'tadi */
  document.addEventListener("themechange", (e) => {
    if (!lbWrap.hidden && lb.card) {
      const img = lb.card.querySelector("img");
      lbImg.setAttribute("src", img.dataset[e.detail.theme] || img.getAttribute("src"));
    }
  });

  /* ---------- Aloqa formasi ---------- */
  const form = document.getElementById("contactForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.elements["name"].value.trim();
    const phone = form.elements["phone"].value.trim();
    const message = form.elements["message"].value.trim();

    if (!name || !phone || !message) {
      showToast("⚠️ Iltimos, ism, telefon va xabar maydonlarini to'ldiring.");
      return;
    }

    form.reset();
    showToast("✅ Xabaringiz yuborildi! 24 soat ichida bog'lanamiz.");
  });

  /* ---------- Yuqoriga qaytish ---------- */
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Yil ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
