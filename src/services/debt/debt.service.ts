import { api, paymentsApi } from '@/api/axios-instance'
import type { DebtorDetail, DebtorsParams, DebtorsResponse, RepayDebtInput } from './debt.types'

/** Debtors of the store with totals. */
const getDebtors = async (params: DebtorsParams): Promise<DebtorsResponse> => {
  const response = await api.get<DebtorsResponse>('/debt/debtors', { params })
  return response.data
}

/** Open debts of one customer (`UNASSIGNED_DEBTOR` — orders without a customer). */
const getDebtor = async (customerId: string): Promise<DebtorDetail> => {
  const response = await api.get<DebtorDetail>(`/debt/debtors/${customerId}`)
  return response.data
}

/**
 * Repays a debt: a DEBT order via `POST /payment` (no stock movement), a
 * manual debt via `POST /debt/payment`. The backend rejects overpayment.
 */
const repay = async ({ kind, id, customerId, cashboxId, payments }: RepayDebtInput): Promise<void> => {
  if (kind === 'ORDER') {
    await paymentsApi.post('/', { orderId: id, customerId, cashboxId, payments })
  } else {
    await api.post('/debt/payment', { debtId: id, cashboxId, payments })
  }
}

export const debtService = { getDebtors, getDebtor, repay }
