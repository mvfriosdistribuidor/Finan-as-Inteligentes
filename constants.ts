import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Restaurante', color: '#F97316', icon: 'utensils' }, // Orange
  { id: '2', name: 'Gasolina Carro', color: '#EF4444', icon: 'car' }, // Red
  { id: '3', name: 'Gasolina Moto', color: '#8B5CF6', icon: 'bike' }, // Violet
  { id: '4', name: 'Mercado', color: '#10B981', icon: 'shopping-cart' }, // Emerald
  { id: '5', name: 'Lazer', color: '#3B82F6', icon: 'gamepad-2' }, // Blue
  // Removido Contas Fixas (id 6)
  { id: '7', name: 'Internet', color: '#06B6D4', icon: 'wifi' }, // Cyan
  { id: '8', name: 'Energia', color: '#F59E0B', icon: 'zap' }, // Amber
  
  // Novas Categorias
  { id: '9', name: 'Farmácia', color: '#E11D48', icon: 'pill' }, // Rose
  { id: '10', name: 'Hospital', color: '#DC2626', icon: 'activity' }, // Red Darker
  { id: '11', name: 'Loja', color: '#4F46E5', icon: 'store' }, // Indigo
  { id: '12', name: 'Compra Online', color: '#8B5CF6', icon: 'globe' }, // Violet
  { id: '13', name: 'Construção', color: '#EA580C', icon: 'hammer' }, // Orange Darker
  { id: '14', name: 'Manutenção', color: '#65A30D', icon: 'wrench' }, // Lime
  { id: '15', name: 'Vestuário', color: '#DB2777', icon: 'shirt' }, // Pink
  { id: '16', name: 'Crédito Celular', color: '#0891B2', icon: 'smartphone' }, // Cyan Darker
  
  // Adicionadas recentemente
  { id: '17', name: 'Lava Jato', color: '#0EA5E9', icon: 'droplets' }, // Sky Blue
  { id: '18', name: 'Serviços', color: '#64748B', icon: 'briefcase' }, // Slate
  { id: '19', name: 'Viagem', color: '#14B8A6', icon: 'plane' }, // Teal
];

export const MV_FRIOS_CATEGORIES: Category[] = [
  { id: 'mv_1', name: 'Gasolina Carro', color: '#EF4444', icon: 'car' },
  { id: 'mv_2', name: 'Gasolina Moto', color: '#8B5CF6', icon: 'bike' },
  { id: 'mv_3', name: 'Fretes SP', color: '#3B82F6', icon: 'truck' }, // Blue
  { id: 'mv_4', name: 'Outros Fretes', color: '#64748B', icon: 'truck' }, // Slate
  { id: 'mv_5', name: 'Insumos / Embalagens', color: '#F59E0B', icon: 'package' }, // Amber
  { id: 'mv_6', name: 'Funcionários', color: '#10B981', icon: 'users' }, // Emerald
  { id: 'mv_7', name: 'Manutenção', color: '#F43F5E', icon: 'zap' }, // Rose
  { id: 'mv_8', name: 'Energia', color: '#F59E0B', icon: 'zap' }, // Amber
];

export const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', 
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', 
  '#F43F5E', '#64748B', '#78350F', '#111827',
  '#E11D48', '#DC2626', '#4F46E5', '#EA580C', '#65A30D', '#DB2777', '#0891B2',
  '#0EA5E9'
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date locally to avoid timezone issues
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
};

export const formatDateTime = (timestamp: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};