import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  Loader2,
  TrendingUp,
  X
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<{ name: string; value: number }[] | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        const data = await api.stats.getDashboard(user.id);
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user]);

  const handleCategoryClick = async (data: any) => {
    if (!data || !data.name || !user) return;
    
    setSelectedCategory(data.name);
    setCategoryDetails(null);
    setDetailsLoading(true);
    
    try {
      const breakdown = await api.stats.getCategoryBreakdown(data.name, user.id);
      setCategoryDetails(breakdown);
    } catch (e) {
      console.error("Failed to load details", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-primary-600">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
        <p className="text-gray-500 dark:text-gray-400">Resumo financeiro deste mês</p>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Atual</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            R$ {stats.balance.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Entradas</h3>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            + R$ {stats.income.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saídas</h3>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            - R$ {stats.expenses.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Fluxo Mensal</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(val) => `R$${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="income" name="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Gastos por Categoria (Toque para detalhes)</h3>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={handleCategoryClick}
                    className="cursor-pointer outline-none"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalhes: {selectedCategory}
                </h2>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
             </div>

             {detailsLoading ? (
                <div className="h-48 flex items-center justify-center text-primary-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
             ) : (
               <>
                  {!categoryDetails || categoryDetails.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Nenhuma tag registrada para esta categoria.
                    </p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={categoryDetails} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={80} 
                            tick={{ fill: '#6B7280', fontSize: 12 }} 
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                          />
                          <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
               </>
             )}
           </div>
        </div>
      )}
    </div>
  );
};