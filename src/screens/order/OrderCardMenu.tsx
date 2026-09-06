
import { Pressable } from '@/components/ui/pressable';
import {useState} from 'react';
import {Menu, MenuItem, MenuItemLabel} from '@/components/ui/menu';
import {Text } from '@/components/ui/text';

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
        <Menu
            isOpen={isMenuOpen}
            onClose={handleClose}            
            trigger={(triggerProps) => {
                return (
                <Pressable
                    {...triggerProps}
                    onLongPress={handleLongPress}
                    delayLongPress={500} /* Time in ms to trigger long press */
                    p="$4"
                    bg="$primary500"
                    rounded="$md"
                    states={{
                    hover: true,
                    active: true
                    }}
                >
                    <Text>
                    Hold Me for Context Menu
                    </Text>
                </Pressable>
                );
            }}
            >
            
            <MenuItem key="edit" textValue="Edit" onPress={() => handleAction('Edit')}>
                <MenuItemLabel>Edit Item</MenuItemLabel>
            </MenuItem>
            <MenuItem key="share" textValue="Share" onPress={() => handleAction('Share')}>
                <MenuItemLabel>Share Item</MenuItemLabel>
            </MenuItem>
            <MenuItem key="delete" textValue="Delete" onPress={() => handleAction('Delete')}>
                <MenuItemLabel>
                Delete Item
                </MenuItemLabel>
            </MenuItem>
        </Menu>
    )
}