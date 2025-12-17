
export enum Difficulty {
  EASY = 'Fácil',
  MEDIUM = 'Médio',
  HARD = 'Difícil'
}

export type DietGoal = 'balanced' | 'low-carb' | 'fit' | 'quick' | 'cheap';

export const DIET_GOALS: Record<DietGoal, string> = {
  'balanced': '🥗 Equilibrado',
  'low-carb': '🥑 Low Carb',
  'fit': '🏋️ Fit & Saudável',
  'quick': '⚡ Rápido (30min)',
  'cheap': '💸 Econômico'
};

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  difficulty: Difficulty;
  calories?: number;
  macros?: {
    protein: string;
    carbs: string;
    fat: string;
  };
}

export interface DayPlan {
  day: string;
  lunch: Recipe;
  dinner: Recipe;
}

export interface WeeklyMenu {
  id: string;
  createdAt: string;
  goal?: string;
  days: DayPlan[];
  shoppingList: string[];
}

export interface UserProfile {
  id: string;
  isPremium: boolean;
  allergies: string[];
  favorites: string[];
  usage?: {
    quickRecipes: number;
    weeklyMenus: number;
  };
}

export enum ViewState {
  HOME = 'HOME',
  FRIDGE = 'FRIDGE',
  WEEKLY_PLAN = 'WEEKLY_PLAN',
  QUICK_RECIPE = 'QUICK_RECIPE',
  SHOPPING_LIST = 'SHOPPING_LIST',
  PREMIUM = 'PREMIUM',
  PROFILE = 'PROFILE',
  RECIPE_DETAILS = 'RECIPE_DETAILS',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  MENU_HISTORY = 'MENU_HISTORY'
}

export interface SubscriptionPlan {
  id: 'monthly' | 'quarterly' | 'annual';
  name: string;
  price: number;
  interval: string;
  savings?: string;
}
