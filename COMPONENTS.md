# Base Components — Quick Reference

> **17 custom components** built on React Native + NativeWind

For full documentation, see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## 📦 Import

```tsx
import { Box, Button, Input, Text, VStack } from '@/components/base';
```

---

## 🎨 Component List

### Layout (5)

**Box** — Basic container
```tsx
<Box className="p-4 bg-card rounded-xl">...</Box>
```

**VStack** — Vertical stack
```tsx
<VStack gap={4}>...</VStack>
```

**HStack** — Horizontal stack
```tsx
<HStack gap={3}>...</HStack>
```

**Center** — Centering container
```tsx
<Center className="flex-1">...</Center>
```

**Divider** — Separator line
```tsx
<Divider orientation="horizontal" />
```

---

### Typography (2)

**Text** — Text with variants
```tsx
<Text variant="default">Regular text</Text>
<Text variant="muted">Secondary text</Text>
<Text variant="bold">Bold text</Text>
```

**Heading** — Headings (level 1-4)
```tsx
<Heading level={1}>Main Title</Heading>
<Heading level={2}>Section Title</Heading>
```

---

### Interactive (2)

**Button** — Button with variants
```tsx
<Button variant="default" size="md">Click Me</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button loading={isLoading}>Submit</Button>
```

**Pressable** — Touchable area
```tsx
<Pressable onPress={handlePress}>...</Pressable>
```

---

### Forms (2)

**Input** — Text input
```tsx
<Input 
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
  size="md"
  error={!!errors.email}
/>
```

**TextArea** — Multi-line input
```tsx
<TextArea
  placeholder="Description"
  value={description}
  onChangeText={setDescription}
  rows={4}
/>
```

---

### Feedback (3)

**Card** — Card container
```tsx
<Card variant="default">...</Card>
<Card variant="elevated">...</Card>
```

**Spinner** — Loading indicator
```tsx
<Spinner size="md" />
```

**Divider** — Separator (also in Layout)
```tsx
<Divider />
```

---

### Overlays (2)

**Modal** — Modal overlay
```tsx
<Modal 
  visible={isOpen} 
  onClose={() => setIsOpen(false)}
  showCloseButton
>
  <Text>Modal content</Text>
</Modal>
```

**BottomSheet** — Official @expo/ui BottomSheet (controlled pattern)
```tsx
import { BottomSheet } from '@expo/ui';
import { useState } from 'react';

const [isPresented, setIsPresented] = useState(false);

<BottomSheet
  isPresented={isPresented}
  onDismiss={() => setIsPresented(false)}
  snapPoints={['half', 'full']}
>
  <Box className="flex-1 p-4">
    <Text>Sheet content</Text>
  </Box>
</BottomSheet>

// Open: setIsPresented(true)
// Close: setIsPresented(false)
// Note: Use 'half' and 'full' snap points for best compatibility
```

---

## 🎯 Common Patterns

### Form Layout

```tsx
<VStack gap={4} className="p-6">
  <Heading level={2}>Login</Heading>
  
  <VStack gap={2}>
    <Text variant="small">Email</Text>
    <Input placeholder="Enter email" />
  </VStack>
  
  <VStack gap={2}>
    <Text variant="small">Password</Text>
    <Input secureTextEntry placeholder="Enter password" />
  </VStack>
  
  <Button loading={isLoading}>Sign In</Button>
</VStack>
```

### Card with Content

```tsx
<Card className="p-4">
  <VStack gap={2}>
    <Heading level={3}>Product Name</Heading>
    <Text variant="muted">Description text</Text>
    <Divider />
    <HStack className="justify-between">
      <Text variant="bold">$99.99</Text>
      <Button size="sm">Add to Cart</Button>
    </HStack>
  </VStack>
</Card>
```

### List Item

```tsx
<Pressable 
  onPress={() => router.push(`/product/${id}`)}
  className="bg-card p-4 rounded-xl border border-border active:bg-accent"
>
  <HStack gap={3} className="items-center">
    <Box className="w-12 h-12 bg-primary rounded-lg" />
    <VStack gap={1} className="flex-1">
      <Text variant="bold">Item Name</Text>
      <Text variant="muted">Item description</Text>
    </VStack>
  </HStack>
</Pressable>
```

---

## 🎨 Design Tokens

### Colors (Semantic)

Use semantic colors for automatic dark mode:

```tsx
// Text
text-foreground           // Primary text
text-muted-foreground     // Secondary text

// Backgrounds
bg-background             // Main background
bg-card                   // Card background
bg-accent                 // Accent background
bg-primary                // Primary color
bg-destructive            // Error/delete color

// Borders
border-border             // Default border
border-input              // Input border
```

### Spacing (Tailwind Scale)

```tsx
gap={1}    // 4px
gap={2}    // 8px
gap={3}    // 12px
gap={4}    // 16px
gap={6}    // 24px
gap={8}    // 32px

// Same for p-{n} (padding), m-{n} (margin)
```

### Typography

```tsx
// Sizes
text-xs    // 12px
text-sm    // 14px
text-base  // 16px
text-lg    // 18px
text-xl    // 20px
text-2xl   // 24px

// Weights
font-normal     // 400
font-medium     // 500
font-semibold   // 600
font-bold       // 700
```

---

## 🚀 Tips

1. **Always use semantic colors** — `text-foreground` not `text-black`
2. **Use gap prop** — `<VStack gap={4}>` not `<VStack className="gap-4">`
3. **Combine className** — Use `cn()` from `@/libs/utils` to merge classes
4. **Check examples** — See `src/components/base/EXAMPLES.md`
5. **Demo screen** — Test components at `/component-demo`

---

## 📚 Full Documentation

- **Design System**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Component Examples**: [src/components/base/EXAMPLES.md](./src/components/base/EXAMPLES.md)
- **Project README**: [README.md](./README.md)
- **AI Development Guide**: [AGENTS.md](./AGENTS.md)

---

**Last Updated**: 2026-09-30
