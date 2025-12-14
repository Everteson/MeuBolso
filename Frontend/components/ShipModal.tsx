import React from 'react';
import { Ship } from '../types';
import { X, Anchor, MapPin, Calendar, Box, Flag } from 'lucide-react';

interface ShipModalProps {
  ship: Ship | null;
  onClose: () => void;
}

const ShipModal: React.FC<ShipModalProps> = ({ ship, onClose }) => {
  if (!ship) return null;

  const formattedDate = new Date(ship.arrivalDate).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn">
        {/* Header */}
        <div className="bg-emerald-700 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Anchor className="text-emerald-300" size={28} />
            <h2 className="text-2xl font-bold">{ship.name}</h2>
          </div>
          <p className="text-emerald-100 text-sm ml-10">ID: {ship.id}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Origin - Highlighted as requested */}
          <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <MapPin className="text-emerald-600 mt-1" size={24} />
            <div>
              <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wider">Porto de Origem</p>
              <p className="text-xl font-bold text-gray-800">{ship.originPort}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar size={16} />
                <span className="text-xs font-medium uppercase">Chegada Prevista</span>
              </div>
              <p className="text-gray-900 font-medium">{formattedDate}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <Box size={16} />
                <span className="text-xs font-medium uppercase">Carga</span>
              </div>
              <p className="text-gray-900 font-medium">{ship.cargoType}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <Flag size={16} />
                <span className="text-xs font-medium uppercase">Bandeira</span>
              </div>
              <img 
                src={`https://flagcdn.com/24x18/${ship.flag.toLowerCase()}.png`} 
                alt={ship.flag} 
                className="inline-block shadow-sm rounded-sm mt-1"
              />
            </div>
             
             <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <div className={`w-2 h-2 rounded-full ${
                    ship.status === 'Atracado' ? 'bg-blue-500' : 
                    ship.status === 'Atrasado' ? 'bg-red-500' : 'bg-green-500'
                }`} />
                <span className="text-xs font-medium uppercase">Status</span>
              </div>
              <p className="text-gray-900 font-medium">{ship.status}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipModal;
