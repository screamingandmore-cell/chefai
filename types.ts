
export enum Difficulty {
  EASY = 'Fácil',
  MEDIUM = 'Médio',
  HARD = 'Difícil'
}

export interface Ingredient {
  name: string;
  quantity?: string;
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
  macros?: {
    protein: string;
    carbs: string;
    fat: string;
  };
  imagePrompt?: string; // Used to generate placeholder or find image
}

export interface DayPlan {
  day: string;
  lunch: Recipe;
  dinner: Recipe;
}

export interface WeeklyMenu {
  id: string;
  createdAt: string;
  days: DayPlan[];
  shoppingList: string[];
}

export interface UserProfile {
  isPremium: boolean;
  allergies: string[];
  favorites: string[]; // recipe IDs
  usage: {
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
  TERMS = 'TERMS'
}

export interface SubscriptionPlan {
  id: 'monthly' | 'quarterly' | 'annual';
  name: string;
  price: number;
  interval: string;
  savings?: string;
}
