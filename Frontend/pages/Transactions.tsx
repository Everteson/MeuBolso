import React, { useEffect, useState, useRef } from 'react';
import { Transaction } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Filter, 
  Trash2, 
  MoreVertical,
  Calendar,
  Tag
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  useEffect(() => {
    let result = transactions;
    if (filterType !== 'ALL') {
      result = result.filter(t => t.type === filterType);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(lower) || 
        t.category.toLowerCase().includes(lower) ||
        (t.tag && t.tag.toLowerCase().includes(lower))
      );
    }
    setFiltered(result);
  }, [searchTerm, filterType, transactions]);

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    const data = await api.transactions.list(user.id);
    setTransactions(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      await api.transactions.delete(id);
      loadTransactions();
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Descrição,Categoria,Valor,Tipo\n"
      + transactions.map(t => `${t.date},${t.description},${t.category},${t.amount},${t.type}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transacoes_family_finance.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      await api.transactions.importCsv(file, user.id);
      alert('Importação concluída com sucesso!');
      loadTransactions();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category || !user) return;
    
    // Attach current user ID
    const newTransaction = {
      ...formData,
      userId: user.id
    };

    await api.transactions.create(newTransaction as Omit<Transaction, 'id'>);
    setIsModalOpen(false);
    setFormData({
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      description: '',
      amount: 0,
      category: ''
    });
    loadTransactions();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
           <p className="text-gray-500 dark:text-gray-400">Gerencie todas as entradas e saídas</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
           >
             <Plus className="h-4 w-4" />
             Nova
           </button>
           <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           >
             <Download className="h-4 w-4" />
             <span className="hidden sm:inline">Exportar</span>
           </button>
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           >
             <Upload className="h-4 w-4" />
             <span className="hidden sm:inline">Importar</span>
           </button>
           <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterType === type 
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {type === 'ALL' ? 'Todas' : type === 'INCOME' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
           <div className="p-12 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{t.description}</span>
                        {t.tag && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                             <Tag className="h-3 w-3" /> {t.tag}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                      {t.isRecurring && <span className="ml-2 text-xs text-blue-500">Recorrente</span>}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${t.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Nova Transação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                 <button
                   type="button"
                   onClick={() => setFormData({...formData, type: 'EXPENSE'})}
                   className={`flex-1 py-2 rounded-lg font-medium border ${formData.type === 'EXPENSE' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                 >
                   Saída
                 </button>
                 <button
                   type="button"
                   onClick={() => setFormData({...formData, type: 'INCOME'})}
                   className={`flex-1 py-2 rounded-lg font-medium border ${formData.type === 'INCOME' ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                 >
                   Entrada
                 </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Supermercado"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.amount || ''} 
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                    <select
                      value={formData.category || ''}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="Alimentação">Alimentação</option>
                      <option value="Contas">Contas</option>
                      <option value="Lazer">Lazer</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Salário">Salário</option>
                      <option value="Extra">Extra</option>
                      <option value="Taxas">Taxas e Impostos</option>
                    </select>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag (Opcional)</label>
                   <input 
                    type="text" 
                    value={formData.tag || ''} 
                    onChange={e => setFormData({...formData, tag: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Trabalho"
                  />
                 </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                 <input 
                    type="checkbox" 
                    id="recurring"
                    checked={formData.isRecurring}
                    onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                 />
                 <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300">Recorrente (Todo mês)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};