import { supabase } from "@/integrations/supabase/client";

let cachedToken: string | null = null;

// Busca o token do Mapbox de forma assíncrona
export const getMapboxToken = async (): Promise<string> => {
  // Se já temos o token em cache, retorna
  if (cachedToken) return cachedToken;

  // Tenta buscar do .env primeiro (fallback)
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  if (
    envToken &&
    envToken !== "pk.eyJ1IjoiZmFiaW9udW5lc3RvbWF6IiwiYSI6ImNtaDJmNmtyNzJ3aDQya29udW13ZHRwN2oifQ.OAA-q96QLQd8D6hI9eocAg"
  ) {
    cachedToken = envToken;
    return envToken;
  }

  // Busca da edge function
  try {
    const { data, error } = await supabase.functions.invoke("get-mapbox-token");

    if (error) throw error;

    if (data?.token) {
      cachedToken = data.token;
      return data.token;
    }
  } catch (error) {
    console.error("Erro ao buscar token do Mapbox:", error);
  }

  return "";
};

// Token síncrono para uso inicial (pode estar vazio até a primeira chamada assíncrona)
export const MAPBOX_PUBLIC_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN &&
  import.meta.env.VITE_MAPBOX_TOKEN !==
    "pk.eyJ1IjoiZmFiaW9udW5lc3RvbWF6IiwiYSI6ImNtaDJmNmtyNzJ3aDQya29udW13ZHRwN2oifQ.OAA-q96QLQd8D6hI9eocAg"
    ? import.meta.env.VITE_MAPBOX_TOKEN
    : "";

export const hasMapboxToken = () => {
  return MAPBOX_PUBLIC_TOKEN.length > 0 || cachedToken !== null;
};
