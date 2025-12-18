
import { createClient } from '@supabase/supabase-js';
import { UserProfile, WeeklyMenu } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'missing-key'
);

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
  if (error) throw new Error(`Erro ao excluir conta: ${error.message}`);
  await signOut();
};

export const getUserSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: newData, error: insertError } = await supabase
      .from('profiles')
      .insert({ 
        id: userId,
        email: sessionData.session?.user?.email 
      })
      .select()
      .single();
    
    if (insertError) {
      return {
        id: userId,
        isPremium: false,
        allergies: [],
        favorites: [],
        usage: { quickRecipes: 0, weeklyMenus: 0 }
      };
    }
    data = newData;
  }

  return {
    id: data.id,
    email: data.email,
    isPremium: data.is_premium,
    allergies: data.allergies || [],
    favorites: data.favorites || [],
    usage: {
      quickRecipes: data.usage_quick_recipes || 0,
      weeklyMenus: data.usage_weekly_menus || 0
    }
  };
};

export const updatePreferences = async (userId: string, allergies: string[]): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ allergies })
    .eq('id', userId);

  if (error) throw error;
};

export const saveWeeklyMenu = async (userId: string, menu: WeeklyMenu): Promise<WeeklyMenu> => {
  const menuId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const menuData = {
    days: menu.days,
    shoppingList: menu.shoppingList,
    goal: menu.goal,
    id: menuId,
    createdAt: createdAt
  };

  const { data, error } = await supabase
    .from('weekly_menus')
    .insert({
      id: menuId,
      user_id: userId,
      data: menuData,
      created_at: createdAt
    })
    .select()
    .single();
    
  if (error) throw new Error(error.message);

  await supabase.rpc('increment_usage_weekly', { user_id: userId });

  return {
    ...data.data,
    id: data.id,
    createdAt: data.created_at
  };
};

export const getWeeklyMenus = async (userId: string): Promise<WeeklyMenu[]> => {
  const { data, error } = await supabase
    .from('weekly_menus')
    .select('id, data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  
  return data.map(row => ({
    ...row.data,
    id: row.id,
    createdAt: row.created_at
  }));
};

export const deleteWeeklyMenu = async (menuId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('weekly_menus')
    .delete()
    .eq('id', menuId)
    .eq('user_id', userId);

  if (error) throw error;
};
