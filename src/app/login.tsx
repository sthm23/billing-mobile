

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Button } from '@/components/ui/button'
import { Link } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function login() {
  const loading = false

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')

  const onSignInPress = () => {
    // Handle sign-in logic here
  }
  return (
    <ThemedView type='primary'>
        <SafeAreaView edges={['top']} className="flex-1 items-center justify-center">
          
                              {/* Header */}
                              <View className="items-center mb-8">
                                  <Text className="text-3xl font-bold text-primary mb-2">Welcome Back</Text>
                                  <Text className="text-secondary">Sign in to continue</Text>
                              </View>
          
                              {/* Email */}
                              <View className="mb-4">
                                  <Text className="text-primary font-medium mb-2">Email</Text>
                                  <TextInput className="w-full bg-surface p-4 rounded-xl text-primary" placeholder="user@example.com" placeholderTextColor="#999" autoCapitalize="none" keyboardType="email-address" value={emailAddress} onChangeText={setEmailAddress} />
                              </View>
          
                              {/* Password */}
                              <View className="mb-6">
                                  <Text className="text-primary font-medium mb-2">Password</Text>
                                  <TextInput className="w-full bg-surface p-4 rounded-xl text-primary" placeholder="********" placeholderTextColor="#999" secureTextEntry value={password} onChangeText={setPassword} />
                              </View>
          
                              {/* Submit */}

                              <Button className={`w-full py-4 rounded-full items-center mb-10 ${loading ? "bg-gray-300" : "bg-primary"}`} onPress={onSignInPress} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Sign In</Text>}</Button>
                              
          
                              {/* Footer */}
                              <View className="flex-row justify-center">
                                  <Text className="text-secondary">Don&apos;t have an account? </Text>
                                  <Link href="/#" className="text-primary font-bold">
                                      <Text className="text-primary font-bold">Sign up</Text>
                                  </Link>
                              </View>


            <ThemedText type='default'>login</ThemedText>
        </SafeAreaView>
    </ThemedView>
  )
}