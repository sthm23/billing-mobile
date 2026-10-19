import {
    Button,
    FormControl,
    FormControlError,
    FormControlErrorText,
    FormControlLabel,
    FormControlLabelText,
    Input,
    InputField,
    Pressable,
    Text,
} from '@/components/base';
import { Logo } from '@/components/brand/Logo';
import { useTheme } from '@/hooks/use-theme';
import { AuthRequest } from '@/models/auth.model';
import { useAuth } from '@/provider/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { CircleAlert, Eye, EyeOff, Lock, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import * as z from 'zod';

export function LoginPage() {
    const { t } = useTranslation();
    const colors = useTheme();

    const formSchema = z.object({
        login: z.string().min(1, t('login.loginRequired')),
        password: z.string().min(1, t('login.passwordRequired'))
    });
    const { login } = useAuth();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
        <ScrollView
            className="flex-1"
            contentContainerClassName="grow px-4 pt-6 pb-8 gap-4"
            keyboardShouldPersistTaps="handled"
        >
            {/* Brand */}
            <View className="bg-hero rounded-4xl px-5.5 py-7 gap-3.5">
                <Logo width={220} onDark />
                <Text className="type-body text-hero-muted">{t('login.tagline')}</Text>
            </View>

            {/* Form */}
            <View className="bg-card rounded-2xl px-4.5 py-5.5 gap-3.5">
                <Text className="type-heading text-ink" accessibilityRole="header">
                    {t('login.heading')}
                </Text>

                {submitError && (
                    <View
                        className="flex-row items-center gap-2.5 bg-err-bg rounded-md px-3.5 py-3"
                        accessibilityRole="alert"
                    >
                        <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
                        <Text className="flex-1 font-onest-medium text-sm text-err-fg">{submitError}</Text>
                    </View>
                )}

                <FormControl isInvalid={!!errors.login}>
                    <FormControlLabel>
                        <FormControlLabelText>{t('login.loginLabel')}</FormControlLabelText>
                    </FormControlLabel>
                    <Controller
                        control={control}
                        name="login"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input size="lg" invalid={!!errors.login || !!submitError}>
                                <User size={20} color={colors.muted} strokeWidth={2} />
                                <InputField
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="username"
                                    textContentType="username"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    placeholder={t('login.loginPlaceholder')}
                                    accessibilityLabel={t('login.loginLabel')}
                                />
                            </Input>
                        )}
                    />
                    {errors.login && (
                        <FormControlError>
                            <FormControlErrorText>{errors.login.message}</FormControlErrorText>
                        </FormControlError>
                    )}
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                    <FormControlLabel>
                        <FormControlLabelText>{t('login.password')}</FormControlLabelText>
                    </FormControlLabel>
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input size="lg" invalid={!!errors.password || !!submitError} className="pr-1.5">
                                <Lock size={20} color={colors.muted} strokeWidth={2} />
                                <InputField
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="current-password"
                                    textContentType="password"
                                    value={value}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    placeholder={t('login.password')}
                                    accessibilityLabel={t('login.password')}
                                    onSubmitEditing={handleSubmit(handleFormSubmit)}
                                    returnKeyType="go"
                                />
                                <Pressable
                                    onPress={() => setShowPassword((shown) => !shown)}
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={colors.muted} strokeWidth={2} />
                                    ) : (
                                        <Eye size={20} color={colors.muted} strokeWidth={2} />
                                    )}
                                </Pressable>
                            </Input>
                        )}
                    />
                    {errors.password && (
                        <FormControlError>
                            <FormControlErrorText>{errors.password.message}</FormControlErrorText>
                        </FormControlError>
                    )}
                </FormControl>

                <Button
                    variant="accent"
                    size="lg"
                    full
                    onPress={handleSubmit(handleFormSubmit)}
                    loading={loading}
                    className="mt-1"
                >
                    {loading ? t('login.pleaseWait') : t('login.loginButton')}
                </Button>
            </View>
        </ScrollView>
    )
}
