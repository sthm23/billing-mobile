

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/libs/utils'
import { AuthRequest } from '@/models/auth.model'
import { useAuth } from '@/provider/AuthProvider'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as z from 'zod'

const formSchema = z.object({
    login: z.string().min(1, 'Login is required'),
    password: z.string().min(1, 'Password is required'),
});

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
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<AuthRequest>({
        resolver: zodResolver(formSchema),
        defaultValues: { login: '', password: '' }
    });
      const getLoginErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return t('errors.networkUnavailable');
      }

      if (error.response.status === 401) {
        return t('errors.invalidCredentials');
      }

      const apiMessage = error.response.data?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }
    }

    return error instanceof Error ? error.message : t('errors.loginFailed');
  };

  const handleFormSubmit = async (data: AuthRequest) => {
    setSubmitError(null);
    setLoading(true);
    try {
      login(data);
    } catch (error) {
      const message = getLoginErrorMessage(error);
      setSubmitError(message);
      Alert.alert(t('errors.loginFailed'), message);
    } finally {
      setLoading(false);
    }
  };

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
                <Controller
                    control={control}
                    name="login"
                    render={({ field: { onChange, onBlur, value } }) => (
                    <Input  
                        className="w-full"
                        label={t('login.email')} 
                        placeholder="user@example.com" 
                        autoCapitalize="none" 
                        keyboardType="email-address"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        />
                        )}
                    />
                    {errors.login && <ThemedText className="text-error dark:text-error-dark">{errors.login.message}</ThemedText>}
                
            </View>

            {/* Password */}
            <View className={tokens.password}>
                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <Input 
                            className="w-full" 
                            label={t('login.password')} 
                            placeholder="********" 
                            secureTextEntry={true}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            />
                    )}
                  />
                  {errors.password && <ThemedText className="text-error dark:text-error-dark">{errors.password.message}</ThemedText>}
                
            </View>

            {/* Submit */}
            <View className={tokens.submit}>
                <Button 
                className={cn(tokens.submitBtn, loading ? "bg-gray-300" : "bg-primary")} 
                loading={loading}
                    onPress={handleSubmit(handleFormSubmit)}
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