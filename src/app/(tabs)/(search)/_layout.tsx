import { Stack } from 'expo-router';
import React from 'react';

export default function ScannerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" redirect options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
    </Stack>
    );
}
