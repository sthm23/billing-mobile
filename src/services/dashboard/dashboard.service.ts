import { api } from '@/api/axios-instance'
import type { DashboardActivity, DashboardParams, DashboardSummary, DashboardTeam } from './dashboard.types'

/** Main block of the owner dashboard (`GET /dashboard/summary`, owner only). */
const getSummary = async (params: DashboardParams): Promise<DashboardSummary> => {
  const response = await api.get<DashboardSummary>('/dashboard/summary', { params })
  return response.data
}

/** «Показать ещё» block 1: sales by staff and by warehouse. */
const getTeam = async (params: DashboardParams): Promise<DashboardTeam> => {
  const response = await api.get<DashboardTeam>('/dashboard/team', { params })
  return response.data
}

/** «Показать ещё» block 2: sales by hour, returns, rental. */
const getActivity = async (params: DashboardParams): Promise<DashboardActivity> => {
  const response = await api.get<DashboardActivity>('/dashboard/activity', { params })
  return response.data
}

export const dashboardService = { getSummary, getTeam, getActivity }
