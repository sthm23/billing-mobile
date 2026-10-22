import { monthRange } from '@/libs/date'
import { cashboxQueryKeys } from '@/services/cashbox/cashbox.queries'
import { orderQueryKeys } from '@/services/order/order.queries'
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { debtService } from './debt.service'
import type { DebtorDetail, DebtorsParams, DebtorsResponse, RepayDebtInput } from './debt.types'

export const debtQueryKeys = {
  all: () => ['debt'] as const,
  debtors: (params: DebtorsParams) => [...debtQueryKeys.all(), 'debtors', params] as const,
  debtor: (customerId: string) => [...debtQueryKeys.all(), 'debtor', customerId] as const,
}

/** Debtors list and totals; «Погашено» covers the current local month. */
export const useDebtors = (params: Omit<DebtorsParams, 'from' | 'to'> = {}): UseQueryResult<DebtorsResponse> => {
  const query: DebtorsParams = { ...params, ...monthRange() }

  return useQuery({
    queryKey: debtQueryKeys.debtors(query),
    queryFn: () => debtService.getDebtors(query),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  })
}

/** Open debts of one customer. */
export const useDebtor = (customerId: string): UseQueryResult<DebtorDetail> =>
  useQuery({
    queryKey: debtQueryKeys.debtor(customerId),
    queryFn: () => debtService.getDebtor(customerId),
    enabled: Boolean(customerId),
    refetchOnWindowFocus: false,
  })

/** Repays a debt; refreshes debts, orders (status, sales) and cashboxes. */
export const useRepayDebt = (): UseMutationResult<void, AxiosError<{ message?: string | string[] }>, RepayDebtInput> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input) => debtService.repay(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtQueryKeys.all() })
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all() })
      queryClient.invalidateQueries({ queryKey: cashboxQueryKeys.all() })
    },
  })
}
