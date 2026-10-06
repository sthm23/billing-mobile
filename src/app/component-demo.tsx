import {
  Box,
  Button,
  Card,
  Center,
  Divider,
  Heading,
  HStack,
  Input,
  Modal,
  Pressable,
  Spinner,
  Text,
  TextArea,
  VStack,
} from '@/components/base';
import { BottomSheet } from '@expo/ui';
import { useState } from 'react';
import { ScrollView } from 'react-native';

/**
 * Component Demo Screen — демонстрация всех базовых компонентов
 *
 * Используйте этот экран для тестирования компонентов и проверки
 * консистентности дизайна в light/dark режимах.
 *
 * Доступ: /component-demo
 */
export default function ComponentDemoScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenBottomSheet = () => {
    setBottomSheetVisible(true);
  };

  const handleToggleLoading = () => {
    setLoading((prev) => !prev);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <VStack className="p-6" gap={6}>
        {/* Header */}
        <VStack gap={2}>
          <Heading level={1}>Component Demo</Heading>
          <Text variant="muted">
            Демонстрация всех базовых компонентов без GlueStack UI
          </Text>
        </VStack>

        <Divider />

        {/* Typography Section */}
        <VStack gap={3}>
          <Heading level={2}>Typography</Heading>
          <Card>
            <VStack gap={2}>
              <Heading level={1}>Heading Level 1</Heading>
              <Heading level={2}>Heading Level 2</Heading>
              <Heading level={3}>Heading Level 3</Heading>
              <Heading level={4}>Heading Level 4</Heading>
              <Divider />
              <Text variant="default">Default text</Text>
              <Text variant="muted">Muted text</Text>
              <Text variant="small">Small text</Text>
              <Text variant="large">Large text</Text>
              <Text variant="bold">Bold text</Text>
            </VStack>
          </Card>
        </VStack>

        <Divider />

        {/* Buttons Section */}
        <VStack gap={3}>
          <Heading level={2}>Buttons</Heading>
          <Card>
            <VStack gap={3}>
              <Button variant="default">Default Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive Button</Button>

              <Divider />
              <Text variant="bold">Sizes:</Text>
              <HStack gap={2}>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </HStack>

              <Divider />
              <Text variant="bold">States:</Text>
              <Button loading={loading} onPress={handleToggleLoading}>
                {loading ? 'Loading...' : 'Toggle Loading'}
              </Button>
              <Button disabled>Disabled Button</Button>
            </VStack>
          </Card>
        </VStack>

        <Divider />

        {/* Forms Section */}
        <VStack gap={3}>
          <Heading level={2}>Form Inputs</Heading>
          <Card>
            <VStack gap={3}>
              <VStack gap={1}>
                <Text variant="bold">Input (default)</Text>
                <Input
                  placeholder="Enter text..."
                  value={inputValue}
                  onChangeText={setInputValue}
                />
              </VStack>

              <VStack gap={1}>
                <Text variant="bold">Input (small)</Text>
                <Input
                  size="sm"
                  placeholder="Small input"
                  value=""
                  onChangeText={() => { }}
                />
              </VStack>

              <VStack gap={1}>
                <Text variant="bold">Input (large)</Text>
                <Input
                  size="lg"
                  placeholder="Large input"
                  value=""
                  onChangeText={() => { }}
                />
              </VStack>

              <VStack gap={1}>
                <Text variant="bold">Input (error)</Text>
                <Input
                  error
                  placeholder="Error state"
                  value=""
                  onChangeText={() => { }}
                />
              </VStack>

              <VStack gap={1}>
                <Text variant="bold">Input (disabled)</Text>
                <Input editable={false} placeholder="Disabled input" value="" />
              </VStack>

              <Divider />

              <VStack gap={1}>
                <Text variant="bold">TextArea</Text>
                <TextArea
                  placeholder="Enter multiple lines..."
                  value={textAreaValue}
                  onChangeText={setTextAreaValue}
                  rows={4}
                />
              </VStack>
            </VStack>
          </Card>
        </VStack>

        <Divider />

        {/* Cards Section */}
        <VStack gap={3}>
          <Heading level={2}>Cards</Heading>
          <Card variant="default">
            <Text variant="bold">Default Card</Text>
            <Text variant="muted">With shadow-sm</Text>
          </Card>
          <Card variant="elevated">
            <Text variant="bold">Elevated Card</Text>
            <Text variant="muted">With shadow-md</Text>
          </Card>
        </VStack>

        <Divider />

        {/* Pressable Section */}
        <VStack gap={3}>
          <Heading level={2}>Pressable</Heading>
          <Pressable
            onPress={() => alert('Pressable clicked!')}
            className="bg-card rounded-xl p-4 border border-border active:bg-accent"
          >
            <Text variant="bold">Tap me!</Text>
            <Text variant="muted">I'm a clickable card</Text>
          </Pressable>
        </VStack>

        <Divider />

        {/* Layout Section */}
        <VStack gap={3}>
          <Heading level={2}>Layout Components</Heading>
          <Card>
            <VStack gap={3}>
              <VStack gap={1}>
                <Text variant="bold">HStack (gap=2)</Text>
                <HStack gap={2}>
                  <Box className="bg-primary p-3 rounded-lg flex-1">
                    <Text className="text-primary-foreground text-center">1</Text>
                  </Box>
                  <Box className="bg-primary p-3 rounded-lg flex-1">
                    <Text className="text-primary-foreground text-center">2</Text>
                  </Box>
                  <Box className="bg-primary p-3 rounded-lg flex-1">
                    <Text className="text-primary-foreground text-center">3</Text>
                  </Box>
                </HStack>
              </VStack>

              <Divider />

              <VStack gap={1}>
                <Text variant="bold">VStack (gap=2)</Text>
                <VStack gap={2}>
                  <Box className="bg-secondary p-3 rounded-lg">
                    <Text className="text-center">Item 1</Text>
                  </Box>
                  <Box className="bg-secondary p-3 rounded-lg">
                    <Text className="text-center">Item 2</Text>
                  </Box>
                  <Box className="bg-secondary p-3 rounded-lg">
                    <Text className="text-center">Item 3</Text>
                  </Box>
                </VStack>
              </VStack>

              <Divider />

              <VStack gap={1}>
                <Text variant="bold">Center</Text>
                <Center className="bg-accent h-24 rounded-lg">
                  <Text>Centered Content</Text>
                </Center>
              </VStack>
            </VStack>
          </Card>
        </VStack>

        <Divider />

        {/* Spinner Section */}
        <VStack gap={3}>
          <Heading level={2}>Spinner</Heading>
          <Card>
            <VStack gap={3}>
              <HStack className="justify-around">
                <VStack gap={1} className="items-center">
                  <Spinner size="sm" />
                  <Text variant="small">Small</Text>
                </VStack>
                <VStack gap={1} className="items-center">
                  <Spinner size="md" />
                  <Text variant="small">Medium</Text>
                </VStack>
                <VStack gap={1} className="items-center">
                  <Spinner size="lg" />
                  <Text variant="small">Large</Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>
        </VStack>

        <Divider />

        {/* Overlays Section */}
        <VStack gap={3}>
          <Heading level={2}>Overlays</Heading>
          <Card>
            <VStack gap={2}>
              <Button onPress={() => setModalVisible(true)}>Open Modal</Button>
              <Button variant="outline" onPress={handleOpenBottomSheet}>
                Open Bottom Sheet
              </Button>
            </VStack>
          </Card>
        </VStack>

        {/* Spacing at bottom */}
        <Box className="h-12" />
      </VStack>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        showCloseButton
      >
        <VStack gap={3}>
          <Heading level={3}>Modal Title</Heading>
          <Text>This is modal content. It uses semantic colors and adapts to light/dark mode.</Text>
          <Divider />
          <Button onPress={() => setModalVisible(false)}>Close Modal</Button>
        </VStack>
      </Modal>

      {/* Bottom Sheet */}
      <BottomSheet
        isPresented={bottomSheetVisible}
        onDismiss={() => setBottomSheetVisible(false)}
        snapPoints={[{ fraction: 0.5 }, { fraction: 0.8 }]}
      >
        <ScrollView style={{ flex: 1 }}>
          <Box className="p-4">
            <VStack gap={3}>
              <Heading level={3}>Bottom Sheet</Heading>
              <Text>This is bottom sheet content</Text>
              <Divider />
              <Input placeholder="Try typing in bottom sheet..." />
              <Button onPress={() => setBottomSheetVisible(false)}>
                Close Bottom Sheet
              </Button>
            </VStack>
          </Box>
        </ScrollView>
      </BottomSheet>
    </ScrollView>
  );
}
