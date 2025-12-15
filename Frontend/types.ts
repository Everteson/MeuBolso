export type TransactionType = 'INCOME' | 'EXPENSE';

export type UserRole = 'ADMIN' | 'MEMBER';

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  isRecurring: boolean;
  tag?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string; // JWT
  avatar?: string;
}

export interface DashboardStats {
  balance: number;
  income: number;
  expenses: number;
  categoryData: { name: string; value: number; color: string }[];
  monthlyTrend: { name: string; income: number; expenses: number }[];
}

export enum AuthStatus {
  Unknown,
  Authenticated,
  Unauthenticated,
}
