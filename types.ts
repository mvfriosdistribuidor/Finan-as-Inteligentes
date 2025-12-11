export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export type Scope = 'personal' | 'business';

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: string; // ISO string YYYY-MM-DD
  description: string;
  createdAt: number;
  scope?: Scope; // 'personal' is default for legacy data
  receiptImage?: string; // Base64 string for compressed image
}

export type Period = string;

export interface SmartParseResult {
  amount?: number;
  categoryName?: string;
  description?: string;
  date?: string;
}

export type Theme = 'light' | 'dark';

export interface UserSettings {
  name: string;
  theme: Theme;
  autoSync?: boolean;
  lastSyncedAt?: number;
  monthlyBudgets?: {
    personal: number;
    business: number;
  }; 
}