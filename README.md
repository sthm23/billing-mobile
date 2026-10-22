# STHM Mobile — Expo + React Native

Mobile app for the **my-billing** retail POS system (brand **STHM**: Sotuv · Toʻlov · Hisobot · Mahsulot).

---

## Quick Start

```bash
npm install
npm start               # Expo dev server
npm run android         # Android
npm run ios             # iOS
npm run web             # Web
```

Before running, check `BASE_URL` in `src/api/axios-instance.ts` — it points to a LAN dev backend by default; production is `https://sthm23.uz/api`.

---

## ⚠️ Expo SDK 57

Always use the versioned docs: https://docs.expo.dev/versions/v57.0.0/
Install packages with `npx expo install <package>`.

---

## Documentation

| File | What |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | **Start here** — architecture, routing, styling, API, conventions |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | STHM design tokens, typography, components from the design, redesign status |
| [`COMPONENTS.md`](./COMPONENTS.md) | Base component API reference |
| [`src/components/base/EXAMPLES.md`](./src/components/base/EXAMPLES.md) | Usage examples |
| [`../AGENTS.md`](../AGENTS.md), [`../docs/INDEX.md`](../docs/INDEX.md) | Project-wide rules and business docs |

---

## Tech Stack

- **Expo SDK 57**, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3
- **Expo Router 57** — file-based routing, typed routes
- **NativeWind 5 (preview)** + **Tailwind CSS v4** — config lives in `src/global.css` (no `tailwind.config.js`)
- **Onest** font (`@expo-google-fonts/onest`), `lucide-react-native` icons
- **React Query** + **Axios** — data fetching, JWT with refresh
- **React Hook Form** + **Zod** — forms
- **i18next** — Russian, Uzbek, English
- **@expo/ui** — native bottom sheets

---

## Project Structure

```
assets/            # brand/ (STHM SVG logos), i18next/, images/ (icons, splash)
src/
├── api/           # axios-instance.ts
├── app/           # Expo Router routes
├── screens/       # Screen implementations
├── components/    # base/ (primitives), common/, product/, order/, cashbox/
├── constants/     # tokens.ts (STHM palette), theme.ts
├── global.css     # Tailwind v4 theme: STHM tokens, radius, fonts, type-* styles
├── hooks/ icons/ libs/ models/ provider/ services/
```

---

## Commands

```bash
npx tsc --noEmit                      # Type-check
npx expo export --platform android    # Bundle check (CSS/imports)
npx expo start --clear                # Clear NativeWind/Metro cache
npx expo prebuild --clean             # Regenerate native projects (after app.json icon/splash changes)
```

No test runner or ESLint config is set up yet.

---

## Related Projects

- Backend API: [`../billing/`](../billing/) — NestJS + Prisma + PostgreSQL
- Web: [`../billing_ui/`](../billing_ui/) — Angular + PrimeNG

---

**Last updated:** 2026-10-19 · **Expo SDK:** 57
