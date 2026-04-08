export type Currency = 'RUB' | 'USD' | 'EUR'
export type SplitType = 'equal' | 'custom'
export type GroupStatus = 'active' | 'closed' | 'archived'
export type DebtStatus = 'pending' | 'seen' | 'paid'
export type UserRole = 'owner' | 'member'
export type ExpenseCategory = 'food' | 'transport' | 'housing' | 'entertainment' | 'other'

export interface User {
  id: string
  phone: string
  name: string
  avatar_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  owner_id: string
  currency: Currency
  status: GroupStatus
  total_balance: number
  created_at: string
  closed_at?: string
}

export interface GroupMember {
  id: string
  user_id: string
  group_id: string
  role: UserRole
  balance: number
  joined_at: string
  user?: User
}

export interface Expense {
  id: string
  group_id: string
  paid_by: string
  created_by: string
  amount: number
  currency: Currency
  category?: ExpenseCategory
  description?: string
  split_type: SplitType
  split_shares: Record<string, number>
  is_offline: boolean
  created_at: string
  paid_by_user?: User
}

export interface Debt {
  id: string
  group_id: string
  debtor_id: string
  creditor_id: string
  amount: number
  currency: Currency
  status: DebtStatus
  paid_at?: string
  updated_at: string
  debtor?: User
  creditor?: User
}

export interface ExpenseFormData {
  amount: number
  currency: Currency
  description?: string
  category?: ExpenseCategory
  paid_by: string
  split_type: SplitType
  split_shares: Record<string, number>
  is_offline: boolean
  group_id: string
  created_by: string
  created_at?: string
}