import React, { useState, useEffect } from 'react';
import { generateShipSchedule } from './services/geminiService';
import { Ship } from './types';
import ShipModal from './components/ShipModal';
import { RefreshCw, Ship as ShipIcon, Loader2, Anchor } from 'lucide-react';

const App: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);

  const fetchShips = async () => {
    setLoading(true);
    try {
      const data = await generateShipSchedule();
      setShips(data);
    } catch (error) {
      console.error("Failed to fetch ships", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchShips();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="text-emerald-300" />
            <span className="text-sm font-medium tracking-wide opacity-80">PortoFlow</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold">Painel de Chegada - Navios</h1>
          <div className="w-8"></div> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lista de Navios</h2>
            <p className="text-gray-500 text-sm mt-1">Clique em um navio para ver a origem e detalhes.</p>
          </div>
          
          <button
            onClick={fetchShips}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <RefreshCw size={20} />
            )}
            {loading ? 'Carregando dados...' : 'Atualizar Dados'}
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50 border-b border-emerald-100">
                  <th className="py-4 px-6 text-emerald-800 font-semibold text-sm uppercase tracking-wider">Navio</th>
                  <th className="py-4 px-6 text-emerald-800 font-semibold text-sm uppercase tracking-wider w-32 hidden sm:table-cell">Bandeira</th>
                  <th className="py-4 px-6 text-emerald-800 font-semibold text-sm uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-emerald-800 font-semibold text-sm uppercase tracking-wider text-right">Data de Chegada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && ships.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <p>Carregando cronograma...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ships.map((ship) => (
                    <tr 
                      key={ship.id}
                      onClick={() => setSelectedShip(ship)}
                      className="group hover:bg-emerald-50/50 cursor-pointer transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                            <ShipIcon size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{ship.name}</p>
                            <p className="text-xs text-gray-500 sm:hidden">Origem: {ship.originPort}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden sm:table-cell">
                         <div className="tooltip" title={ship.flag}>
                            <img 
                              src={`https://flagcdn.com/24x18/${ship.flag.toLowerCase()}.png`} 
                              alt={ship.flag} 
                              className="w-6 h-4 object-cover rounded shadow-sm opacity-80 group-hover:opacity-100"
                            />
                         </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${ship.status === 'Atracado' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            ship.status === 'Atrasado' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-green-50 text-green-700 border-green-200'}`}>
                          {ship.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-sm text-gray-600">
                        {new Date(ship.arrivalDate).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && ships.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhum dado disponível. Clique em atualizar.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} PortoFlow System. Demo Portfolio.</p>
          <p className="mt-1 text-xs">Modo de Demonstração (Dados Estáticos)</p>
        </div>
      </footer>

      {/* Modal */}
      <ShipModal ship={selectedShip} onClose={() => setSelectedShip(null)} />
    </div>
  );
};

export default App;
