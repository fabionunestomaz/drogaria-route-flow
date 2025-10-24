import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingDriver {
  id: string;
  user_id: string;
  cnh_number: string;
  cnh_front_url: string;
  cnh_back_url: string;
  selfie_url: string;
  vehicle_type: string;
  plate: string;
  created_at: string;
  profiles: {
    name: string;
    phone: string | null;
  };
}

export const useDriverApprovals = () => {
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          cnh_number,
          cnh_front_url,
          cnh_back_url,
          selfie_url,
          vehicle_type,
          plate,
          created_at,
          profiles!drivers_user_id_profiles_fkey(name, phone)
        `)
        .eq('approved', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setPendingDrivers(data as any || []);
    } catch (error) {
      console.error('Erro ao carregar motoristas pendentes:', error);
      toast.error('Erro ao carregar motoristas pendentes');
    } finally {
      setLoading(false);
    }
  };

  const approveDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ approved: true })
        .eq('id', driverId);

      if (error) throw error;

      toast.success('Motorista aprovado com sucesso!');
      await fetchPendingDrivers();
      return true;
    } catch (error) {
      console.error('Erro ao aprovar motorista:', error);
      toast.error('Erro ao aprovar motorista');
      return false;
    }
  };

  const rejectDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) throw error;

      toast.success('Cadastro rejeitado');
      await fetchPendingDrivers();
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar motorista:', error);
      toast.error('Erro ao rejeitar motorista');
      return false;
    }
  };

  useEffect(() => {
    fetchPendingDrivers();

    // Realtime updates
    const channel = supabase
      .channel('driver-approvals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        () => {
          fetchPendingDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pendingDrivers, loading, approveDriver, rejectDriver, refresh: fetchPendingDrivers };
};
