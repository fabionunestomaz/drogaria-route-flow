import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Driver {
  id: string;
  user_id: string;
  approved: boolean;
  shift_status: string;
  vehicle_type: string;
  profiles: {
    name: string;
    phone: string | null;
  };
}

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          approved,
          shift_status,
          vehicle_type,
          profiles!drivers_user_id_profiles_fkey(name, phone)
        `)
        .eq('approved', true)
        .order('shift_status', { ascending: false });

      if (error) throw error;

      setDrivers(data as any || []);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();

    // Realtime updates
    const channel = supabase
      .channel('drivers-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        () => {
          fetchDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { drivers, loading, refresh: fetchDrivers };
};
