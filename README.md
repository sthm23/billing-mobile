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

**Component Documentation**:
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — Design system & base components
- [`src/components/base/EXAMPLES.md`](./src/components/base/EXAMPLES.md) — Component usage examples

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
│   └── axios-instance.ts      # Auth interceptors, token refresh
├── app/                       # Expo Router screens (file-based routing)
│   ├── _layout.tsx            # Root layout with providers
│   ├── login.tsx              # Login screen (public)
│   ├── component-demo.tsx     # Component showcase (dev only)
│   └── (tabs)/                # Main authenticated app
│       ├── (products)/        # Product management
│       ├── (orders)/          # Order creation/viewing
│       ├── (search)/          # Search & barcode scan
│       ├── (payments)/        # Payment/cashbox
│       └── (profile)/         # User settings
├── assets/                    # Static assets
│   └── i18next/               # Translation files (en, ru, uz)
├── components/
│   ├── base/                  # 🆕 Base UI components (17)
│   │   ├── Box.tsx            # Layout container
│   │   ├── Button.tsx         # Button with variants
│   │   ├── Input.tsx          # Text input
│   │   ├── Modal.tsx          # Modal overlay
│   │   ├── (removed)          # BottomSheet: use @expo/ui directly
│   │   └── ...                # + 12 more components
│   ├── common/                # Common utility components
│   ├── order/                 # Order-specific components
│   ├── product/               # Product-specific components
│   └── cashbox/               # Cashbox-specific components
├── constants/                 # App constants (theme, colors)
├── hooks/                     # Custom React hooks
├── models/                    # TypeScript interfaces
├── provider/                  # React Context providers
│   ├── AuthProvider.tsx       # Authentication context
│   └── ThemeControlContext.tsx # Theme management
├── services/                  # API service layer
│   ├── order/                 # Order API services
│   ├── product/               # Product API services
│   └── payment/               # Payment API services
└── global.css                 # Global styles & theme tokens
```

---

## 🎨 UI Components

### Base Components (17)

Custom components built on React Native + NativeWind.

**Layout (5):** Box, VStack, HStack, Center, Divider  
**Typography (2):** Text, Heading  
**Interactive (2):** Button, Pressable  
**Forms (2):** Input, TextArea  
**Feedback (3):** Card, Spinner, Divider  
**Overlays (2):** Modal, BottomSheet

**Documentation**: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)  
**Examples**: [`src/components/base/EXAMPLES.md`](./src/components/base/EXAMPLES.md)  
**Demo**: `/component-demo` screen in app

### Usage

```tsx
import { Box, Button, Input, Text, VStack } from '@/components/base';

<VStack gap={4} className="p-6">
  <Text className="text-2xl font-bold">Login</Text>
  <Input placeholder="Email" />
  <Button>Sign In</Button>
