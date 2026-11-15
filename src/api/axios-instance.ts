
import { LOCALE_STORAGE_KEYS } from '@/models/app.models'
import { getAccessToken, removeAccessToken, setAccessToken } from '@/libs/token-storage';
import { LogoutRequest } from '@/models/auth.model';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';


const BASE_URL = Platform.select({
  // ios: 'http://192.168.18.2:4000/api',
  // android: 'http://192.168.18.2:4000/api',
  // default: 'http://localhost:4000/api',

  ios: 'http://192.168.18.5:4000/api',
  android: 'http://192.168.18.5:4000/api',
  default: 'http://localhost:4000/api',


  // ios: 'https://sthm23.uz/api',
  // android: 'https://sthm23.uz/api',
  // default: 'https://sthm23.uz/api',
})

const TIMEOUT = 30_000;
const WITH_CREDENTIALS = true;

const API_CONFIG = {
  AUTH_URL: `${BASE_URL}/auth`,
  USERS_URL: `${BASE_URL}/users`,
  PRODUCTS_URL: `${BASE_URL}/product`,
  ORDERS_URL: `${BASE_URL}/orders`,
  PAYMENTS_URL: `${BASE_URL}/payment`,
  WAREHOUSE_URL: `${BASE_URL}/warehouse`,
  CATEGORY_URL: `${BASE_URL}/category`,
}

const RAW_API = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: WITH_CREDENTIALS,
  headers: {
    'Content-Type': 'application/json',
  },
})

const PUBLIC_ENDPOINTS = [
  '/login',
  '/signup',
  '/refresh',
  '/logout',
]

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const shouldSkipAuthorization = (url?: string): boolean => {
  if (!url) {
    return false
  }

  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

const shouldSkipUnauthorizedHandling = (url?: string): boolean => {
  if (!url) {
    return false
  }

  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

/** Backend code of a 403 for a suspended store (SubscriptionGuard) */
export const STORE_SUSPENDED_CODE = 'STORE_SUSPENDED'

type StoreSuspendedListener = () => void
const storeSuspendedListeners = new Set<StoreSuspendedListener>()

/**
 * Called when any request gets 403 STORE_SUSPENDED (the admin suspended the
 * store). AuthProvider reloads the profile and the app shows «Магазин
 * приостановлен». Returns an unsubscribe function.
 */
export const onStoreSuspended = (listener: StoreSuspendedListener): (() => void) => {
  storeSuspendedListeners.add(listener)
  return () => {
    storeSuspendedListeners.delete(listener)
  }
}

type SessionExpiredListener = () => void
const sessionExpiredListeners = new Set<SessionExpiredListener>()

/**
 * Called when a 401 could not be fixed by /refresh (refresh token expired or
 * revoked): the local token is already removed. AuthProvider resets its state
 * so the root layout opens the login screen. Returns an unsubscribe function.
 */
export const onSessionExpired = (listener: SessionExpiredListener): (() => void) => {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

const isStoreSuspendedError = (error: AxiosError): boolean => {
  const data = error.response?.data as { code?: string } | undefined
  return error.response?.status === 403 && data?.code === STORE_SUSPENDED_CODE
}

const clearSession = async (): Promise<void> => {
  await removeAccessToken()
  await AsyncStorage.removeItem(LOCALE_STORAGE_KEYS.USER)
}

const refreshAccessToken = async (): Promise<string | null> => {
  refreshPromise ??= (async () => {
    const response = await RAW_API.get<{ accessToken?: string }>('/refresh')
    return response.data?.accessToken ?? null
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

const handleUnauthorizedExit = async (accessToken: string | null): Promise<void> => {
  try {
    if (accessToken) {
      const body: LogoutRequest = {
        allDevices: false, // only this device; other sessions stay signed in
        sessionId: accessToken, // Backend expects access token as sessionId to decode sid
      }
      await RAW_API.post('/logout', body)
    }
  } catch {
    // Ignore logout request errors and still clear local auth state.
  } finally {
    await clearSession()
  }
}

const attachAuthInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
      if (shouldSkipAuthorization(config.url)) {
        return config
      }

      if (config.headers.Authorization) {
        return config
      }

      const token = await getAccessToken()

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    }
  )

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalConfig = error.config as RetryableConfig | undefined

      if (isStoreSuspendedError(error)) {
        storeSuspendedListeners.forEach((listener) => listener())
        return Promise.reject(error)
      }

      if (originalConfig?.url?.includes('/logout')) {
        await clearSession()
        return Promise.reject(error)
      }

      if (
        !originalConfig ||
        error.response?.status !== 401 ||
        shouldSkipUnauthorizedHandling(originalConfig.url) ||
        originalConfig._retry
      ) {
        return Promise.reject(error)
      }

      originalConfig._retry = true

      if (isRefreshing) {
        const token = await refreshPromise
        if (!token) {
          return Promise.reject(error)
        }
        originalConfig.headers.Authorization = `Bearer ${token}`
        return instance.request(originalConfig)
      }

      isRefreshing = true
      const accessToken = await getAccessToken()

      try {
        const newToken = await refreshAccessToken()

        if (!newToken) {
          throw new Error('Token refresh failed')
        }

        await setAccessToken(newToken)
        originalConfig.headers.Authorization = `Bearer ${newToken}`

        return instance.request(originalConfig)
      } catch (refreshError) {
        await handleUnauthorizedExit(accessToken)
        sessionExpiredListeners.forEach((listener) => listener())
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  )
}

const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const config = {
    baseURL,
    timeout: TIMEOUT,
    withCredentials: WITH_CREDENTIALS,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const instance = axios.create(config)
  attachAuthInterceptor(instance)

  return instance
}

export const api = createAxiosInstance(BASE_URL)

export const usersApi = createAxiosInstance(API_CONFIG.USERS_URL)

export const ordersApi = createAxiosInstance(API_CONFIG.ORDERS_URL)

export const productsApi = createAxiosInstance(API_CONFIG.PRODUCTS_URL)

export const paymentsApi = createAxiosInstance(API_CONFIG.PAYMENTS_URL)

export const warehouseApi = createAxiosInstance(API_CONFIG.WAREHOUSE_URL)

export const categoryApi = createAxiosInstance(API_CONFIG.CATEGORY_URL)

