import { DashboardStats, Transaction, User } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4030';

class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const getStoredUser = (): any | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const u = getStoredUser();
  const token = u?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...authHeaders(),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg = (body && (body.detail || body.message)) || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }

  return body as T;
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      // backend returns {id,name,email,role,token}
      const user = await request<any>(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return user as User;
    },
    logout: async () => {
      // no server-side session
      return;
    },
    me: async (): Promise<User> => {
      return request<User>(`/api/auth/me`, { method: 'GET' });
    },
  },

  admin: {
    listUsers: async (): Promise<User[]> => {
      return request<User[]>(`/api/admin/users`, { method: 'GET' });
    },
    createUser: async (name: string, email: string): Promise<User> => {
      return request<User>(`/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
    },
    deleteUser: async (id: string): Promise<void> => {
      await request(`/api/admin/users/${id}`, { method: 'DELETE' });
    },
  },

  transactions: {
    list: async (userId: string): Promise<Transaction[]> => {
      const qs = new URLSearchParams({ userId });
      return request<Transaction[]>(`/api/transactions?${qs.toString()}`, { method: 'GET' });
    },
    create: async (data: Omit<Transaction, 'id'>): Promise<Transaction> => {
      return request<Transaction>(`/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      await request(`/api/transactions/${id}`, { method: 'DELETE' });
    },
    importCsv: async (file: File, userId: string): Promise<number> => {
      const form = new FormData();
      form.append('file', file);

      const qs = new URLSearchParams({ userId });
      const res = await request<{ created: number }>(`/api/transactions/import?${qs.toString()}`, {
        method: 'POST',
        body: form,
      });
      return res.created;
    },
  },

  stats: {
    getDashboard: async (userId: string): Promise<DashboardStats> => {
      const qs = new URLSearchParams({ userId });
      return request<DashboardStats>(`/api/stats/dashboard?${qs.toString()}`, { method: 'GET' });
    },
    getCategoryBreakdown: async (category: string, userId: string): Promise<{ name: string; value: number }[]> => {
      const qs = new URLSearchParams({ category, userId });
      return request<{ name: string; value: number }[]>(`/api/stats/category-breakdown?${qs.toString()}`, { method: 'GET' });
    },
  },
};
