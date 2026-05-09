export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface CreditPackage {
  id: number
  name: string
  credits: number
  price: number
  validity_days: number
  description: string | null
  is_active: boolean
  sort_order: number
}

export interface CreditOrder {
  id: number
  package_id: number | null
  credits: number
  amount: number
  topup_code: string
  status: OrderStatus
  qr_expires_at: string | null
  paid_at: string | null
  created_at: string
}

export interface CreateOrderResponse {
  order_id: number
  topup_code: string
  amount: number
  credits: number
  qr_expires_at: string
  qr_url: string
  qr_data_url: string
  bank_name: string
  bank_number: string
  bank_account_holder: string
}

export interface PollOrderResponse {
  paid: boolean
  status: OrderStatus
  credits?: number
  paid_at?: string
}
