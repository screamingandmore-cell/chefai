
import { createClient } from '@supabase/supabase-js';
import { UserProfile, WeeklyMenu } from "../types";

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const deleteAccount = async (): Promise<void> => {
  const { error } = await supabase.rpc('delete_user');
  if (error) throw new Error(`Erro ao excluir: ${error.message}`);
  await supabase.auth.signOut();
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
    return {
      id: userId,
      isPremium: false,
      allergies: [],
      favorites: [],
      usage: { quickRecipes: 0, weeklyMenus: 0 }
    };
  }

  return {
    id: data.id,
    isPremium: data.is_premium,
    allergies: data.allergies || [],
    favorites: data.favorites || [],
    usage: {
      quickRecipes: data.usage_quick_recipes || 0,
      weeklyMenus: data.usage_weekly_menus || 0
    }
  };
};

/**
 * IMPORTANTE: No novo fluxo de segurança, atualizações de perfil críticas (Premium/Cotas) 
 * são feitas apenas pelo servidor (Edge Functions).
 * Aqui permitimos apenas edição de preferências.
 */
export const updatePreferences = async (userId: string, allergies: string[]): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ allergies })
    .eq('id', userId);

  if (error) throw error;
};

export const saveWeeklyMenu = async (userId: string, menu: WeeklyMenu): Promise<void> => {
  const { error } = await supabase
    .from('weekly_menus')
    .insert([{ id: menu.id, user_id: userId, data: menu }]);
    
  if (error) throw error;
};

export const deleteWeeklyMenu = async (menuId: string, userId: string): Promise<void> => {
  // Passamos o userId para garantir que o RLS e a query sejam restritivos
  const { error } = await supabase
    .from('weekly_menus')
    .delete()
    .eq('id', menuId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const getWeeklyMenus = async (userId: string): Promise<WeeklyMenu[]> => {
  const { data, error } = await supabase
    .from('weekly_menus')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(row => row.data);
};
