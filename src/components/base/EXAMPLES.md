# Base Components Usage Examples

## Modal

### Basic Usage

```tsx
import { Modal, Button, Text, VStack } from '@/components/base';
import { useState } from 'react';

function MyScreen() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        <VStack className="gap-4">
          <Text className="text-xl font-bold">Modal Title</Text>
          <Text>This is the modal content.</Text>
          <Button onPress={() => setIsOpen(false)}>
            Close
          </Button>
        </VStack>
      </Modal>
    </>
  );
}
```

### With Close Button

```tsx
<Modal
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  showCloseButton
  className="p-8"
>
  <Text>Content with close button in top-right corner</Text>
</Modal>
```

### Confirmation Dialog

```tsx
<Modal visible={showConfirm} onClose={() => setShowConfirm(false)}>
  <VStack className="gap-4">
    <Heading>Confirm Delete</Heading>
    <Text className="text-muted-foreground">
      Are you sure you want to delete this item?
    </Text>
    <HStack className="gap-3 justify-end">
      <Button variant="ghost" onPress={() => setShowConfirm(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onPress={handleDelete}>
        Delete
      </Button>
    </HStack>
  </VStack>
</Modal>
```

---

## BottomSheet

**Official `@expo/ui` BottomSheet with controlled pattern.**

### Basic Usage

```tsx
import { BottomSheet } from '@expo/ui';
import { Box, Button, Text } from '@/components/base';
import { useState } from 'react';
import { ScrollView } from 'react-native';

function MyScreen() {
  const [isPresented, setIsPresented] = useState(false);
  
  return (
    <>
      <Button onPress={() => setIsPresented(true)}>
        Open Sheet
      </Button>

      <BottomSheet
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
        snapPoints={['half', 'full']}
      >
        <ScrollView style={{ flex: 1 }}>
          <Box className="p-4">
            <Text className="text-xl font-bold mb-4">Bottom Sheet Title</Text>
            <Text>Bottom sheet content goes here.</Text>
          </Box>
        </ScrollView>
      </BottomSheet>
    </>
  );
}
```

### With Custom Snap Points (fraction/height)

```tsx
<BottomSheet
  isPresented={isPresented}
  onDismiss={() => setIsPresented(false)}
  snapPoints={[
    { fraction: 0.4 },
    { fraction: 0.6 },
    { fraction: 0.9 }
  ]}
>
  <ScrollView style={{ flex: 1 }}>
    <Box className="p-4">
      <Text>Scrollable content</Text>
    </Box>
  </ScrollView>
</BottomSheet>
```

### Without Drag Indicator

```tsx
<BottomSheet
  isPresented={isPresented}
  onDismiss={() => setIsPresented(false)}
  snapPoints={[{ fraction: 0.3 }]}
  showDragIndicator={false}
>
  <ScrollView style={{ flex: 1 }}>
    <Box className="p-4">
      <Text>Bottom sheet without drag indicator</Text>
    </Box>
  </ScrollView>
</BottomSheet>
```

### Product Search Example (Real Usage)

```tsx
import { BottomSheet } from '@expo/ui';
import { Box, Button, Input } from '@/components/base';
import { useState } from 'react';
import { FlatList, ScrollView } from 'react-native';

function ProductSearchExample() {
  const [isPresented, setIsPresented] = useState(false);
  const [products, setProducts] = useState([]);

  return (
    <>
      <Button onPress={() => setIsPresented(true)}>
        Search Products
      </Button>

      <BottomSheet
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
        snapPoints={[{ fraction: 0.6 }, { fraction: 0.9 }]}
      >
        <ScrollView style={{ flex: 1 }}>
          <Box className="p-4">
            <Input placeholder="Search..." className="mb-4" />
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Box className="p-3 border-b border-border">
                  <Text>{item.name}</Text>
                </Box>
              )}
            />
          </Box>
        </ScrollView>
      </BottomSheet>
    </>
  );
}
```

### With forwardRef (Imperative Control)

```tsx
import { BottomSheet } from '@expo/ui';
import { forwardRef, useImperativeHandle, useState } from 'react';

interface SheetRef {
  open: () => void;
  close: () => void;
}

export const MySheet = forwardRef<SheetRef, { children: React.ReactNode }>(
  function MySheet({ children }, ref) {
    const [isPresented, setIsPresented] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsPresented(true),
      close: () => setIsPresented(false),
    }));

    return (
      <BottomSheet
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
        snapPoints={[{ fraction: 0.7 }]}
      >
        <ScrollView style={{ flex: 1 }}>
          {children}
        </ScrollView>
      </BottomSheet>
    );
  }
);

// Usage
function ParentComponent() {
  const sheetRef = useRef<SheetRef>(null);
  
  return (
    <>
      <Button onPress={() => sheetRef.current?.open()}>Open</Button>
      <MySheet ref={sheetRef}>
        <Text>Content</Text>
      </MySheet>
    </>
  );
}
```

---

## Notes

### Modal
- Uses React Native's Modal component under the hood
- Automatically handles backdrop press to close (configurable)
- Supports light/dark theme with semantic colors
- Default animation: fade
- Content is centered with max-width for better UX on tablets

### BottomSheet
- Uses official `@expo/ui` BottomSheet with **controlled pattern**
- Visibility managed via `isPresented` prop (boolean state)
- Dismissal handled through `onDismiss` callback
- Automatically adapts to light/dark theme
- Default backdrop (dismissible by tapping)
- Supports swipe-down to dismiss gesture
- Drag indicator included by default (`showDragIndicator={true}`)
- Always wrap content in `<ScrollView>` for proper overflow handling
- Snap points: `'half'`, `'full'`, `{ fraction: 0.6 }`, or `{ height: 400 }`
- Versioned docs: https://docs.expo.dev/versions/v56.0.0/sdk/ui/universal/bottomsheet/

### When to Use Which

**Use Modal when:**
- Showing important alerts/confirmations
- Displaying centered dialogs
- Content should be in the middle of screen
- Blocking user interaction with rest of app

**Use BottomSheet when:**
- Showing lists or scrollable content
- Native mobile feel (slides from bottom)
- Multiple snap points needed
- User should be able to drag to dismiss
- Filter panels, search sheets, option pickers
