
import { LOCALE_STORAGE_KEYS } from '@/models/app.models';
import { LogoutRequest } from '@/models/auth.model';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';


const BASE_URL = Platform.select({
  // ios: 'http://192.168.18.2:4000/api',
  // android: 'http://192.168.18.2:4000/api',
  // default: 'http://localhost:4000/api',


  ios: 'https://sthm23.uz/api',
  android: 'https://sthm23.uz/api',
  default: 'https://sthm23.uz/api',
})

const TIMEOUT = 30_000;
const WITH_CREDENTIALS = true;

const API_CONFIG = {
  AUTH_URL: `${BASE_URL}/auth`,
  USERS_URL: `${BASE_URL}/users`,
  PRODUCTS_URL: `${BASE_URL}/products`,
  ORDERS_URL: `${BASE_URL}/orders`,
  PAYMENTS_URL: `${BASE_URL}/payments`,
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

const UNAUTHORIZED_ENDPOINTS = [
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

  return UNAUTHORIZED_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

const clearSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOCALE_STORAGE_KEYS.TOKEN)
  await AsyncStorage.removeItem(LOCALE_STORAGE_KEYS.USER)
}

const refreshAccessToken = async (): Promise<string | null> => {
  refreshPromise ??= (async () => {
    const response = await RAW_API.get<{ data?: { accessToken?: string } }>('/refresh')
    return response.data?.data?.accessToken ?? null
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

const handleUnauthorizedExit = async (sessionId: string | null): Promise<void> => {
  try {
    if (sessionId) {
      const body: LogoutRequest = {
        isAllDevices: true,
        sessionId,
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

      const token = await AsyncStorage.getItem(LOCALE_STORAGE_KEYS.TOKEN)

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

      if (originalConfig?.url?.includes('/auth/logout')) {
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
      const sessionId = await AsyncStorage.getItem(LOCALE_STORAGE_KEYS.TOKEN)

      try {
        const newToken = await refreshAccessToken()

        if (!newToken) {
          throw new Error('Token refresh failed')
        }

        await AsyncStorage.setItem(LOCALE_STORAGE_KEYS.TOKEN, newToken)
        originalConfig.headers.Authorization = `Bearer ${newToken}`

        return instance.request(originalConfig)
      } catch (refreshError) {
        await handleUnauthorizedExit(sessionId)
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

