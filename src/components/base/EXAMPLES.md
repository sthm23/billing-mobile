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

### Basic Usage

```tsx
import { BottomSheet, Button, Text } from '@/components/base';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef } from 'react';

function MyScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <Button onPress={() => bottomSheetRef.current?.present()}>
        Open Bottom Sheet
      </Button>

      <BottomSheet ref={bottomSheetRef} snapPoints={['50%', '90%']}>
        <Box className="p-4">
          <Text className="text-xl font-bold mb-4">Bottom Sheet Title</Text>
          <Text>Bottom sheet content goes here.</Text>
        </Box>
      </BottomSheet>
    </>
  );
}
```

### With Custom Snap Points

```tsx
<BottomSheet
  ref={bottomSheetRef}
  snapPoints={['40%', '60%', '90%']}
  enablePanDownToClose
>
  <ScrollView className="p-4">
    <Text>Scrollable content</Text>
  </ScrollView>
</BottomSheet>
```

### Without Backdrop

```tsx
<BottomSheet
  ref={bottomSheetRef}
  snapPoints={['30%']}
  showBackdrop={false}
>
  <Box className="p-4">
    <Text>Bottom sheet without backdrop</Text>
  </Box>
</BottomSheet>
```

### With Custom Backdrop Opacity

```tsx
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

<BottomSheet
  ref={bottomSheetRef}
  snapPoints={['70%']}
  renderBackdrop={(props) => (
    <BottomSheetBackdrop {...props} opacity={0.8} />
  )}
>
  <Box className="p-4">
    <Text>Content</Text>
  </Box>
</BottomSheet>
```

### Product Search Example (Real Usage)

```tsx
import { BottomSheet } from '@/components/base';
import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useRef } from 'react';

function ProductSearchExample() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [products, setProducts] = useState([]);

  return (
    <>
      <Button onPress={() => sheetRef.current?.present()}>
        Search Products
      </Button>

      <BottomSheet ref={sheetRef} snapPoints={['60%', '90%']}>
        <Box className="p-4">
          <Input placeholder="Search..." className="mb-4" />
          <BottomSheetFlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Box className="p-3 border-b border-border">
                <Text>{item.name}</Text>
              </Box>
            )}
          />
        </Box>
      </BottomSheet>
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
- Uses `@gorhom/bottom-sheet` (BottomSheetModal) for imperative control
- Requires `BottomSheetModalProvider` in app root (already configured)
- Automatically adapts to light/dark theme
- Default backdrop with 50% opacity
- Supports pan-down to close gesture
- Handle indicator included by default

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
