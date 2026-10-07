# ARXA Studio — Arxitektura Portfolyo

**Soft UI (Neo-UI)** uslubidagi zamonaviy arxitektura portfolyo sayti — **Kun** va **Tun** rejimlari bilan.

## Asosiy xususiyatlar

- 🎨 **Ranglar:** och ko'k (`#e9f1fb`) va to'q ko'k (`#123a78`) — CSS custom properties orqali boshqariladi
- 🌗 **Kun / Tun rejimi:** navbar'dagi soft-perklyuchatel, `localStorage`da saqlanadi, tizim (`prefers-color-scheme`) soziga moslashadi, klaviaturada **`T`** tugmasi
-  **Arxitektura rasmlari:** barchasi AI yordamida yaratilgan; hero va "biz haqida" bloklari uchun **alohida kechki fotolar** ham yasalgan (rejim almashganda rasm silliq almasinadi)
- ✨ Soft shadows, inset "uyuq" maydonlar, yumaloq burchaklar, yumshoq animatsiyalar
- 📱 To'liq responsiv + WCAG AA kontrast (ikkala rejimda ham tekshirilgan)

## Sahifa bo'limlari

1. **Hero** — shior, statistika, suzuvchi kartalar va kechki osmon effekti
2. **Xizmatlar** — 6 ta xizmat kartasi
3. **Biz haqida** — studio, ustunliklar ro'yxati, tajriba badge'i
4. **Loyihalar** — filtrli portfolyo (Uylar / Binolar / Ichki dizayn / Jamoat)
5. **Statistika** — animatsion hisoblagichlar (to'q ko'k panel)
6. **Mijozlar fikri** — 3 ta sharh
7. **Aloqa** — soft-forma + kontakt ma'lumotlari

## Kun / Tun qanday ishlaydi

| Qism | Kun (day) | Tun (night) |
| --- | --- | --- |
| Fon | och ko'k gradient | chuqur to'q ko'k + oy nuri |
| Panelar | `#f4f9ff → #e7f0fb`, oq yorug' soyalar | `#17325c → #0b1e3c`, pastel ko'k yorug'lik |
| Matn | `#0d2c5e` / `#4f6890` | `#eaf2ff` / `#8aa6cc` |
| Rasmlar | kunduzgi fotosurat | kechki fotosurat (hero, about) + sovuq filtr (loyihalar) |
| Qo'shimcha | — | yulduzlar, oy, "yulduz uchishi" animatsiyasi |

Mantiq `js/main.js` ichida: `applyTheme()` → `data-theme` atributi, `theme-color` meta, sarlavha matni va rasmlar almashtiriladi; o'tish 650 ms davomida `.theming` klassi orqali silliq bo'ladi.

## Ishga tushirish

```bash
python3 -m http.server 8000
# yoki
npx serve .
```

Brauzerda `http://localhost:8000` oching.

## Tuzilma

```
├── index.html              # Asosiy sahifa + rejimni oldindan o'rnatuvchi inline skript
├── css/styles.css          # Soft UI dizayn tizimi (kun/tun tokenlari)
├── js/main.js              # Rejim, filtr, hisoblagich, forma mantiqi
└── images/
    ├── hero.jpg            hero-night.jpg       # bino — kunduz / tun
    ├── about.jpg           about-night.jpg      # maket ustaxonasi — kunduz / tun
    └── project-1..6.jpg                         # portfolio loyihalari
```

## Texnologiyalar

- Toza HTML5 + CSS3 (Custom Properties) + Vanilla JavaScript — frameworklar ishlatilmagan
- `IntersectionObserver` (reveal + hisoblagichlar), `matchMedia`, `localStorage`, `requestIdleCallback` (kechki rasmlarni oldindan yuklash)
