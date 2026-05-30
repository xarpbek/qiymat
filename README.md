<div align="center">

# Qiymat 💎

**Premium shaxsiy moliya menejeri — to'liq mahalliy, to'liq sizniki.**

![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?style=flat-square&logo=javascript&logoColor=000)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?style=flat-square&logo=pwa&logoColor=fff)
![Offline first](https://img.shields.io/badge/Offline-first-10a35b?style=flat-square)
![No backend](https://img.shields.io/badge/No-backend-0a0a0a?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

[Live demo →](https://xarpbek.github.io/qiymat) · [Features](#-features) · [Tech](#-tech-stack) · [Privacy](#-privacy)

</div>

---

**Qiymat** (O'zbekcha: *qiymat* — "value, worth") — bu brauzeringizda yashaydigan, hech qaerga ulanmaydigan, premium darajadagi shaxsiy moliya menejeri. Apple Wallet stack, Notion's tipografiyasi, Revolut UX'i va YNAB byudjet falsafasidan ilhomlangan.

> **100% client-side.** Backend yo'q. Tracking yo'q. Akkaunt yo'q. Faqat oching va boshlang.

## ✨ Features

### Asosiy
- 🏠 **Dashboard** — animatsiyali balans, daromad/xarajat delta, sparkline, top kategoriyalar (donut), byudjet halqalari, maqsadlar, kun tavsiyasi
- 💸 **Tranzaksiyalar** — qidiruv, filtr, kun bo'yicha guruhlash, CSV eksport
- ➕ **Add/Edit modal** — kalkulyator rejimi (`1500+2300` avtomatik hisoblaydi), kategoriya pikker, ovozli kiritish (Web Speech API), takroriy to'lovlar
- 🎯 **Byudjet** — har kategoriya uchun aylana progress, **50/30/20** preset, kunlik ruxsat hisoblash, ranglar (yashil/sariq/qizil)
- 💎 **Maqsadlar** — gradient kartalar, "X kunda erishish" hisoblash, **konfetti + ovoz + tebranish** maqsad bajarilganda
- 💳 **Hisoblar** — Apple Wallet uslubidagi card stack, 7 tur (naqd, karta, bank, e-hamyon, jamg'arma, investitsiya, kripto), transferlar
- 📊 **Hisobotlar** — Chart.js bilan: daromad/xarajat chiziqli grafigi, kategoriyalar donut, 12-oylik trend, top kategoriyalar
- 🏷️ **Kategoriyalar** — 27 ta default + maxsus (emoji + rang + tur)
- 🔁 **Takroriy** — obunalar, oylik/yillik xarajat preview
- 📈 **Sof aktiv** — aktivlar/qarzlar, 12-oylik trend
- 🤖 **Tavsiyalar** — qoidaga asoslangan AI: hafta-haftaga taqqoslash, eng katta kategoriya, jamg'arma darajasi, obuna xarajatlari
- 🛠️ **Mini-ilovalar** — 9 ta kalkulyator: kredit, ipoteka, murakkab foiz, valyuta konvertor, ROI, choychaqa, hisob bo'lish, inflyatsiya, maqsad rejasi

### Tajriba
- 🌓 **Light/Dark/Auto** — silliq tranzitsiyalar
- 🎨 **6 aksent rangi** — Default · Green · Blue · Purple · Orange · Rose
- 📲 **PWA** — uy ekraniga o'rnating, offline ishlaydi, app shortcuts
- 🌍 **3 til** — O'zbek (default), English, Русский
- 🔊 **Ovoz + tebranish** — yoqimli mikro-feedback
- ⌨️ **Klaviatura yorliqlari** — `N` (yangi), `T` (mavzu), `G+D/T/B/S/A/R` (sahifalar)
- 🎤 **Ovozli kiritish** — summa va izohlar
- 👁️ **Maxfiylik rejimi** — balanslarni blurlash
- 🎭 **Glassmorfizm**, layered shadows, 60fps animatsiyalar

### Performance
- Faqat **vanilla JS** — framework yo'q
- localStorage + IndexedDB-tayyor schema
- Service Worker stale-while-revalidate caching
- Reduced motion qo'llab-quvvatlash
- Mobile-first responsive layout

## 🧰 Tech Stack

| Layer        | Choice |
|--------------|--------|
| Frontend     | Vanilla JavaScript, CSS Custom Properties |
| Charts       | [Chart.js v4](https://www.chartjs.org/) |
| Persistence  | `localStorage` (+ IndexedDB-ready schema) |
| Routing      | Custom hash router |
| PWA          | Service Worker + Web App Manifest |
| APIs         | Web Audio · Web Speech · Notification · Vibration |
| Fonts        | Inter (UI) + DM Serif Display (display) + JetBrains Mono |

**No build step.** Just open `index.html` in a static host.

## 🚀 Quick start

```bash
# Clone
git clone https://github.com/xarpbek/qiymat.git
cd qiymat

# Serve (any static server works)
python3 -m http.server 8000
# yoki:
npx serve
```

Browseringda `http://localhost:8000` ni oching.

## 📦 Project structure

```
qiymat/
├── index.html        — App qobig'i
├── style.css         — Dizayn tizimi (~700 LOC, custom properties)
├── app.js            — Asosiy logika (state, router, i18n, views)
├── confetti.js       — Konfetti effekti
├── sw.js             — Service Worker (offline-first)
├── manifest.json     — PWA manifest
└── icon.svg          — App ikonkasi
```

## 🔒 Privacy

- ✅ **100% client-side.** Hech qanday network so'rov yuborilmaydi (fontlar va Chart.js dan tashqari, ular cache'lanadi).
- ✅ **No analytics.** No tracking. No fingerprinting.
- ✅ **No account.** Akkaunt yaratish kerak emas.
- ✅ **Eksport/import** — JSON yoki CSV orqali to'liq nazorat.
- ✅ **Reset** — bir bosish bilan barcha ma'lumotlarni o'chirish.

## ⌨️ Keyboard shortcuts

| Yorliq | Amal |
|--------|------|
| `N` | Yangi tranzaksiya |
| `T` | Light/Dark almashtirish |
| `G` `D` | Bosh sahifa |
| `G` `T` | Tranzaksiyalar |
| `G` `B` | Byudjet |
| `G` `S` | Maqsadlar |
| `G` `A` | Hisoblar |
| `G` `R` | Hisobotlar |
| `Esc` | Modal yopish |

## 🎨 Design philosophy

- **Minimalism first** — har bir piksel maqsadli
- **Glassmorphism** — chuqurlik va yumshoq soyalar
- **Notion typography** — Inter, tabular-nums summalar uchun
- **Apple Wallet** — hisoblar uchun card stack
- **Spring animations** — `cubic-bezier(.34,1.56,.64,1)` "pop" effektlari uchun
- **60fps** — barcha animatsiyalar GPU `transform` orqali

## 🌐 Browser support

Chrome / Edge / Safari / Firefox (oxirgi 2 versiya). Mobile Safari va Chrome Android — first-class.

## 📜 License

MIT — istalgan tarzda foydalaning.

---

<div align="center">

**Privatlikda yaratilgan. Sevgi bilan.** 💎

</div>
