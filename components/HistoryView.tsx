import React, { useState, useMemo } from 'react';
import { Expense, Category } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../constants';
import { Search, Trash2, Edit2, Calendar, AlertCircle, Image as ImageIcon, X, ArrowLeft, Filter, Repeat } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

interface HistoryViewProps {
  expenses: Expense[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ expenses, categories, onDelete, onEdit, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  // Filtrar e Ordenar
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    // Zerar horas de 'now' para comparações de datas justas se necessário,
    // mas para filtros como "Hoje", comparar dia/mês/ano é mais seguro.
    
    return expenses
      .filter(exp => {
        // Filtro de Texto
        const cat = categories.find(c => c.id === exp.categoryId);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          exp.description.toLowerCase().includes(searchLower) ||
          (cat?.name || '').toLowerCase().includes(searchLower) ||
          formatCurrency(exp.amount).includes(searchLower)
        );

        if (!matchesSearch) return false;

        // Filtro de Tempo
        if (timeFilter === 'all') return true;

        // Converter string YYYY-MM-DD para Date (00:00:00 Local)
        const [y, m, d] = exp.date.split('-').map(Number);
        const expDate = new Date(y, m - 1, d);

        if (timeFilter === 'today') {
           return expDate.getDate() === now.getDate() && 
                  expDate.getMonth() === now.getMonth() && 
                  expDate.getFullYear() === now.getFullYear();
        }

        if (timeFilter === 'week') {
           const sevenDaysAgo = new Date();
           sevenDaysAgo.setDate(now.getDate() - 7);
           sevenDaysAgo.setHours(0, 0, 0, 0); // Começo do dia de 7 dias atrás
           
           // expDate já é 00:00:00. 
           // Garantimos que pegamos desde o começo do dia de 7 dias atrás até o "agora"
           return expDate.getTime() >= sevenDaysAgo.getTime();
        }

        if (timeFilter === 'month') {
           return expDate.getMonth() === now.getMonth() && 
                  expDate.getFullYear() === now.getFullYear();
        }

        if (timeFilter === 'year') {
           return expDate.getFullYear() === now.getFullYear();
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, categories, searchTerm, timeFilter]);

  // Agrupar por data
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    filteredExpenses.forEach(exp => {
      if (!groups[exp.date]) {
        groups[exp.date] = [];
      }
      groups[exp.date].push(exp);
    });
    return groups;
  }, [filteredExpenses]);

  // Calcular contagem de uso da categoria por mês
  const categoryCountsPerMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Usamos 'expenses' completo (sem filtro de busca/tempo) para a contagem ser precisa no contexto geral
    expenses.forEach(exp => {
      // Chave: YYYY-MM_CategoryId
      const monthKey = exp.date.substring(0, 7); 
      const uniqueKey = `${monthKey}_${exp.categoryId}`;
      counts[uniqueKey] = (counts[uniqueKey] || 0) + 1;
    });

    return counts;
  }, [expenses]);

  return (
    <div className="space-y-4 pb-24">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-700 transition-colors active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
            Histórico Completo
          </h2>
        </div>
        
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, categoria ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Time Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'today', label: 'Hoje' },
            { id: 'week', label: '7 Dias' },
            { id: 'month', label: 'Este Mês' },
            { id: 'year', label: 'Este Ano' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTimeFilter(opt.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 ${
                timeFilter === opt.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {Object.keys(groupedExpenses).length === 0 ? (
           <div className="text-center py-12 opacity-60 animate-fade-in-up">
             <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
             <p className="text-slate-500 dark:text-slate-400">Nenhum registro encontrado para este período.</p>
           </div>
        ) : (
          Object.keys(groupedExpenses).map((dateKey, groupIndex) => (
            <div key={dateKey} className="stagger-enter" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-200/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                  {formatDate(dateKey)}
                </span>
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
                {groupedExpenses[dateKey].map((expense, index) => {
                  const category = categories.find(c => c.id === expense.categoryId);
                  
                  // Recuperar contagem do mês
                  const monthKey = expense.date.substring(0, 7);
                  const countKey = `${monthKey}_${expense.categoryId}`;
                  const monthlyCount = categoryCountsPerMonth[countKey] || 0;

                  return (
                    <div 
                      key={expense.id} 
                      className={`p-4 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        index !== groupedExpenses[dateKey].length - 1 ? 'border-b border-slate-50 dark:border-slate-700' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm mt-1" 
                          style={{ backgroundColor: category?.color || '#cbd5e1' }}
                        >
                          <CategoryIcon iconName={category?.icon} size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 dark:text-white text-sm break-words leading-tight">{expense.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{category?.name}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{formatDateTime(expense.createdAt)}</span>
                            
                            {/* Contador Mensal - Agora em uma linha flexível */}
                            {monthlyCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 whitespace-nowrap">
                                   <Repeat size={8} />
                                   {monthlyCount}x no mês
                                </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 pl-2">
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          {expense.receiptImage && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewImage(expense.receiptImage || null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors active:scale-90"
                            >
                              <ImageIcon size={16} />
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(expense);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors active:scale-90"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(expense.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors active:scale-90"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-pop border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Excluir Registro?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Você está prestes a remover este gasto. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (itemToDelete) onDelete(itemToDelete);
                  setItemToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl text-white font-bold bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-colors text-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 size={18} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-pop" onClick={() => setViewImage(null)}>
          <button 
            className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full active:scale-90"
            onClick={() => setViewImage(null)}
          >
            <X size={24} />
          </button>
          <img src={viewImage} alt="Comprovante" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style>{`
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HistoryView;