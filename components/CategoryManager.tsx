
import React, { useState, useRef } from 'react';
import { Category, UserSettings, Scope } from '../types';
import { COLORS, formatCurrency } from '../constants';
import { Trash2, Plus, Tag, Save, Upload, Moon, Sun, Download, Smartphone, Calculator, Wallet, TrendingDown, Heart, Target } from 'lucide-react';
import CategoryIcon, { ICON_KEYS } from './CategoryIcon';

interface CategoryManagerProps {
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  userSettings: UserSettings;
  setUserSettings: (settings: UserSettings) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  currentScope: Scope;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  categories, 
  setCategories,
  userSettings,
  setUserSettings,
  onExport,
  onImport,
  currentScope
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'data' | 'calculator'>('profile');
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICON_KEYS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Calculator State
  const [calcIncome, setCalcIncome] = useState('');
  const [calcExpense, setCalcExpense] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCatName,
      color: selectedColor,
      icon: selectedIcon,
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
  };

  const handleRemove = () => {
    if (!deleteId) return;
    if (categories.length <= 1) {
      alert("Você precisa ter pelo menos uma categoria.");
      setDeleteId(null);
      return;
    }
    setCategories(categories.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  const updateBudget = (val: number) => {
    const currentBudgets = userSettings.monthlyBudgets || { personal: 0, business: 0 };
    setUserSettings({
      ...userSettings,
      monthlyBudgets: {
        ...currentBudgets,
        [currentScope]: val
      }
    });
  };

  // Calculator Logic
  const incomeNum = parseFloat(calcIncome) || 0;
  const expenseNum = parseFloat(calcExpense) || 0;
  const balance = incomeNum - expenseNum;
  
  // Logic updated: 10% of the BALANCE (Profit), not the Income.
  const titheAmount = balance > 0 ? balance * 0.10 : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden pb-20 transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <Tag size={20} className="text-blue-600 dark:text-blue-400" />
          Ajustes
        </h2>
        
        {/* Settings Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Categorias
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'calculator' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Calculadora
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Dados
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-4">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nome de Exibição ({currentScope === 'business' ? 'Empresarial' : 'Pessoal'})
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={userSettings.names?.[currentScope] || userSettings.name}
                  onChange={(e) => {
                      const newNames = {
                          ...(userSettings.names || { personal: userSettings.name, business: userSettings.name }),
                          [currentScope]: e.target.value
                      };
                      setUserSettings({...userSettings, names: newNames});
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Monthly Budget Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Target size={16} className="text-blue-600 dark:text-blue-400" />
                Meta de Gasto Mensal ({currentScope === 'personal' ? 'Pessoal' : 'Empresarial'})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                <input 
                  type="number"
                  value={userSettings.monthlyBudgets?.[currentScope] || ''}
                  onChange={(e) => updateBudget(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-semibold"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Defina um limite para ver sua barra de progresso na tela inicial.
                <br/>
                <span className="opacity-70 font-medium text-slate-500 dark:text-slate-400">
                  (Este ajuste aplica-se apenas ao perfil {currentScope === 'personal' ? 'Pessoal' : 'MV FRIOS'})
                </span>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tema / Aparência</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setUserSettings({...userSettings, theme: 'light'})}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${userSettings.theme === 'light' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}
                >
                  <Sun size={20} />
                  <span>Claro</span>
                </button>
                <button
                  onClick={() => setUserSettings({...userSettings, theme: 'dark'})}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${userSettings.theme === 'dark' ? 'bg-slate-700 border-blue-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}
                >
                  <Moon size={20} />
                  <span>Escuro</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="space-y-6 animate-scale-up">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
               <Calculator size={32} className="mx-auto text-blue-600 dark:text-blue-400 mb-2" />
               <h3 className="font-bold text-blue-800 dark:text-blue-300">Simulador de Saldo</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400">Faça contas rápidas sem salvar no histórico.</p>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Wallet size={14} /> Total Ganho (Receita)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                    <input 
                      type="number" 
                      value={calcIncome}
                      onChange={(e) => setCalcIncome(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-white font-semibold"
                    />
                  </div>
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <TrendingDown size={14} /> Total Gasto (Despesas)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                    <input 
                      type="number" 
                      value={calcExpense}
                      onChange={(e) => setCalcExpense(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-white font-semibold"
                    />
                  </div>
               </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${
              balance >= 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
               <p className={`text-xs font-bold uppercase tracking-widest text-center mb-1 ${
                 balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
               }`}>
                 Resultado (Saldo Restante)
               </p>
               <p className={`text-3xl font-bold text-center ${
                 balance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
               }`}>
                 {formatCurrency(balance)}
               </p>
            </div>

            {/* Tithe Card - Only shows if there is a positive balance */}
            {balance > 0 && (
              <div className="animate-slide-up bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1">
                        <Heart size={12} fill="currentColor" /> Devolução (10%)
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Calculado sobre a sobra</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(titheAmount)}
                      </p>
                  </div>
              </div>
            )}
            
            <button 
              onClick={() => { setCalcIncome(''); setCalcExpense(''); }}
              className="w-full py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Limpar Campos
            </button>
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <div className="space-y-6">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
               <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                 <Save size={18} /> Backup & Segurança
               </h3>
               
               <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 mb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                     <Smartphone size={20} className={userSettings.autoSync ? "animate-pulse" : ""} />
                   </div>
                   <div>
                     <p className="font-medium text-slate-800 dark:text-white text-sm">Monitoramento em Tempo Real</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Salvamento Instantâneo</p>
                   </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input 
                     type="checkbox" 
                     className="sr-only peer"
                     checked={userSettings.autoSync || false}
                     onChange={(e) => setUserSettings({...userSettings, autoSync: e.target.checked})}
                   />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                 </label>
               </div>
               
               <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
                 {userSettings.lastSyncedAt 
                   ? `Último salvamento: ${new Date(userSettings.lastSyncedAt).toLocaleTimeString()}`
                   : 'Dados salvos localmente.'
                 }
               </p>

               <div className="grid grid-cols-1 gap-3">
                 <button 
                   onClick={onExport}
                   className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                 >
                   <Download size={18} />
                   Baixar Arquivo (Backup)
                 </button>
                 
                 <div className="relative">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Upload size={18} />
                      Restaurar de Arquivo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />
                 </div>
               </div>
             </div>
             
             <p className="text-xs text-center text-slate-400">
               Dica: Clique em "Baixar Arquivo" regularmente e salve no seu Google Drive para evitar perda de dados caso perca o celular.
             </p>
          </div>
        )}

        {/* CATEGORIES TAB (Original Logic) */}
        {activeTab === 'categories' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nova Categoria</label>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Farmácia"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
                <button 
                  onClick={handleAdd}
                  disabled={!newCatName.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold uppercase">Escolha um Ícone:</p>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {ICON_KEYS.map(iconKey => (
                  <button
                    key={iconKey}
                    onClick={() => setSelectedIcon(iconKey)}
                    className={`p-2 rounded-lg border flex-shrink-0 transition-all ${
                      selectedIcon === iconKey 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600 text-blue-600 dark:text-blue-400' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <CategoryIcon iconName={iconKey} size={20} />
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold uppercase">Escolha uma cor:</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === color ? 'border-blue-600 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Categorias Atuais</h3>
            <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white" 
                      style={{ backgroundColor: cat.color }} 
                    >
                      <CategoryIcon iconName={cat.icon} size={14} />
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => setDeleteId(cat.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="py-6 text-center border-t border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Finanças Inteligentes</p>
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300 dark:text-slate-600">
          <span>v2.2.0</span>
          <span>•</span>
          <span>Dados atualizados: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-scale-up border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Excluir Categoria?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Você tem certeza que deseja remover esta categoria?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRemove}
                className="flex-1 py-3 rounded-xl text-white font-bold bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CategoryManager;
