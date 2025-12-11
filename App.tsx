import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, PieChart as ChartIcon, Settings, Plus, X, 
  Sparkles, List, AlertCircle, TrendingUp, Calendar, Wallet, History as HistoryIcon,
  Building2, User, Paperclip, Image as ImageIcon, CheckCircle, Info, ShieldCheck,
  Eye, Edit2, FileText, Target, ChevronRight
} from 'lucide-react';
import { Category, Expense, Scope, UserSettings } from './types';
import { DEFAULT_CATEGORIES, MV_FRIOS_CATEGORIES, formatCurrency, formatDateTime, formatDate } from './constants';
import SummaryCard from './components/SummaryCard';
import ChartsView from './components/ChartsView';
import CategoryManager from './components/CategoryManager';
import HistoryView from './components/HistoryView';
import CategoryIcon from './components/CategoryIcon';

function App() {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState<'home' | 'charts' | 'history' | 'settings'>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentScope, setCurrentScope] = useState<Scope>('personal');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  // --- Action & Detail Modals State ---
  const [actionModalExpense, setActionModalExpense] = useState<Expense | null>(null);
  const [viewDetailExpense, setViewDetailExpense] = useState<Expense | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // --- User Settings (Theme & Name & AutoSync) ---
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migration logic for old monthlyBudget (number) to new monthlyBudgets (object)
      let budgets = parsed.monthlyBudgets || { personal: 0, business: 0 };
      if (parsed.monthlyBudget && typeof parsed.monthlyBudget === 'number') {
        budgets = { ...budgets, personal: parsed.monthlyBudget };
      }

      return { 
        ...parsed, 
        autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true,
        monthlyBudgets: budgets
      };
    }
    return { 
      name: 'Usuário', 
      theme: 'light', 
      autoSync: true,
      monthlyBudgets: { personal: 0, business: 0 }
    };
  });

  // Apply Theme Effect
  useEffect(() => {
    if (userSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }, [userSettings]);

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Data State ---
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>([]);

  // --- Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effect: Load Categories based on Scope ---
  useEffect(() => {
    const storageKey = `categories_${currentScope}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      const defaults = currentScope === 'business' ? MV_FRIOS_CATEGORIES : DEFAULT_CATEGORIES;
      setCategories(defaults);
    }
  }, [currentScope]);

  // --- Persistence & Instant Sync ---
  const updateLastSynced = () => {
    if (userSettings.autoSync) {
      setUserSettings(prev => ({ ...prev, lastSyncedAt: Date.now() }));
    }
  };

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateLastSynced();
  }, [expenses]);

  useEffect(() => {
    if (categories.length > 0) {
      const storageKey = `categories_${currentScope}`;
      localStorage.setItem(storageKey, JSON.stringify(categories));
      updateLastSynced();
    }
  }, [categories, currentScope]);

  // --- Image Compression Logic ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG 0.6 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setReceiptImage(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Backup & Restore Logic ---
  const handleExportData = () => {
    const data = {
      expenses,
      categories_personal: localStorage.getItem('categories_personal') ? JSON.parse(localStorage.getItem('categories_personal')!) : [],
      categories_business: localStorage.getItem('categories_business') ? JSON.parse(localStorage.getItem('categories_business')!) : [],
      userSettings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'Backup gerado com sucesso!', type: 'success' });
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.expenses) setExpenses(data.expenses);
        if (data.categories_personal) localStorage.setItem('categories_personal', JSON.stringify(data.categories_personal));
        if (data.categories_business) localStorage.setItem('categories_business', JSON.stringify(data.categories_business));
        if (data.userSettings) setUserSettings(data.userSettings);
        
        // Force reload categories for current scope
        const scopeKey = `categories_${currentScope}`;
        if (data[scopeKey]) setCategories(data[scopeKey]);
        
        setToast({ message: 'Dados restaurados com sucesso!', type: 'success' });
      } catch (err) {
        setToast({ message: 'Erro ao ler arquivo de backup.', type: 'error' });
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // --- Derived Data ---
  const scopedExpenses = useMemo(() => {
    return expenses.filter(e => {
      const expScope = e.scope || 'personal';
      return expScope === currentScope;
    });
  }, [expenses, currentScope]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return scopedExpenses.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [scopedExpenses]);

  const totalCurrentMonth = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const lastMonthTotal = useMemo(() => {
     const now = new Date();
     const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
     const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
     return scopedExpenses.filter(e => {
        const d = new Date(e.date + 'T12:00:00');
        return d.getMonth() === lastMonth && d.getFullYear() === year;
     }).reduce((acc, curr) => acc + curr.amount, 0);
  }, [scopedExpenses]);

  const sortedExpenses = useMemo(() => {
    return [...scopedExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [scopedExpenses]);

  // --- Budget Calculations (Independent by Scope) ---
  const budget = userSettings.monthlyBudgets?.[currentScope] || 0;
  const budgetPercentage = budget > 0 ? (totalCurrentMonth / budget) * 100 : 0;
  const budgetRemaining = budget > 0 ? budget - totalCurrentMonth : 0;

  // --- Handlers ---
  const handleScopeChange = (scope: Scope) => {
    setCurrentScope(scope);
    setActiveTab('home');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !description) return;

    const expenseData = {
      amount: parseFloat(amount),
      categoryId,
      date,
      description,
      scope: currentScope,
      receiptImage // Save the base64 string
    };

    if (editingId) {
      setExpenses(prev => prev.map(exp => exp.id === editingId ? { ...exp, ...expenseData } : exp));
      setToast({ message: 'Despesa atualizada!', type: 'success' });
    } else {
      setExpenses([
        { ...expenseData, id: Date.now().toString(), createdAt: Date.now() }, 
        ...expenses
      ]);
      setToast({ message: 'Despesa salva com sucesso!', type: 'success' });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setToast({ message: 'Despesa removida.', type: 'info' });
  }

  const handleEditClick = (expense: Expense) => {
    setEditingId(expense.id);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setCategoryId(expense.categoryId);
    setDate(expense.date);
    setReceiptImage(expense.receiptImage);
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptImage(undefined);
  };

  const renderHome = () => (
    <div key="home-tab" className="space-y-6 pb-24 relative z-10 animate-fade-in-up">
      {/* Header with Scope Switcher */}
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 p-4 -mx-4 -mt-4 mb-2 rounded-b-3xl sticky top-0 z-20 border-b border-white/20 dark:border-slate-700/50 shadow-sm flex flex-col gap-3 transition-colors">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <div className="relative">
                 <div className={`p-1.5 rounded-xl text-white shadow-lg ${currentScope === 'business' ? 'bg-slate-700 shadow-slate-900/20' : 'bg-blue-600 shadow-blue-200 dark:shadow-none'}`}>
                   <Wallet size={20} />
                 </div>
              </div>
              Olá, {userSettings.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wide ml-1">
              {currentScope === 'business' ? 'Controle Empresarial' : 'Finanças Pessoais'}
            </p>
          </div>
          {/* New Elegant Add Button with Text */}
          <button 
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className={`text-white px-5 py-3 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
              currentScope === 'business' 
                ? 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-900/20' 
                : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/40'
            }`}
          >
            <Plus size={20} strokeWidth={3} />
            <span className="font-bold text-sm tracking-wide">Despesa</span>
          </button>
        </div>

        {/* Profile Switcher Tabs */}
        <div className="bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-xl flex relative">
          <button 
            onClick={() => handleScopeChange('personal')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all relative z-10 active:scale-95 ${currentScope === 'personal' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <User size={16} />
            Pessoal
          </button>
          <button 
            onClick={() => handleScopeChange('business')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all relative z-10 active:scale-95 ${currentScope === 'business' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Building2 size={16} />
            MV FRIOS
          </button>
        </div>
      </div>

      {/* DISCREET SAFETY BADGE - ALIGNED RIGHT */}
      <div className="flex justify-end mb-1 px-1">
        <div className="flex items-center gap-1.5 opacity-80 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Salvo no Celular
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

      {/* Monthly Budget Card */}
      {budget > 0 ? (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 transition-colors hover:shadow-md hover:-translate-y-0.5 duration-300">
           <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2">
               <Target size={16} className={budgetPercentage > 100 ? "text-red-500" : budgetPercentage > 75 ? "text-amber-500" : "text-emerald-500"} />
               <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Meta {currentScope === 'business' ? 'Empresarial' : 'Pessoal'}
               </span>
             </div>
             <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
               {budgetPercentage.toFixed(0)}%
             </span>
           </div>
           
           <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ${
                 budgetPercentage > 100 ? 'bg-red-500' : 
                 budgetPercentage > 75 ? 'bg-amber-500' : 
                 'bg-emerald-500'
               }`}
               style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
             />
           </div>

           <div className="flex justify-between items-end">
             <div>
               <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Limite</p>
               <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(budget)}</p>
             </div>
             <div className="text-right">
               <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">
                 {budgetRemaining >= 0 ? 'Restante' : 'Excedido'}
               </p>
               <p className={`text-sm font-bold ${budgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                 {formatCurrency(Math.abs(budgetRemaining))}
               </p>
             </div>
           </div>
        </div>
      ) : (
        <div 
          onClick={() => setActiveTab('settings')}
          className="bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-800 p-4 rounded-2xl shadow-sm border border-dashed border-blue-200 dark:border-slate-600 mb-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                 <Target size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                    Definir Meta {currentScope === 'business' ? 'Empresarial' : 'Pessoal'}
                 </h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Controle seu orçamento mensal</p>
               </div>
             </div>
             <ChevronRight size={18} className="text-slate-400" />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        <SummaryCard 
          title="Gasto este Mês" 
          amount={totalCurrentMonth} 
          icon={<Wallet size={24} />} 
          colorClass={currentScope === 'business' ? "bg-slate-800" : "bg-blue-600"}
        />
         <div className="grid grid-cols-2 gap-4">
            <SummaryCard 
            title="Mês Anterior" 
            amount={lastMonthTotal} 
            icon={<Calendar size={20} />} 
            colorClass="bg-slate-500" 
            />
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-4 rounded-xl shadow-sm border border-white/50 dark:border-slate-700 flex flex-col justify-center hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="text-xs text-slate-400 font-medium uppercase">Média Diária</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                    {formatCurrency(totalCurrentMonth / new Date().getDate())}
                </p>
            </div>
         </div>
      </div>

      {/* Recent List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <List size={20} className={currentScope === 'business' ? "text-slate-800 dark:text-slate-400" : "text-blue-600 dark:text-blue-400"} />
              Recentes
          </h2>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`text-xs font-medium ${currentScope === 'business' ? "text-slate-800 dark:text-slate-300" : "text-blue-600 dark:text-blue-400"} active:scale-95 transition-transform`}
          >
            Ver tudo
          </button>
        </div>
        
        {sortedExpenses.length === 0 ? (
          <div className="text-center py-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <AlertCircle size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400">Nenhuma despesa registrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedExpenses.slice(0, 5).map((expense, index) => {
              const category = categories.find(c => c.id === expense.categoryId);
              return (
                <div 
                  key={expense.id} 
                  onClick={() => setActionModalExpense(expense)} 
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className="stagger-enter cursor-pointer bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 dark:border-slate-700 flex justify-between items-center transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md" 
                      style={{ backgroundColor: category?.color || '#cbd5e1' }}
                    >
                      <CategoryIcon iconName={category?.icon} size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{expense.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {category?.name} • 
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{formatDateTime(expense.createdAt)}</span>
                        {expense.receiptImage && <Paperclip size={10} className="text-slate-400" />}
                      </p>
                    </div>
                  </div>
                  <div className='flex flex-col items-end'>
                    <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-100 dark:bg-slate-950 flex justify-center transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg border ${
            toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 
            toast.type === 'error' ? 'bg-red-500 border-red-400 text-white' : 
            'bg-slate-800 border-slate-700 text-white'
          }`}>
             {toast.type === 'success' && <CheckCircle size={16} />}
             {toast.type === 'info' && <Info size={16} />}
             {toast.type === 'error' && <AlertCircle size={16} />}
             <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Container Principal Mobile-First Centrado */}
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-900 shadow-2xl overflow-hidden sm:min-h-screen transition-colors duration-300">
        
        {/* Background Layer - Finance Theme */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-15 dark:opacity-5"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000')", 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(120%)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 z-0 pointer-events-none bg-gradient-to-b via-slate-50/80 dark:via-slate-900/80 to-slate-100/90 dark:to-slate-900/95 ${currentScope === 'business' ? 'from-slate-200/90 dark:from-slate-800/90' : 'from-slate-50/90 dark:from-slate-900/90'}`} />

        {/* Main Content Area */}
        <main className="flex-1 p-5 overflow-y-auto scrollbar-hide relative z-10">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'charts' && (
             <div key="charts-tab" className="animate-fade-in-up">
                <ChartsView expenses={scopedExpenses} categories={categories} />
             </div>
          )}
          {activeTab === 'history' && (
             <div key="history-tab" className="animate-fade-in-up">
                <HistoryView 
                  expenses={scopedExpenses} 
                  categories={categories} 
                  onDelete={handleDeleteExpense} 
                  onEdit={handleEditClick}
                  onBack={() => setActiveTab('home')}
                />
             </div>
          )}
          {activeTab === 'settings' && (
             <div key="settings-tab" className="animate-fade-in-up">
                <CategoryManager 
                  categories={categories} 
                  setCategories={setCategories} 
                  userSettings={userSettings}
                  setUserSettings={setUserSettings}
                  onExport={handleExportData}
                  onImport={handleImportData}
                  currentScope={currentScope}
                />
             </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex justify-around items-center z-30 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 active:scale-90 ${activeTab === 'home' ? (currentScope === 'business' ? 'text-slate-800 dark:text-slate-200' : 'text-blue-600 dark:text-blue-400 scale-105') : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Início</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('charts')}
            className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 active:scale-90 ${activeTab === 'charts' ? (currentScope === 'business' ? 'text-slate-800 dark:text-slate-200' : 'text-blue-600 dark:text-blue-400 scale-105') : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <TrendingUp size={24} strokeWidth={activeTab === 'charts' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Gráficos</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 active:scale-90 ${activeTab === 'history' ? (currentScope === 'business' ? 'text-slate-800 dark:text-slate-200' : 'text-blue-600 dark:text-blue-400 scale-105') : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <HistoryIcon size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Histórico</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 active:scale-90 ${activeTab === 'settings' ? (currentScope === 'business' ? 'text-slate-800 dark:text-slate-200' : 'text-blue-600 dark:text-blue-400 scale-105') : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Ajustes</span>
          </button>
        </nav>

        {/* CHOICE MODAL (Edit or View Details) */}
        {actionModalExpense && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-pop border border-slate-100 dark:border-slate-700">
               <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 text-center">Opções</h3>
               <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
                 O que deseja fazer com este registro?
               </p>
               
               <div className="grid gap-3">
                 <button 
                   onClick={() => {
                     setViewDetailExpense(actionModalExpense);
                     setActionModalExpense(null);
                   }}
                   className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
                 >
                   <Eye size={20} />
                   Ver Detalhes
                 </button>
                 
                 <button 
                   onClick={() => {
                     handleEditClick(actionModalExpense);
                     setActionModalExpense(null);
                   }}
                   className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-colors active:scale-95"
                 >
                   <Edit2 size={20} />
                   Editar / Alterar
                 </button>
                 
                 <button 
                    onClick={() => setActionModalExpense(null)}
                    className="mt-2 text-slate-400 dark:text-slate-500 text-sm font-medium p-2 active:scale-95"
                 >
                   Cancelar
                 </button>
               </div>
             </div>
          </div>
        )}

        {/* VIEW DETAILS MODAL */}
        {viewDetailExpense && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl animate-pop border border-slate-100 dark:border-slate-700 overflow-hidden relative max-h-[90vh] overflow-y-auto">
              
              {/* Header with Color */}
              <div 
                className="h-24 w-full flex items-center justify-center relative transition-all"
                style={{ backgroundColor: categories.find(c => c.id === viewDetailExpense.categoryId)?.color || '#94a3b8' }}
              >
                 <button 
                    onClick={() => setViewDetailExpense(null)}
                    className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/30 transition-colors active:scale-90"
                 >
                   <X size={20} />
                 </button>
                 <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg translate-y-8 animate-pop">
                    <CategoryIcon 
                      iconName={categories.find(c => c.id === viewDetailExpense.categoryId)?.icon} 
                      size={32} 
                      className="text-slate-700 dark:text-slate-200"
                    />
                 </div>
              </div>

              <div className="pt-12 pb-6 px-6 text-center">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                   {viewDetailExpense.description}
                 </h2>
                 <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                   {categories.find(c => c.id === viewDetailExpense.categoryId)?.name}
                 </p>
                 
                 <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Valor Total</p>
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">
                      {formatCurrency(viewDetailExpense.amount)}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                    <div className="text-left p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                       <div className="flex items-center gap-2 mb-1 text-slate-400 dark:text-slate-500">
                          <Calendar size={14} />
                          <span className="text-xs font-bold uppercase">Data</span>
                       </div>
                       <p className="font-semibold text-slate-700 dark:text-slate-200">
                         {formatDate(viewDetailExpense.date)}
                       </p>
                    </div>
                    <div className="text-left p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                       <div className="flex items-center gap-2 mb-1 text-slate-400 dark:text-slate-500">
                          <FileText size={14} />
                          <span className="text-xs font-bold uppercase">Registro</span>
                       </div>
                       <p className="font-semibold text-slate-700 dark:text-slate-200">
                         {formatDateTime(viewDetailExpense.createdAt)}
                       </p>
                    </div>
                 </div>

                 {viewDetailExpense.receiptImage ? (
                   <div 
                      className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: '0.3s' }}
                      onClick={() => setFullScreenImage(viewDetailExpense.receiptImage || null)}
                   >
                      <img src={viewDetailExpense.receiptImage} alt="Comprovante" className="w-full h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="text-white flex items-center gap-2 font-bold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                           <Eye size={16} /> Ver Ampliado
                         </div>
                      </div>
                   </div>
                 ) : (
                    <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                       <ImageIcon size={24} />
                       <span className="text-xs">Sem comprovante anexado</span>
                    </div>
                 )}
              </div>
            </div>
          </div>
        )}
        
        {/* FULL SCREEN IMAGE VIEWER (Reused logic) */}
        {fullScreenImage && (
           <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 animate-scale-up" onClick={() => setFullScreenImage(null)}>
             <button 
               className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-transform"
               onClick={() => setFullScreenImage(null)}
             >
               <X size={24} />
             </button>
             <img src={fullScreenImage} alt="Comprovante Full" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
           </div>
        )}

        {/* Add/Edit Expense Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-850 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative transition-colors duration-300 max-h-[90vh] overflow-y-auto">
               <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full sm:hidden" />
              
              <div className="flex justify-between items-center mb-6 mt-2 sm:mt-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex flex-col">
                  <span>{editingId ? 'Editar Despesa' : 'Nova Despesa'}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-normal uppercase">
                    Conta: {currentScope === 'business' ? 'MV FRIOS' : 'Pessoal'}
                  </span>
                </h2>
                <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-90">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Valor</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0,00"
                      className={`w-full text-3xl font-bold text-slate-800 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 outline-none py-2 pl-8 bg-transparent transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600 ${currentScope === 'business' ? 'focus:border-slate-800' : 'focus:border-blue-600'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Descrição</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="O que você comprou?"
                    className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 ${currentScope === 'business' ? 'focus:ring-slate-500' : 'focus:ring-blue-500'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Data</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 text-sm text-slate-800 dark:text-slate-200 ${currentScope === 'business' ? 'focus:ring-slate-500' : 'focus:ring-blue-500'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Categoria</label>
                    <select 
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 text-sm text-slate-800 dark:text-slate-200 ${currentScope === 'business' ? 'focus:ring-slate-500' : 'focus:ring-blue-500'}`}
                    >
                      <option value="">Selecione</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Comprovante / Foto</label>
                   <div className="flex items-center gap-3">
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-95"
                     >
                       <Paperclip size={18} />
                       {receiptImage ? 'Trocar Imagem' : 'Anexar Imagem'}
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                     />
                     {receiptImage && (
                       <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 relative group animate-pop">
                         <img src={receiptImage} alt="Preview" className="h-full w-full object-cover" />
                         <button 
                            type="button"
                            onClick={(e) => {e.preventDefault(); setReceiptImage(undefined)}}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           <X size={14} />
                         </button>
                       </div>
                     )}
                   </div>
                </div>

                <button 
                  type="submit"
                  className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] mt-6 flex items-center justify-center gap-2 ${currentScope === 'business' ? 'bg-slate-800 shadow-slate-300 dark:shadow-none hover:bg-slate-900' : 'bg-blue-600 shadow-blue-200 dark:shadow-none hover:bg-blue-700'}`}
                >
                  {editingId ? <Edit2 size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                  {editingId ? 'Atualizar' : 'Salvar Despesa'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slide-down {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

export default App;