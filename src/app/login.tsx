

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/libs/utils'
import { useAuth } from '@/provider/AuthProvider'
import { Link } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const tokens = {
    container: 'h-full w-full flex items-center justify-center px-4',
    wrapper: 'w-full bg-background dark:bg-background-dark px-4 py-8 rounded-lg h-content border border-border dark:border-border-dark',
    header: 'items-center mb-8 mt-0',
    title: 'text-3xl font-bold text-primary mb-2',
    email: 'mb-4 w-full',
    password: 'mb-6 w-full',
    submit: 'w-full mb-4',
    submitBtn: 'w-full mb-4',
    footer: 'flex-row justify-center',
}

export default function login() {
    const { t } = useTranslation();
    const {login} = useAuth();
  const loading = false


  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')

  const onSignInPress = () => {
    // Handle sign-in logic here
    login();
  }
  return (
    <ThemedView type='surface' className={tokens.container}>
        <SafeAreaView edges={['top']} className={tokens.container}>
            <ThemedView type='background' className={tokens.wrapper} >
            {/* Header */}
            <View className={tokens.header}>
                <ThemedText type='title' >{t('login.title')}</ThemedText>
                <ThemedText type='subtitle' themeColor="secondaryText">{t('login.subTitle')}</ThemedText>
            </View>

            {/* Email */}
            <View className={tokens.email}>
                <Input  
                className="w-full"
                label={t('login.email')} 
                placeholder="user@example.com" 
                autoCapitalize="none" 
                keyboardType="email-address" 
                value={emailAddress} 
                onChangeText={setEmailAddress} 
                />
            </View>

            {/* Password */}
            <View className={tokens.password}>
                <Input 
                className="w-full" 
                label={t('login.password')} 
                placeholder="********" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword}
                 />
            </View>

            {/* Submit */}
            <View className={tokens.submit}>
                <Button 
                className={cn(tokens.submitBtn, loading ? "bg-gray-300" : "bg-primary")} 
                onPress={onSignInPress} 
                disabled={loading}>
                    {loading ? <ActivityIndicator className='text-background' /> : t('login.loginButton')}
                </Button>
            </View>

            {/* Footer */}
            <View className={tokens.footer}>
                <ThemedText type='small'>{t('login.signUptext')} </ThemedText>
                <Link href="/#" className="ml-1">
                    <ThemedText type='small' className="font-bold">{t('login.signUp')}</ThemedText>
                </Link>
            </View>
            </ThemedView>
        </SafeAreaView>
    </ThemedView>
  )
}