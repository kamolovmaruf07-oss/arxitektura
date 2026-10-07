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
     1. KUN / TUN REJIMI
     ========================================================== */
  const THEME_KEY = "arxa-theme";
  const META_COLORS = { day: "#e9f1fb", night: "#0a1c38" };
  const LABELS = { day: "Kun", night: "Tun" };

  const themeToggles = ["themeToggle", "themeToggleMobile"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const themeLabels = ["themeLabel", "themeLabelMobile"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const themeMeta = document.getElementById("themeColor");

  let themingTimer;
  let savedByUser = (() => {
    try {
      return !!localStorage.getItem(THEME_KEY);
    } catch (e) {
      return false;
    }
  })();

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

  const applyTheme = (theme, persist = false) => {
    root.classList.add("theming");
    root.setAttribute("data-theme", theme);

    themeToggles.forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "night" ? "true" : "false");
      btn.setAttribute("aria-label", `Rejim: ${LABELS[theme]}. ${theme === "night" ? "Kun" : "Tun"} rejimiga o'tish`);
      btn.setAttribute("title", `${LABELS[theme]} rejimi — bosing (${theme === "night" ? "Kun" : "Tun"})`);
    });
    themeLabels.forEach((el) => (el.textContent = LABELS[theme]));

    if (themeMeta) themeMeta.setAttribute("content", META_COLORS[theme]);

    swapThemedImages(theme);

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
        savedByUser = true;
      } catch (e) {}
    }

    clearTimeout(themingTimer);
    themingTimer = setTimeout(() => root.classList.remove("theming"), 650);

    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  };

  const toggleTheme = () => {
    const next = currentTheme() === "night" ? "day" : "night";
    applyTheme(next, true);
    showToast(next === "night" ? "🌙 Tun rejimi yoqildi" : "☀️ Kun rejimi yoqildi", 1800);
  };

  themeToggles.forEach((btn) => btn.addEventListener("click", toggleTheme));

  /* Klaviatura yorlig'i: "T" bosilsa rejim almashadi */
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.toLowerCase() === "t") toggleTheme();
  });

  /* Boshqa oynada rejim o'zgarsa — shu oynaga ham o'tadi */
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY && (e.newValue === "day" || e.newValue === "night")) {
      applyTheme(e.newValue);
    }
  });

  /* Tanlov saqlanmagan bo'lsa — tizim soziga bo'ysunamiz (matchMedia bo'lmasa ham islaydi) */
  const darkQuery =
    typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const onSystemTheme = (e) => {
    if (!savedByUser) applyTheme(e.matches ? "night" : "day");
  };
  if (darkQuery) {
    if (darkQuery.addEventListener) darkQuery.addEventListener("change", onSystemTheme);
    else if (darkQuery.addListener) darkQuery.addListener(onSystemTheme);
  }

  /* Sahifa chizilgach: holatni UI'ga yozamiz va ikkinchi rasmlarni oldindan yuklaymiz */
  applyTheme(currentTheme());

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
