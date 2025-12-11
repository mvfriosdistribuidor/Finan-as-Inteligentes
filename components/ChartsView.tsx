import React, { useMemo, useState, useEffect } from 'react';
import { Expense, Category, Period } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Calendar, Filter, Check, BarChart2 } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

interface ChartsViewProps {
  expenses: Expense[];
  categories: Category[];
}

const ChartsView: React.FC<ChartsViewProps> = ({ expenses, categories }) => {
  const [period, setPeriod] = useState<Period>('last_30_days');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryIds.length === 0) {
      setSelectedCategoryIds(categories.map(c => c.id));
    }
  }, [categories]);

  const availableYears = useMemo(() => {
    const years = new Set(expenses.map(e => e.date.split('-')[0]));
    return Array.from(years).sort().reverse();
  }, [expenses]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map(c => c.id));
    }
  };

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    const timeFiltered = expenses.filter(exp => {
      const [y, m, d] = exp.date.split('-').map(Number);
      const expDate = new Date(y, m - 1, d);

      if (period === 'today') {
        const today = new Date();
        return expDate.getDate() === today.getDate() && 
               expDate.getMonth() === today.getMonth() && 
               expDate.getFullYear() === today.getFullYear();
      } 
      else if (period === 'last_7_days') {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - 7);
        return expDate >= targetDate && expDate <= now;
      } 
      else if (period === 'last_30_days') {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - 30);
        return expDate >= targetDate && expDate <= now;
      } 
      else if (period === 'this_year') {
        return expDate.getFullYear() === now.getFullYear();
      }
      else if (period === 'last_12_months') {
        const targetDate = new Date(now);
        targetDate.setFullYear(now.getFullYear() - 1);
        return expDate >= targetDate && expDate <= now;
      } 
      else if (period.startsWith('year_')) {
        const year = parseInt(period.split('_')[1]);
        return expDate.getFullYear() === year;
      }
      return true;
    });

    return timeFiltered.filter(exp => selectedCategoryIds.includes(exp.categoryId));

  }, [expenses, period, selectedCategoryIds]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      if (!data[exp.categoryId]) data[exp.categoryId] = 0;
      data[exp.categoryId] += exp.amount;
    });

    const total = Object.values(data).reduce((acc, curr) => acc + curr, 0);

    return Object.keys(data)
      .map(catId => {
        const category = categories.find(c => c.id === catId);
        const value = data[catId];
        return {
          id: catId,
          name: category?.name || 'Desconhecido',
          value: value,
          color: category?.color || '#cbd5e1',
          icon: category?.icon,
          percentage: total > 0 ? (value / total) * 100 : 0
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, categories]);

  const timeData = useMemo(() => {
    const data: Record<string, number> = {};
    const isLongPeriod = period === 'last_12_months' || period === 'this_year' || period.startsWith('year_');

    filteredExpenses.forEach(exp => {
      let key = exp.date;
      if (isLongPeriod) {
        key = exp.date.substring(0, 7); // Agrupa por YYYY-MM
      }
      if (!data[key]) data[key] = 0;
      data[key] += exp.amount;
    });

    return Object.keys(data).sort().map(dateKey => {
      let label = dateKey;
      if (isLongPeriod) {
        const [y, m] = dateKey.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
        label = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      } else {
        label = formatDate(dateKey).slice(0, 5);
      }
      return {
        date: label,
        fullDate: dateKey,
        total: data[dateKey]
      };
    });
  }, [filteredExpenses, period]);

  const totalPeriod = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Controls Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 sticky top-0 z-10 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Filter size={20} className="text-blue-600 dark:text-blue-400" />
            Análise
          </h2>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 outline-none max-w-[180px]"
          >
            <optgroup label="Períodos Curtos">
              <option value="today">Hoje</option>
              <option value="last_7_days">Últimos 7 dias</option>
              <option value="last_30_days">Últimos 30 dias</option>
            </optgroup>
            <optgroup label="Longo Prazo">
              <option value="this_year">Este Ano (Completo)</option>
              <option value="last_12_months">Últimos 12 meses</option>
            </optgroup>
            {availableYears.length > 0 && (
              <optgroup label="Histórico por Ano">
                {availableYears.map(year => (
                  <option key={year} value={`year_${year}`}>Ano {year}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtrar Categorias</span>
            <button 
              onClick={toggleAll}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              {selectedCategoryIds.length === categories.length ? 'Desmarcar Todas' : 'Marcar Todas'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
            {categories.map(cat => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isSelected 
                      ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                  style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                  <CategoryIcon iconName={cat.icon} size={12} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Total Selecionado</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalPeriod)}</p>
        </div>
      </div>

      {/* Charts Grid - Adjusted for side-by-side and smaller size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 text-center uppercase tracking-wide">Distribuição</h3>
          <div className="h-52 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)} 
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                Sem dados
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 text-center uppercase tracking-wide flex items-center justify-center gap-1">
            <Calendar size={14} />
            Evolução
          </h3>
          <div className="h-52 w-full">
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#94a3b8' }} 
                    dy={5}
                    interval={timeData.length > 10 ? 'preserveStartEnd' : 0} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                    itemStyle={{ color: '#1e293b' }}
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                  />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={timeData.length > 15 ? 10 : 28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                Sem dados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-600 dark:text-blue-400" />
            Comparativo de Gastos
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {categoryData.length > 0 ? (
            categoryData.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" 
                      style={{ backgroundColor: item.color }} 
                    >
                      <CategoryIcon iconName={item.icon} size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{item.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-400">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                {/* Progress Bar Comparison */}
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color 
                    }} 
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Nenhuma categoria selecionada ou sem dados para este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartsView;