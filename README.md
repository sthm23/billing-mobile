# Billing Mobile — Expo + React Native

Mobile application for **my-billing** retail POS system.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Or run directly on platform
npm run android         # Android emulator
npm run ios             # iOS simulator
npm run web             # Web browser
```

---

## ⚠️ CRITICAL: Expo SDK Version

**This project uses Expo SDK 56**

Always use versioned documentation:
👉 https://docs.expo.dev/versions/v56.0.0/

**Do NOT use**:
- ❌ Unversioned docs
- ❌ Patterns from other Expo versions (v54, v55)
- ❌ Latest docs (may be for v57+)

---

## 📚 Documentation

### For AI / Developers

**Start here**: [`AGENTS.md`](./AGENTS.md) — Mobile development guide

**Root documentation**:
- [`../AGENTS.md`](../AGENTS.md) — Project overview
- [`../docs/INDEX.md`](../docs/INDEX.md) — Documentation index
- [`../docs/business-domain.md`](../docs/business-domain.md) — Business concepts
- [`../docs/api-map.md`](../docs/api-map.md) — API endpoints
- [`../docs/workflows/`](../docs/workflows/) — Business workflows

---

## 🛠️ Development Commands

```bash
# Development
npm start                      # Start Expo dev server
npm run android                # Run on Android emulator
npm run ios                    # Run on iOS simulator
npm run web                    # Run in web browser

# Project Management
npx expo install <package>     # Install Expo-compatible package
npx expo prebuild              # Generate native projects (iOS/Android)
npx expo prebuild --clean      # Clean prebuild

# Code Quality
npm run lint                   # ESLint check
```

---

## 🏗️ Project Structure

```
src/
├── api/                       # Axios configuration
│   └── axios-instance.ts      # Auth interceptors
├── app/                       # Expo Router screens (file-based routing)
│   ├── _layout.tsx            # Root layout
│   ├── login.tsx              # Login screen
│   └── (tabs)/                # Main authenticated app
│       ├── (products)/        # Product management
│       ├── (orders)/          # Order creation/viewing
│       ├── (search)/          # Search & barcode scan
│       ├── (payments)/        # Payment/cashbox
│       └── (profile)/         # User settings
├── assets/                    # Static assets
│   └── i18next/               # Translation files (en, ru, uz)
├── components/                # Reusable UI components
│   └── ui/                    # Base UI (button, input, etc.)
├── constants/                 # App constants (theme, colors)
├── hooks/                     # Custom React hooks
├── models/                    # TypeScript interfaces
├── provider/                  # React Context providers
└── services/                  # API service layer
```

---

## 🔑 API Configuration

Edit `src/api/axios-instance.ts`:

```typescript
const BASE_URL = Platform.select({
  ios: 'https://sthm23.uz/api',
  android: 'https://sthm23.uz/api',
  default: 'https://sthm23.uz/api',
});
```

---

## 📦 Tech Stack

- **Expo SDK** 56 — Managed React Native
- **React Native** 0.85.3 — Mobile framework
- **React** 19.2.3 — UI library
- **Expo Router** v56 — File-based routing
- **NativeWind** v4 — Tailwind CSS for RN
- **React Query** — Data fetching
- **React Hook Form** — Form validation
- **i18next** — i18n (en, ru, uz)
- **Axios** — HTTP client

---

## 🎨 Key Features

- ✅ **File-based Routing** — Expo Router v56
- ✅ **NativeWind** — Tailwind CSS styling
- ✅ **Dual Theme** — Light/dark mode
- ✅ **i18n** — English, Russian, Uzbek
- ✅ **Barcode Scanning** — Expo Camera
- ✅ **JWT Auth** — Auto token refresh
- ✅ **Native UI** — @expo/ui components

---

## 🐛 Troubleshooting

### Cannot find module 'expo-camera'

```bash
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### Navigation type errors

```bash
rm -rf .expo
npx expo start
```

### Styling not working

```bash
npx expo start --clear
```

---

## 🔗 Related Projects

- **Backend API**: [`../billing/`](../billing/)
- **Web Frontend**: [`../billing_ui/`](../billing_ui/)

---

## 📖 Learn More

- [Expo Documentation (v56)](https://docs.expo.dev/versions/v56.0.0/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [NativeWind Documentation](https://www.nativewind.dev/)

---

## 📄 License

MIT
