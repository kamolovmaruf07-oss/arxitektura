# ARXA Studio — Arxitektura Portfolyo

**Soft UI (Neo-UI)** uslubidagi arxitektura portfolyo sayti — **Kun**, **Tun** va **Avto** rejimlari bilan.

## Asosiy xususiyatlar

- 🎨 **Ranglar:** och ko'k (`#e9f1fb`) va to'q ko'k (`#123a78`) — hammasi CSS custom properties (token) orqali
- 🌗 **Kun / Tun:** navbar va mobil menyudagi soft-perklyuchatel, tanlov `localStorage`da saqlanadi
- ⏱ **Avto-rejim:** soat bo'yicha — 07:00–19:00 kun, tunda tun; sahicha ochilganda ham to'g'ri rejim tanlanadi (FOUC yo'q). 30 soniyada bir tekshiriladi, kechga o'tganda o'zi almashinadi
- 🏛 **20 ta AI rasmi:** 8 ta loyiha uchun alohida **kunduzgi va kechki** variant — rejim almashganda rasm silliq fade bilan almashtiriladi
- ✨ Soft shadows, inset maydonlar, kechki osmon (yulduzlar, oy, yulduz uchishi), yumshoq animatsiyalar
- ♿ Ikkala rejimda ham kontrast WCAG AA tekshiruvidan o'tgan; `prefers-reduced-motion` hurmat qilinadi
- 📱 To'liq responsiv (mobil / planshet / desktop)

## Sahifa bo'limlari

1. **Hero** — shior, statistika, suzuvchi kartalar
2. **Xizmatlar** — 6 ta xizmat kartasi
3. **Biz haqida** — studio va ustunliklar
4. **Loyihalar** — filtrli portfolyo (Uylar / Binolar / Ichki dizayn / Jamoat)
5. **Statistika** — animatsion hisoblagichlar (to'q ko'k panel)
6. **Mijozlar fikri** — 3 ta sharh
7. **Aloqa** — soft-forma + kontaktlar

## Rejimlarni boshqarish

| Amal | Qanday |
| --- | --- |
| Kun ↔ Tun | navbar/menyu perklyuchateli yoki **`T`** tugmasi |
| Avto on/off | **Avto** chipi yoki **`A`** tugmasi |
| Saqlash | `localStorage["arxa-theme"]` = `"day" \| "night" \| "auto"` |
| Birinchi tashrif | `auto` — soatga qarab tanlanadi |
| Boshqa oyna | `storage` hodisasi orqali sinxronlanadi |

Avto holatida perklyuchatelni bossangiz — sayt avtomatikdan chiqib, tanlovingizni qo'lda saqlaydi.

## Ishga tushirish va test

```bash
npm run dev      # python3 -m http.server 8000 → http://localhost:8000
npm test         # node tests/theme.test.js (jsdom bilan 47 ta tekshiruv)
```

`npm test` o'zi kichik statik server ochadi, sahifani jsdom'da yuklaydi va:
rejim almashinuvi, `data-theme`/`data-mode`, rasm swap (16 ta rasm fayli 200 qaytishi),
`localStorage`, klaviatura (`T`, `A`), forma validatsiyasi, portfolyo filtri, hisoblagichlar
va **soatni sun'iy o'zgartirib** 6 ta chegara holatini (06:00 / 07:00 / 18:00 / 19:00 / 21:00 / 12:00) tekshiradi.

## GitHub Pagesga chiqarish

`.github/workflows/pages.yml` — `main`ga har pushda avval testlar ishga tushadi, so'ngra sayt
Pages'ga chiqariladi (build talab qilinmaydi). Birinchi marta sozlanadi:

```bash
gh api -X POST repos/:owner/:repo/pages -f build_type=workflow \
  -f "source[branch]=main" -f "source[path]=/"
```

Manzil: `https://<github-foydalanuvchi>.github.io/arxitektura/`

Agar Pages yoqilmasa: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Tuzilma

```
├── index.html              # Sahifa + rejimni oldindan o'rnatuvchi inline skript
├── css/styles.css          # Soft UI dizayn tizimi (kun/tun tokenlari)
├── js/main.js              # Rejim (kun/tun/avto), filtr, hisoblagich, forma
├── tests/theme.test.js     # jsdom asosidagi 68 ta tekshiruv
├── .github/workflows/      # Pages'ga avtomatik chiqarish
└── images/                 # AI rasmlari: 8 juft (kunduz/kech) + about/hero
    ├── hero.jpg            hero-night.jpg
    ├── about.jpg           about-night.jpg
    └── project-1..6.jpg    project-1..6-night.jpg
```

## Texnik detallar

- Framework yo'q: toza HTML + CSS + Vanilla JS
- `IntersectionObserver` (reveal + hisoblagichlar), `localStorage`, `requestIdleCallback` (ikkinchi rasmlarni oldindan yuklash)
- Rejim almashinuvi `.theming` klassi orqali 650 ms silliq transisiya bilan; ochilishda `html.preload-theme` transisiyalari o'chiriladi
- `theme-color` meta har bir rejimda yangilanadi (mobil brauzer paneli ham moslashadi)