</VStack>
```

### Design System

- **Semantic colors** — Automatic dark mode support
- **Tailwind spacing** — Consistent spacing scale (gap, padding, margin)
- **TypeScript** — Full type safety
- **Accessibility** — ARIA labels and roles
- **Variants** — Multiple styles per component (default, outline, ghost, etc.)

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

**Features**:
- JWT token management
- Automatic token refresh
- Request/response interceptors
- Error handling

---

## 📦 Tech Stack

### Core
- **Expo SDK** 56 — Managed React Native platform
- **React Native** 0.86.3 — Cross-platform mobile framework
- **React** 19.2.3 — UI library
- **TypeScript** 6.0.3 — Type safety

### Navigation & Routing
- **Expo Router** v56 — File-based routing with typed routes
- **React Navigation** — Native navigation (via Expo Router)

### Styling
- **NativeWind** v5 — Tailwind CSS for React Native
- **Tailwind CSS** v4 — Utility-first CSS framework
- **Custom Base Components** — 17 semantic components

### Data & State
- **React Query** (@tanstack/react-query) — Data fetching & caching
- **Axios** 1.18.1 — HTTP client
- **AsyncStorage** — Local storage
- **Context API** — Global state (Auth, Theme)

### Forms & Validation
- **React Hook Form** 7.81.0 — Form management
- **Zod** 4.4.3 — Schema validation

### UI & Interaction
- **@expo/ui** 57.0.20 — Native bottom sheets
- **react-native-gesture-handler** — Touch gestures
- **react-native-reanimated** — Smooth animations
- **expo-image** — Optimized image component
- **lucide-react-native** — Icon library

### Internationalization
- **i18next** 26.3.4 — i18n framework
- **react-i18next** 17.0.8 — React bindings
- **Languages**: English, Russian, Uzbek

### Native Features
- **expo-camera** — Barcode/QR scanning
- **expo-notifications** — Push notifications
- **expo-linking** — Deep linking

---

## 🎨 Key Features

- ✅ **Custom UI Components** — 17 base components, no external UI library
- ✅ **File-based Routing** — Expo Router v56 with typed routes
- ✅ **NativeWind Styling** — Tailwind CSS with dark mode
- ✅ **Dual Theme** — Automatic light/dark mode with semantic colors
- ✅ **i18n** — English, Russian, Uzbek with i18next
- ✅ **Barcode Scanning** — Expo Camera integration
- ✅ **JWT Auth** — Automatic token refresh & interceptors
- ✅ **Type Safety** — Full TypeScript coverage
- ✅ **Design System** — Consistent spacing, colors, typography
- ✅ **Accessibility** — ARIA labels, roles, and states
- ✅ **Offline-ready** — AsyncStorage for local data
- ✅ **Pull-to-refresh** — Native refresh controls
- ✅ **Bottom Sheets** — @expo/ui for native UX

---

## 🎯 Architecture Highlights

### Component Philosophy

**Native First**: All base components wrap React Native primitives (View, Text, Pressable, TextInput) with:
- Semantic color system
- Consistent spacing
- TypeScript types
- Accessibility props
- Dark mode support

**No External UI Library**: Previously used GlueStack UI (alpha). Migrated to custom components for:
- Full control over implementation
- Smaller bundle size (~600KB saved)
- Simpler API (no nested wrappers)
- Better maintenance

### Data Flow

```
User Action
    ↓
React Component
    ↓
Service Layer (src/services/)
    ↓
Axios Instance (with interceptors)
    ↓
Backend API (billing/)
    ↓
React Query Cache
    ↓
UI Update
```

### Authentication

- JWT tokens stored in AsyncStorage
- Refresh tokens in httpOnly cookies (backend)
- Automatic token refresh on 401
- Auth guard in Expo Router layout

---

## 🐛 Troubleshooting

### Cannot find module 'expo-camera'

**Cause**: Native module not prebuilt

**Solution**:
```bash
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### Navigation type errors

**Cause**: Expo Router types not regenerated

**Solution**:
```bash
rm -rf .expo
npx expo start
```

### Styling not working

**Cause**: NativeWind cache issue

**Solution**:
```bash
npx expo start --clear
```

### Component not found (@/components/base)

**Cause**: Path alias not resolved

**Solution**: Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Dark mode colors not working

**Cause**: Missing semantic color classes

**Solution**: Use semantic colors from `global.css`:
- `text-foreground` not `text-black`
- `bg-background` not `bg-white`
- `border-border` not `border-gray-300`

---

## 🔗 Related Projects

- **Backend API**: [`../billing/`](../billing/) — NestJS + Prisma + PostgreSQL
- **Web Frontend**: [`../billing_ui/`](../billing_ui/) — Angular 21 + PrimeNG

---

## 📖 Learn More

**Expo & React Native**:
- [Expo Documentation (v56)](https://docs.expo.dev/versions/v56.0.0/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

**Styling**:
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

**Libraries**:
- [React Query (TanStack Query)](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)

---

## 📄 License

MIT

---

**Last updated:** 2026-09-30  
**Version:** 1.0.0  
**Expo SDK:** 56
