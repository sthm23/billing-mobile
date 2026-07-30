import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Center } from '@/components/ui/center';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Link } from '@/components/ui/link';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
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
const tokens = {
    container: 'h-full w-full px-4',
    wrapper: 'w-full bg-background dark:bg-background-dark px-4 py-8 rounded-lg h-content border border-border dark:border-border-dark',
    header: 'items-center mb-8 mt-0',
    title: 'text-3xl font-bold text-primary mb-2',
    email: 'mb-4 w-full',
    password: 'mb-6 w-full',
    submit: 'w-full mb-4',
    submitBtn: 'w-full mb-4',
    footer: 'flex-row justify-center'
};

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
            login(data);
        } catch (error) {
            const message = getLoginErrorMessage(error);
            setSubmitError(message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <Center className="w-full h-full p-4">
            <Card className="w-full" size="default">
                <VStack className="gap-4">
                    <Center >
                        <Heading size="lg" className="text-foreground">{t('login.title')}</Heading>
                        <Heading size="md" className="text-foreground/60">{t('login.subTitle')}</Heading>
                    </Center>

                    <FormControl isInvalid={!!errors.login}>
                        <FormControlLabel>
                            <FormControlLabelText className="text-foreground/60">{t('login.email')}</FormControlLabelText>
                        </FormControlLabel>
                        <Controller control={control} name="login" render={({
                            field: {
                                onChange,
                                onBlur,
                                value
                            }
                        }) => {
                            return (
                                <Input >
                                    <InputField keyboardType="email-address"
                                        autoCapitalize="none" value={value} onBlur={onBlur} onChangeText={onChange} type="text" placeholder="login@email.uz" />
                                </Input>
                            )
                        }} />
                        {errors.login &&
                            <FormControlError>
                                <FormControlErrorIcon
                                    as={AlertCircleIcon}
                                    className="text-destructive"
                                />
                                <FormControlErrorText className="text-destructive">
                                    {errors.login.message}
                                </FormControlErrorText>
                            </FormControlError>
                        }
                    </FormControl>

                    <FormControl isInvalid={!!errors.password}>
                        <FormControlLabel>
                            <FormControlLabelText className="text-foreground/60">{t('login.password')}</FormControlLabelText>
                        </FormControlLabel>
                        <Controller control={control} name="password" render={({
                            field: {
                                onChange,
                                onBlur,
                                value
                            }
                        }) => (
                            <Input >
                                <InputField secureTextEntry={true} value={value} onBlur={onBlur} type={showPassword ? 'text' : 'password'} placeholder="********" onChangeText={onChange} />
                                <InputSlot className="pr-3" onPress={handleState}>
                                    <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                                </InputSlot>
                            </Input>
                        )} />
                        {errors.password &&
                            <FormControlError>
                                <FormControlErrorIcon
                                    as={AlertCircleIcon}
                                    className="text-destructive"
                                />
                                <FormControlErrorText className="text-destructive">
                                    {errors.password.message}
                                </FormControlErrorText>
                            </FormControlError>}
                    </FormControl>

                    <VStack space="xs">

                        <Button size="default" onPress={handleSubmit(handleFormSubmit)} disabled={loading} >
                            {loading && <ButtonSpinner color="gray" />}
                            <ButtonText>{loading ? 'Please wait...' : t('login.loginButton')}</ButtonText>
                        </Button>

                        <Center className={tokens.footer}>
                            <Text >{t('login.signUptext')} </Text>
                            <Link className="ml-1">
                                <Text className="font-bold">{t('login.signUp')}</Text>
                            </Link>
                        </Center>
                    </VStack>

                </VStack>
            </Card>
        </Center>
    )
}