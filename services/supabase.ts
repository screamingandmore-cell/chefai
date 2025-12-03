import { createClient } from '@supabase/supabase-js';
import { UserProfile, WeeklyMenu } from "../types";

// Tenta ler do Vite (import.meta.env) ou do process.env (fallback)
// Se não encontrar, usa valores dummy para evitar que o app trave com "supabaseUrl is required"
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Apenas avisa no console, mas permite o app carregar para mostrar a UI de erro amigável se necessário
if (supabaseUrl === 'https://placeholder-url.supabase.co') {
  console.warn("⚠️ Supabase não configurado no .env. O login não funcionará.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/* 
  ESTRUTURA SUGERIDA NO SUPABASE:
  Table: profiles
  - id (uuid, references auth.users)
  - email (text)
  - is_premium (boolean)
  - allergies (text array)
  - favorites (text array)
  - usage_quick_recipes (int)
  - usage_weekly_menus (int)

  Table: weekly_menus
  - id (uuid)
  - user_id (uuid, references profiles.id)
  - created_at (timestamp)
  - data (jsonb)
*/

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;

  // Cria perfil inicial se o cadastro for bem sucedido
  if (data.user) {
    await supabase.from('profiles').insert([
      { 
        id: data.user.id,
        email: email,
        is_premium: false,
        usage_quick_recipes: 0,
        usage_weekly_menus: 0,
        allergies: [],
        favorites: []
      }
    ]);
  }
  
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getUserSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    // Fallback caso o perfil não exista (erro de sync)
    const defaultProfile: UserProfile = {
      isPremium: false,
      allergies: [],
      favorites: [],
      usage: { quickRecipes: 0, weeklyMenus: 0 }
    };
    return defaultProfile;
  }

  // Mapeia colunas do DB para o tipo UserProfile
  return {
    isPremium: data.is_premium,
    allergies: data.allergies || [],
    favorites: data.favorites || [],
    usage: {
      quickRecipes: data.usage_quick_recipes || 0,
      weeklyMenus: data.usage_weekly_menus || 0
    }
  };
};

export const updateUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_premium: profile.isPremium,
      allergies: profile.allergies,
      favorites: profile.favorites,
      usage_quick_recipes: profile.usage.quickRecipes,
      usage_weekly_menus: profile.usage.weeklyMenus
    })
    .eq('id', userId);

  if (error) console.error("Error updating profile:", error);
};

export const incrementUsage = async (userId: string, type: 'quickRecipes' | 'weeklyMenus'): Promise<UserProfile> => {
  const profile = await getUserProfile(userId);
  profile.usage[type] += 1;
  await updateUserProfile(userId, profile);
  return profile;
};

export const saveWeeklyMenu = async (userId: string, menu: WeeklyMenu): Promise<void> => {
  const { error } = await supabase
    .from('weekly_menus')
    .insert([
      {
        user_id: userId,
        data: menu,
        created_at: new Date().toISOString()
      }
    ]);
    
  if (error) console.error("Error saving menu:", error);
};

export const getWeeklyMenus = async (userId: string): Promise<WeeklyMenu[]> => {
  const { data, error } = await supabase
    .from('weekly_menus')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(row => row.data); // Extrai o JSON armazenado
};