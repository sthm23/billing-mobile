import { Modal, Pressable, Text, VStack } from '@/components/base';
import { useState } from 'react';
import { Edit, Share2, Trash2 } from 'lucide-react-native';

export const OrderCardMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLongPress = () => {
    setIsMenuOpen(true);
  };

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  const handleAction = (actionName: string) => {
    console.log(`${actionName} selected`);
    setIsMenuOpen(false);
  };

  return (
    <>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        className="rounded-xl bg-primary p-4"
      >
        <Text className="text-white">Hold Me for Context Menu</Text>
      </Pressable>

      <Modal visible={isMenuOpen} onClose={handleClose} title="Actions">
        <VStack gap={2}>
          <Pressable
            className="flex-row items-center gap-3 rounded-lg p-4 active:bg-muted"
            onPress={() => handleAction('Edit')}
          >
            <Edit size={20} className="text-foreground" />
            <Text className="text-base text-foreground">Edit Item</Text>
          </Pressable>

          <Pressable
            className="flex-row items-center gap-3 rounded-lg p-4 active:bg-muted"
            onPress={() => handleAction('Share')}
          >
            <Share2 size={20} className="text-foreground" />
            <Text className="text-base text-foreground">Share Item</Text>
          </Pressable>

          <Pressable
            className="flex-row items-center gap-3 rounded-lg p-4 active:bg-muted"
            onPress={() => handleAction('Delete')}
          >
            <Trash2 size={20} className="text-destructive" />
            <Text className="text-base text-destructive">Delete Item</Text>
          </Pressable>
        </VStack>
      </Modal>
    </>
  );
};