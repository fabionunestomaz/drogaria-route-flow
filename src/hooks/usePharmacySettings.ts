import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('pharmacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

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

    fetchSettings();
  }, [user]);

  return { settings, loading };
};
