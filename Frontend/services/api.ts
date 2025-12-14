import { DashboardStats, Transaction, User } from '../types';

// Mock Database
let mockUsers: User[] = [
  { id: '1', name: 'Everteson', email: 'admin@family.com', role: 'ADMIN' },
  { id: '2', name: 'Maria', email: 'maria@family.com', role: 'MEMBER' },
];

let mockTransactions: Transaction[] = [
  { id: '1', userId: '1', description: 'Supermercado Semanal', amount: 450.50, type: 'EXPENSE', category: 'Alimentação', date: '2023-10-25', isRecurring: false, tag: 'Casa' },
  { id: '2', userId: '1', description: 'Salário Mensal', amount: 5000.00, type: 'INCOME', category: 'Salário', date: '2023-10-05', isRecurring: true, tag: 'Trabalho' },
  { id: '3', userId: '1', description: 'Internet Fibra', amount: 120.00, type: 'EXPENSE', category: 'Contas', date: '2023-10-10', isRecurring: true },
  { id: '4', userId: '1', description: 'Jantar Fora', amount: 180.00, type: 'EXPENSE', category: 'Lazer', date: '2023-10-20', isRecurring: false, tag: 'Casal' },
  { id: '5', userId: '1', description: 'Freela Design', amount: 800.00, type: 'INCOME', category: 'Extra', date: '2023-10-15', isRecurring: false },
  { id: '6', userId: '1', description: 'IPVA', amount: 1200.00, type: 'EXPENSE', category: 'Taxas', date: '2023-01-15', isRecurring: true, tag: 'Carro' },
  { id: '7', userId: '2', description: 'Salário Maria', amount: 3500.00, type: 'INCOME', category: 'Salário', date: '2023-10-01', isRecurring: true },
  { id: '8', userId: '2', description: 'Academia', amount: 100.00, type: 'EXPENSE', category: 'Saúde', date: '2023-10-02', isRecurring: true },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(800);
      
      // 1. Try to find existing user
      const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) return existingUser;
      
      // 2. Shortcut for admin (if typed just 'admin')
      if (email.toLowerCase() === 'admin') return mockUsers[0];

      // 3. Auto-register new user (Demo feature: allow any email to sign up automatically)
      // This solves the issue of users not knowing valid credentials
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0] || 'Novo Usuário',
        email: email,
        role: 'MEMBER' // Default to MEMBER
      };
      
      mockUsers.push(newUser);
      return newUser;
    },
    logout: async () => {
      await delay(500);
    },
  },
  admin: {
    listUsers: async (): Promise<User[]> => {
      await delay(500);
      return [...mockUsers];
    },
    createUser: async (name: string, email: string): Promise<User> => {
      await delay(600);
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role: 'MEMBER'
      };
      mockUsers = [...mockUsers, newUser];
      return newUser;
    },
    deleteUser: async (id: string): Promise<void> => {
      await delay(500);
      if (id === '1') throw new Error("Não é possível remover o administrador principal");
      mockUsers = mockUsers.filter(u => u.id !== id);
      // Cleanup transactions
      mockTransactions = mockTransactions.filter(t => t.userId !== id);
    }
  },
  transactions: {
    list: async (userId: string): Promise<Transaction[]> => {
      await delay(600);
      return mockTransactions
        .filter(t => t.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    create: async (data: Omit<Transaction, 'id'>): Promise<Transaction> => {
      await delay(600);
      const newTx: Transaction = { ...data, id: Math.random().toString(36).substr(2, 9) };
      mockTransactions = [newTx, ...mockTransactions];
      return newTx;
    },
    delete: async (id: string): Promise<void> => {
      await delay(400);
      mockTransactions = mockTransactions.filter(t => t.id !== id);
    },
    importCsv: async (file: File, userId: string): Promise<number> => {
      await delay(1500);
      // In a real app, parse CSV and assign userId to each row
      return 15; 
    }
  },
  stats: {
    getDashboard: async (userId: string): Promise<DashboardStats> => {
      await delay(600);
      const userTransactions = mockTransactions.filter(t => t.userId === userId);
      
      const income = userTransactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
      const expenses = userTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
      
      const categoryMap = new Map<string, number>();
      userTransactions.filter(t => t.type === 'EXPENSE').forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

      const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
      const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));

      return {
        balance: income - expenses,
        income,
        expenses,
        categoryData,
        monthlyTrend: [
          { name: 'Jul', income: 4000, expenses: 3200 },
          { name: 'Ago', income: 4200, expenses: 2800 },
          { name: 'Set', income: 5000, expenses: 3500 },
          { name: 'Out', income: 5800, expenses: 3100 },
        ]
      };
    },
    getCategoryBreakdown: async (category: string, userId: string): Promise<{ name: string; value: number }[]> => {
      await delay(500);
      const categoryTransactions = mockTransactions.filter(t => t.userId === userId && t.category === category && t.type === 'EXPENSE');
      
      const tagMap = new Map<string, number>();
      categoryTransactions.forEach(t => {
        const tag = t.tag || 'Sem Tag';
        tagMap.set(tag, (tagMap.get(tag) || 0) + t.amount);
      });

      return Array.from(tagMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }
  }
};