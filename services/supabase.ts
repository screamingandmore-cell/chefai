
import { createClient } from '@supabase/supabase-js';
import { UserProfile, WeeklyMenu } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey === 'missing-key') {
  console.error("🚨 ERRO: Chaves do Supabase não configuradas no .env");
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
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
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (userId) {
    localStorage.removeItem(`chef_ai_ingredients_${userId}`);
  }
  await supabase.auth.signOut();
};

export const deleteAccount = async (): Promise<void> => {
  const { error } = await supabase.rpc('delete_user');
  if (error) throw new Error(`Erro ao excluir: ${error.message}`);
  await signOut();
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

export const updatePreferences = async (userId: string, allergies: string[]): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ allergies })
    .eq('id', userId);

  if (error) throw error;
};

/**
 * SALVAR CARDÁPIO SEMANAL
 * Estratégia de Produção: Nunca enviamos o ID no insert. 
 * O PostgreSQL gera o ID via uuid_generate_v4().
 */
export const saveWeeklyMenu = async (userId: string, menu: WeeklyMenu): Promise<WeeklyMenu> => {
  // Removemos o ID do objeto menu para garantir que ele não vá como 'null' no JSON
  const { id, ...menuWithoutId } = menu;

  const { data, error } = await supabase
    .from('weekly_menus')
    .insert({
      user_id: userId,
      data: menuWithoutId
    })
    .select()
    .single();
    
  if (error) {
    console.error("Erro Supabase Insert:", error);
    throw error;
  }

  // Retornamos o menu com o ID REAL gerado pelo banco de dados
  return {
    ...data.data,
    id: data.id,
    createdAt: data.created_at || new Date().toISOString()
  };
};

export const deleteWeeklyMenu = async (menuId: string, userId: string): Promise<void> => {
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
    .select('id, data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  
  // Mapeamos os dados fundindo o ID da tabela no objeto de dados
  return data.map(row => ({
    ...row.data,
    id: row.id,
    createdAt: row.created_at
  }));
};
