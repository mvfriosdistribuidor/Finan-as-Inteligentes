import React from 'react';
import { formatCurrency } from '../constants';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, colorClass }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(amount)}</h3>
      </div>
      <div className={`p-3 rounded-full ${colorClass} text-white shadow-sm`}>
        {icon}
      </div>
    </div>
  );
};

export default SummaryCard;