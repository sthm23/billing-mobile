import { Box, Button, Card, Center, Heading, HStack, Input, Pressable, Text, VStack } from '@/components/base';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { AuthRequest } from '@/models/auth.model';
import { useAuth } from '@/provider/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

const formSchema = z.object({
    login: z.string().min(1, 'Login is required'),
    password: z.string().min(1, 'Password is required')
});

export function LoginPage() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleState = () => {
        setShowPassword((showState) => {
            return !showState;
        });
    };
    const {
        control,
        handleSubmit,
        formState: {
            errors
        }
    } = useForm<AuthRequest>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            login: '',
            password: ''
        }
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
            await login(data);
        } catch (error) {
            const message = getLoginErrorMessage(error);
            setSubmitError(message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <Center className="w-full h-full p-4">
            <Card className="w-full">
                <VStack gap={4}>
                    <Center>
                        <Heading level={1} className="text-foreground">{t('login.title')}</Heading>
                        <Heading level={2} className="text-foreground/60">{t('login.subTitle')}</Heading>
                    </Center>

                    {/* Login Field */}
                    <VStack gap={2}>
                        <Text variant="small" className="text-foreground/60">
                            {t('login.email')}
                        </Text>
                        <Controller
                            control={control}
                            name="login"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    error={!!errors.login}
                                    placeholder={t('login.email')}
                                />
                            )}
                        />
                        {errors.login && (
                            <HStack gap={2} className="items-center">
                                <AlertCircle size={16} color="#EF4444" />
                                <Text variant="small" className="text-destructive">
                                    {errors.login.message}
                                </Text>
                            </HStack>
                        )}
                    </VStack>

                    {/* Password Field */}
                    <VStack gap={2}>
                        <Text variant="small" className="text-foreground/60">
                            {t('login.password')}
                        </Text>
                        <Box className="relative">
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        secureTextEntry={!showPassword}
                                        value={value}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        error={!!errors.password}
                                        placeholder={t('login.password')}
                                        className="pr-12"
                                    />
                                )}
                            />
                            <Pressable
                                onPress={handleState}
                                className="absolute right-3 top-0 h-full justify-center"
                            >
                                {showPassword ? (
                                    <Eye size={20} color="#737373" />
                                ) : (
                                    <EyeOff size={20} color="#737373" />
                                )}
                            </Pressable>
                        </Box>
                        {errors.password && (
                            <HStack gap={2} className="items-center">
                                <AlertCircle size={16} color="#EF4444" />
                                <Text variant="small" className="text-destructive">
                                    {errors.password.message}
                                </Text>
                            </HStack>
                        )}
                    </VStack>

                    {/* Submit Error */}
                    {submitError && (
                        <HStack gap={2} className="items-center bg-destructive/10 p-3 rounded-lg">
                            <AlertCircle size={16} color="#EF4444" />
                            <Text variant="small" className="text-destructive flex-1">
                                {submitError}
                            </Text>
                        </HStack>
                    )}

                    {/* Submit Button */}
                    <VStack gap={2}>
                        <Button
                            size="md"
                            onPress={handleSubmit(handleFormSubmit)}
                            loading={loading}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Please wait...' : t('login.loginButton')}
                        </Button>

                        {/* Sign Up Link */}
                        <Center>
                            <HStack gap={1} className="items-center">
                                <Text>{t('login.signUptext')}</Text>
                                <Pressable>
                                    <Text className="font-bold text-primary">
                                        {t('login.signUp')}
                                    </Text>
                                </Pressable>
                            </HStack>
                        </Center>
                    </VStack>
                </VStack>
            </Card>
        </Center>
    )
}