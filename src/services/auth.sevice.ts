import { api } from '@/api/axios-instance'
import { ApiResponse } from '@/models/app.models'
import { AuthRequest, AuthResponse, CurrentUserType, LogoutRequest } from '@/models/auth.model'


const profile = async () => {
  const response = await api.get<ApiResponse<CurrentUserType>>('/auth/me')
  return response.data
}

const loginAuth = async (body: AuthRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/login', body)
  return response.data
}

const logoutAuth = async (body?: LogoutRequest) => {
  const response = await api.post<AuthResponse>('/logout', body)
  return response.data
}

const refreshAuth = async () => {
  const response = await api.get<AuthResponse>('/refresh')
  return response.data
}

export { loginAuth, logoutAuth, profile, refreshAuth }

