/**
 * Copyright (c) 2025 SkipQ
 *
 * This source code is considered Developed Content.
 * LICENSE file in the root directory of this source tree.
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { ReactNode } from 'react';
import { Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'warn'

export type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'

export type ToastClassNames = {
    wrapper?: string
    title?: string
    message?: string
    icon?: string
}

export type ToastAction = {
    label: string
    onClick: () => void
}

export type ToastProps = {
    title?: string
    message: string
    type?: ToastType
    icon?: ReactNode
    action?: ToastAction
    classNames?: ToastClassNames
}

export type ShowToastOptions = {
    title?: string
    message: string
    type?: ToastType
    duration?: number
    position?: ToastPosition
    action?: ToastAction
    classNames?: ToastClassNames
}
const DEFAULT_DURATION = 3000
const DEFAULT_POSITION = 'top-center'
const DEFAULT_TYPE = 'success'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

async function schedulePushNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "You've got mail! 📬",
            body: 'Here is the notification body',
            data: {
                data: 'goes here',
                test: { test1: 'more data' }
            },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 2,
        },
    });
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('myNotificationChannel', {
            name: 'A channel is needed for the permissions prompt to appear',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // EAS projectId is used here.
    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            throw new Error('Project ID not found');
        }
        token = (
            await Notifications.getExpoPushTokenAsync({
                projectId,
            })
        ).data;
    } catch (e) {
        token = `${e}`;
    }

    return token;
}
