import { api } from '@/api/axios-instance'
import type { DashboardParams, DashboardSummary } from './dashboard.types'

/** Main block of the owner dashboard (`GET /dashboard/summary`, owner only). */
const getSummary = async (params: DashboardParams): Promise<DashboardSummary> => {
  const response = await api.get<DashboardSummary>('/dashboard/summary', { params })
  return response.data
}

export const dashboardService = { getSummary }
