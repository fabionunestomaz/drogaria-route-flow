import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PharmacySettings {
  pharmacy_name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  base_price: number;
  price_per_km: number;
}

export const usePharmacySettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pharmacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configurações:', error);
    } else if (data) {
      setSettings({
        pharmacy_name: data.pharmacy_name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone || undefined,
        base_price: Number(data.base_price) || 5,
        price_per_km: Number(data.price_per_km) || 2
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const updateSettings = async (newSettings: PharmacySettings) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const { error } = await supabase
        .from('pharmacy_settings')
        .upsert({
          user_id: user.id,
          pharmacy_name: newSettings.pharmacy_name,
          address: newSettings.address,
          lat: newSettings.lat,
          lng: newSettings.lng,
          phone: newSettings.phone,
          base_price: newSettings.base_price,
          price_per_km: newSettings.price_per_km
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        toast.error('Erro ao salvar configurações');
        return false;
      }

      toast.success('Configurações salvas com sucesso!');
      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
      return false;
    }
  };

  return { settings, loading, updateSettings };
};
