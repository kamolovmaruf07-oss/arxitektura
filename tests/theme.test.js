/* ============================================================
   ARXA Studio — Kun/Tun/Avto mantiqini tekshirish
   Ishga tushirish:  npm test   (node tests/theme.test.js)
   Tashqi server kerak emas: shu fayl o'zi statik server ochadi.
   ============================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const PORT = 8123;
const BASE = `http://127.0.0.1:${PORT}`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const stubs = `
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
    unobserve() {} disconnect() {}
  };
`;

const results = [];
const check = (name, cond, extra = "") => {
  results.push({ ok: !!cond, name, extra });
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

async function load(page = "/", beforeParse = () => {}) {
  const dom = await JSDOM.fromURL(BASE + page, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.eval(stubs);
      beforeParse(window);
    },
  });
  await wait(700);
  return dom;
}

const click = (window, el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

/* ---------------- 1-seriya: qo'lda boshqaruv ---------------- */
async function manualSuite() {
  const dom = await load("/index.html");
  const { window } = dom;
  const doc = window.document;
  const html = doc.documentElement;
  const heroImg = doc.querySelector(".hero-card img");

  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));

  check("birinchi tashrif: mode = auto", html.getAttribute("data-mode") === "auto", html.getAttribute("data-mode"));

  const hour = new Date().getHours();
  const autoExpect = hour >= 19 || hour < 7 ? "night" : "day";
  check("Avto soatni to'g'ri o'qiydi", html.getAttribute("data-theme") === autoExpect, `${hour}:00 → ${html.getAttribute("data-theme")}`);
  check("Avto tugmasi faol", doc.getElementById("themeAuto").getAttribute("aria-pressed") === "true");

  const themed = [...doc.querySelectorAll("img[data-night]")];
  check("8 ta rasm kun/night juftligiga ega", themed.length === 8, themed.length + " ta");
  for (const img of themed) {
    for (const src of [img.dataset.day, img.dataset.night]) {
      const r = await fetch(BASE + "/" + src).catch(() => ({ status: 0 }));
      check(`rasm mavjud: ${src}`, r.status === 200, String(r.status));
    }
  }

  const nightTheme = autoExpect === "day" ? "night" : "day";
  click(window, doc.getElementById("themeToggle"));
  await wait(150);

  check("perklyuchatel rejimni almashtirdi", html.getAttribute("data-theme") === nightTheme, html.getAttribute("data-theme"));
  check("qo'lda tanlangach mode theme'ga teng", html.getAttribute("data-mode") === nightTheme, html.getAttribute("data-mode"));
  check("Avto bunda o'chadi", doc.getElementById("themeAuto").getAttribute("aria-pressed") === "false");
  check("label holatga mos", doc.getElementById("themeLabel").textContent === (nightTheme === "night" ? "Tun" : "Kun"));
  check("mobil label ham mos", doc.getElementById("themeLabelMobile").textContent === (nightTheme === "night" ? "Tun" : "Kun"));
  check("theme-color meta yangilandi", doc.getElementById("themeColor").getAttribute("content") === (nightTheme === "night" ? "#0a1c38" : "#e9f1fb"));
  check("localStorage'ga yozildi", window.localStorage.getItem("arxa-theme") === nightTheme, window.localStorage.getItem("arxa-theme"));
  check("hero rasm almashtirildi", heroImg.getAttribute("src").includes(nightTheme === "night" ? "hero-night" : "images/hero.jpg"), heroImg.getAttribute("src"));
  check("loyiha rasmlari ham almashtirildi",
    [...doc.querySelectorAll(".project-img img")].every((i) => i.getAttribute("src").includes(nightTheme === "night" ? "-night" : "project-")),
    doc.querySelector(".project-img img").getAttribute("src"));

  click(window, doc.getElementById("themeToggleMobile"));
  await wait(150);
  check("mobil perklyuchatel ham almashadi", html.getAttribute("data-theme") === autoExpect, html.getAttribute("data-theme"));

  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "t", bubbles: true }));
  await wait(120);
  check("T tugmasi Avto holatiga qaramay qo'lda almashtiradi",
    html.getAttribute("data-theme") === nightTheme && html.getAttribute("data-mode") === nightTheme,
    html.getAttribute("data-mode"));
  window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "a", bubbles: true }));
  await wait(120);
  check("A tugmasi Avtoni yoqadi", html.getAttribute("data-mode") === "auto" && window.localStorage.getItem("arxa-theme") === "auto",
    html.getAttribute("data-mode"));
  check("Avto chip .on klassini oladi", doc.getElementById("themeAuto").classList.contains("on"));

  // forma + filtr + hisoblagich
  doc.getElementById("contactForm").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await wait(80);
  check("bo'sh forma ogohlantiradi", /Iltimos/.test(doc.getElementById("toast").textContent));
  doc.querySelector('[data-filter="uylar"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(80);
  const shown = [...doc.querySelectorAll(".project-card")].filter((c) => !c.classList.contains("hidden"));
  check("filtr 'uylar' faqat 1 kartani qoldiradi", shown.length === 1, shown.length + " ta");
  doc.querySelector('[data-filter="all"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(80);
  check("filtr 'barchasi' 6 kartani qaytaradi",
    [...doc.querySelectorAll(".project-card")].filter((c) => !c.classList.contains("hidden")).length === 6);
  check("hisoblagich ishlaydi", doc.querySelector(".stat-num[data-target]").textContent !== "0",
    doc.querySelector(".stat-num[data-target]").textContent);

  // ---- LOYIHA MODALI ----
  const lbWrap = doc.getElementById("lightbox");
  const card3 = doc.querySelectorAll(".project-card[data-lb]")[2];
  check("kartalar modal atributlariga ega", doc.querySelectorAll(".project-card[data-lb]").length === 6);
  check("modal yopiq holatda", lbWrap.hidden === true && !lbWrap.classList.contains("open"));

  card3.querySelector("[data-lb-open]").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(120);
  check("modal ochildi", lbWrap.hidden === false && lbWrap.classList.contains("open"));
  check("sarlavha kartadan olindi", doc.getElementById("lbTitle").textContent === card3.dataset.title,
    doc.getElementById("lbTitle").textContent);
  check("tavsif modalga ko'chdi", doc.getElementById("lbDesc").textContent.length > 60,
    doc.getElementById("lbDesc").textContent.length + " belgi");
  check("spetsifikalar to'ldi", doc.getElementById("lbPlace").textContent === card3.dataset.place &&
    doc.getElementById("lbYear").textContent === card3.dataset.year &&
    doc.getElementById("lbArea").textContent === card3.dataset.area);
  check("modal rasmi karta rasmini oladi",
    doc.getElementById("lbImg").getAttribute("src").includes("project-3"), doc.getElementById("lbImg").getAttribute("src"));
  check("hisoblagich 3 / 6", doc.getElementById("lbCount").textContent.trim() === "3 / 6", doc.getElementById("lbCount").textContent);
  check("scroll qulflangan", doc.body.classList.contains("lb-lock"));

  doc.getElementById("lbNext").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(80);
  check("→ keyingi loyihaga o'tadi", doc.getElementById("lbTitle").textContent === "Mirak Muzeyi",
    doc.getElementById("lbTitle").textContent);
  const lbPrevClick = () => doc.getElementById("lbPrev").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  lbPrevClick();
  await wait(60);
  check("← bitta orqaga", doc.getElementById("lbTitle").textContent === "Jadid xonalar", doc.getElementById("lbTitle").textContent);
  lbPrevClick();
  lbPrevClick();
  await wait(60);
  check("←← ikkita orqaga — birinchi loyiha", doc.getElementById("lbTitle").textContent === "Aqua Tower",
    doc.getElementById("lbTitle").textContent);
  lbPrevClick();
  await wait(60);
  check("birinchidan ← oxirgisiga aylanadi", doc.getElementById("lbTitle").textContent === "Daryo ko'prigi",
    doc.getElementById("lbTitle").textContent);
  check("aylanishda hisoblagich ham yangilanadi", doc.getElementById("lbCount").textContent.trim() === "6 / 6",
    doc.getElementById("lbCount").textContent);

  // filtr hisobga olinadi: faqat "uylar" ko'ringanda modal 1 ta loyihada qoladi
  doc.querySelector('[data-filter="uylar"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(80);
  const card2 = [...doc.querySelectorAll(".project-card[data-lb]")].find((c) => !c.classList.contains("hidden"));
  card2.querySelector("[data-lb-open]").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(80);
  check("filtr modal naviga ham ta'sir qiladi", doc.getElementById("lbCount").textContent.trim() === "1 / 1",
    doc.getElementById("lbCount").textContent);
  check("bir dona bo'lganda tugmalar o'chirilgan", doc.getElementById("lbPrev").disabled && doc.getElementById("lbNext").disabled);
  doc.querySelector('[data-filter="all"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(60);

  // rejim almashganda modal rasmi ham almashadi
  const themeBefore = html.getAttribute("data-theme");
  click(window, doc.getElementById("themeToggle"));
  await wait(150);
  check("modal rasmi rejim bilan almashdi",
    doc.getElementById("lbImg").getAttribute("src").includes(themeBefore === "night" ? "project-2.jpg" : "project-2-night.jpg"),
    doc.getElementById("lbImg").getAttribute("src"));

  // Esc bilan yopish
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(120);
  check("Esc modalni yopadi", !lbWrap.classList.contains("open") && doc.body.classList.contains("lb-lock") === false);
  // backdrop bosilganda
  card3.querySelector("[data-lb-open]").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(80);
  doc.querySelector(".lb-backdrop").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(120);
  check("backdrop bosilganda yopiladi", !lbWrap.classList.contains("open"));
  // karta tanasini bosish ham ochadi
  card3.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await wait(80);
  check("karta tanasini bosish ham modalni ochadi", lbWrap.classList.contains("open"));

  check("→/← tugmalari modal yopiqda ishlatilmaydi", (function () {
    lbWrap.classList.remove("open"); lbWrap.hidden = true;
    doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    return lbWrap.hidden === true;
  })());

  check("JS xatoliklari yo'q", errors.length === 0, errors.join(" | "));
  window.close();
}

/* ---------------- 2-seriya: soat sinovi ---------------- */
async function clockSuite() {
  const hours = [
    { h: 21, want: "night" },
    { h: 6, want: "night" },
    { h: 7, want: "day" },
    { h: 12, want: "day" },
    { h: 18, want: "day" },
    { h: 19, want: "night" },
  ];
  for (const { h, want } of hours) {
    const dom = await load("/index.html", (window) => {
      window.eval(`Date.prototype.getHours = function () { return ${h}; };`);
    });
    const html = dom.window.document.documentElement;
    check(`${String(h).padStart(2, "0")}:00 → ${want}`, html.getAttribute("data-theme") === want, html.getAttribute("data-theme"));
    if (want === "night") {
      const img = dom.window.document.querySelector(".hero-card img");
      check(`${String(h).padStart(2, "0")}:00 kechki rasm bilan ochiladi`, img.getAttribute("src").includes("hero-night"), img.getAttribute("src"));
    }
    dom.window.close();
  }
}

(async () => {
  const server = await startServer();
  try {
    await manualSuite();
    await clockSuite();
  } catch (e) {
    check("testlar xatosiz o'tdi", false, String(e && e.message));
  } finally {
    server.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} tekshiruv muvaffaqiyatli`);
  if (failed.length) console.log("Muvaffaqiyatsiz:", failed.map((f) => f.name).join(", "));
  process.exit(failed.length ? 1 : 0);
})();
