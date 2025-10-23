import { supabase } from "@/integrations/supabase/client";

let cachedToken: string | null = null;

// Busca o token do Mapbox de forma assíncrona
export const getMapboxToken = async (): Promise<string> => {
  // Se já temos o token em cache, retorna
  if (cachedToken) {
    console.log("🗺️ Using cached Mapbox token:", cachedToken.substring(0, 20) + "...");
    return cachedToken;
  }

  // Tenta buscar do .env primeiro (fallback)
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  console.log("🗺️ Env token found:", envToken ? envToken.substring(0, 20) + "..." : "none");
  
  if (envToken && envToken !== "COLE_SEU_TOKEN_MAPBOX_AQUI") {
    cachedToken = envToken;
    console.log("✅ Using env token for Mapbox");
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
  import.meta.env.VITE_MAPBOX_TOKEN !== "COLE_SEU_TOKEN_MAPBOX_AQUI"
    ? import.meta.env.VITE_MAPBOX_TOKEN
    : "";

export const hasMapboxToken = () => {
  return MAPBOX_PUBLIC_TOKEN.length > 0 || cachedToken !== null;
};
