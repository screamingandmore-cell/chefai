
import { createClient } from '@supabase/supabase-js';
import { UserProfile, WeeklyMenu } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

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
    const defaultProfile: UserProfile = {
      isPremium: false,
      allergies: [],
      favorites: [],
      usage: { quickRecipes: 0, weeklyMenus: 0 }
    };
    return defaultProfile;
  }

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
        id: menu.id,
        user_id: userId,
        data: menu,
        created_at: new Date().toISOString()
      }
    ]);
    
  if (error) console.error("Error saving menu:", error);
};

export const deleteWeeklyMenu = async (menuId: string): Promise<void> => {
  const { error } = await supabase
    .from('weekly_menus')
    .delete()
    .eq('id', menuId);

  if (error) {
    console.error("Erro ao deletar:", error);
    throw new Error(error.message);
  }
};

export const deleteAllUserMenus = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('weekly_menus')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Erro ao limpar histórico: ${error.message}`);
  }
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
