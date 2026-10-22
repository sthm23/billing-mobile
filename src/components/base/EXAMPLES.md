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
      <Button variant="danger" onPress={handleDelete}>
        Delete
      </Button>
    </HStack>
  </VStack>
</Modal>
```

---

## Sheet

Use the base `Sheet` (`@gorhom/bottom-sheet`) — see `AGENTS.md` → Sheet. `@expo/ui` `BottomSheet` shows empty on Android.

```tsx
import { Sheet, SheetScrollView, SheetTextInput } from '@/components/base/Sheet';

const [open, setOpen] = useState(false);

<Sheet isOpen={open} onClose={() => setOpen(false)}>
  <SheetScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-8 gap-4">
    <SheetTextInput className="h-[52px] px-4 rounded-md bg-sunken" />
  </SheetScrollView>
</Sheet>
```

## Notes

### Modal
- Uses React Native's Modal component under the hood
- Automatically handles backdrop press to close (configurable)
- Supports light/dark theme with semantic colors
- Default animation: fade
- Content is centered with max-width for better UX on tablets

### Sheet
- Base `Sheet` on `@gorhom/bottom-sheet`, controlled by `isOpen` / `onClose`
- Backdrop tap, swipe down and back button close it
- `size`: `'full'` (default) / `'half'` — children fill it (`flex-1`); `'auto'` — fits content (no `flex-1`)
- Scroll and inputs inside: `SheetScrollView`, `SheetFlatList`, `SheetTextInput`
- Don't use `@expo/ui` `BottomSheet` — empty on Android

### When to Use Which

**Use Modal when:**
- Showing important alerts/confirmations
- Displaying centered dialogs
- Content should be in the middle of screen
- Blocking user interaction with rest of app

**Use Sheet when:**
- Showing lists or scrollable content
- Native mobile feel (slides from bottom)
- Multiple snap points needed
- User should be able to drag to dismiss
- Filter panels, search sheets, option pickers
