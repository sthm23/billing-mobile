import { UserType } from '@/models/user.model';

/**
 * Customer as returned by `GET /users/customers`: the user row with its
 * `customer` record. Orders reference `customer.id`, not the user id.
 */
export interface CustomerListItem {
  id: string;
  fullName: string;
  phone: string;
  type: UserType;
  createdAt: string;
  customer: { id: string; userId: string; createdAt: string } | null;
}

/** Customer picked for an order (`id` = Customer.id). */
export interface OrderCustomer {
  id: string;
  fullName: string;
  phone: string;
}

export interface CreateCustomerPayload {
  fullName: string;
  /** Full number, e.g. "+998901234567" */
  phone: string;
}
