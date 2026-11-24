import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { dashboardService } from './dashboard.service'
import type { DashboardActivity, DashboardParams, DashboardSummary, DashboardTeam } from './dashboard.types'

/** A period that ended no longer changes (event-dated reports): keep it cached longer. */
const CLOSED_PERIOD_STALE_MS = 10 * 60 * 1000

export const dashboardQueryKeys = {
  all: () => ['dashboard'] as const,
  summary: (params: DashboardParams) => [...dashboardQueryKeys.all(), 'summary', params] as const,
  team: (params: DashboardParams) => [...dashboardQueryKeys.all(), 'team', params] as const,
  activity: (params: DashboardParams) => [...dashboardQueryKeys.all(), 'activity', params] as const,
}

const staleTime = (params: DashboardParams): number | undefined =>
  Date.parse(params.to) <= Date.now() ? CLOSED_PERIOD_STALE_MS : undefined

/** Main block for the period / warehouse; keeps the previous data while a new period loads. */
export const useDashboardSummary = (params: DashboardParams, enabled = true): UseQueryResult<DashboardSummary> =>
  useQuery({
    enabled,
    queryKey: dashboardQueryKeys.summary(params),
    queryFn: () => dashboardService.getSummary(params),
    staleTime: staleTime(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  })

/** Block 1 of «Показать ещё»; `enabled` only after the owner opened it. */
export const useDashboardTeam = (params: DashboardParams, enabled: boolean): UseQueryResult<DashboardTeam> =>
  useQuery({
    enabled,
    queryKey: dashboardQueryKeys.team(params),
    queryFn: () => dashboardService.getTeam(params),
    staleTime: staleTime(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  })

/** Block 2 of «Показать ещё»; rental «now» figures, so no long cache for the current period. */
export const useDashboardActivity = (params: DashboardParams, enabled: boolean): UseQueryResult<DashboardActivity> =>
  useQuery({
    enabled,
    queryKey: dashboardQueryKeys.activity(params),
    queryFn: () => dashboardService.getActivity(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  })
