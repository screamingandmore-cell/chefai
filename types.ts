
export enum Difficulty {
  EASY = 'Fácil',
  MEDIUM = 'Médio',
  HARD = 'Difícil'
}

export type DietGoal = 'chef_choice' | 'balanced' | 'low-carb' | 'fit' | 'quick' | 'cheap';

export const DIET_GOALS: Record<DietGoal, string> = {
  'chef_choice': '👨‍🍳 A Escolha do Chef',
  'balanced': '🥗 Equilibrado',
  'low-carb': '🥑 Low Carb',
  'fit': '🏋️ Fit & Saudável',
  'quick': '⚡ Rápido (30min)',
  'cheap': '💸 Econômico'
};

// Define the SubscriptionPlan interface used in stripe services
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  savings?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  difficulty: Difficulty;
  calories?: number;
  chefTip?: string;
  error?: string;
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
  email?: string;
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
  QUICK_RECIPE = 'QUICK_RECIPE',
  WEEKLY_PLAN = 'WEEKLY_PLAN',
  RECIPE_DETAILS = 'RECIPE_DETAILS',
  SHOPPING_LIST = 'SHOPPING_LIST',
  PROFILE = 'PROFILE',
  PREMIUM = 'PREMIUM',
  MENU_HISTORY = 'MENU_HISTORY',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY'
}