import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeliveryBatchWithDetails {
  id: string;
  status: string;
  total_distance: number | null;
  total_price: number | null;
  created_at: string;
  driver_id: string | null;
  pharmacy_id: string;
  optimized_route: any;
  driver?: {
    user_id: string;
    profiles: {
      name: string;
    };
  };
  deliveries: Array<{
    id: string;
    status: string;
    address: string;
    lat: number;
    lng: number;
    sequence: number;
    customer_id: string | null;
    customers: {
      name: string;
      phone: string;
    } | null;
  }>;
}

export interface KPIData {
  deliveriesToday: number;
  successRate: number;
  activeDrivers: number;
  averageTime: number;
}

export const useAdminData = () => {
  const [batches, setBatches] = useState<DeliveryBatchWithDetails[]>([]);
  const [kpis, setKpis] = useState<KPIData>({
    deliveriesToday: 0,
    successRate: 0,
    activeDrivers: 0,
    averageTime: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select(`
          *,
          driver:drivers(
            user_id,
            profiles!drivers_user_id_profiles_fkey(name)
          ),
          deliveries(
            *,
            customers(name, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBatches(data as any || []);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = async () => {
    try {
      // Entregas hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: deliveriesToday, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('id, status, delivered_at')
        .gte('created_at', today.toISOString());

      if (deliveriesError) throw deliveriesError;

      const total = deliveriesToday?.length || 0;
      const completed = deliveriesToday?.filter(d => d.status === 'delivered').length || 0;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calcular tempo médio das entregas de hoje
      const completedToday = deliveriesToday?.filter(d => d.status === 'delivered' && d.delivered_at);
      let averageTime = 0;
      if (completedToday && completedToday.length > 0) {
        const times = completedToday.map(d => {
          const created = new Date(d.delivered_at!).getTime();
          return created;
        });
        averageTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length / (1000 * 60)); // em minutos
      }

      // Motoboys ativos (com lotes em andamento)
      const { data: activeBatches, error: batchesError } = await supabase
        .from('delivery_batches')
        .select('driver_id')
        .eq('status', 'in_progress')
        .not('driver_id', 'is', null);

      if (batchesError) throw batchesError;

      const activeDrivers = new Set(activeBatches?.map(b => b.driver_id)).size;

      setKpis({
        deliveriesToday: total,
        successRate,
        activeDrivers,
        averageTime,
      });
    } catch (error) {
      console.error('Erro ao calcular KPIs:', error);
    }
  };

  const deleteBatch = async (batchId: string) => {
    try {
      // Primeiro deletar as entregas do lote
      const { error: deliveriesError } = await supabase
        .from('deliveries')
        .delete()
        .eq('batch_id', batchId);

      if (deliveriesError) throw deliveriesError;

      // Depois deletar o lote
      const { error: batchError } = await supabase
        .from('delivery_batches')
        .delete()
        .eq('id', batchId);

      if (batchError) throw batchError;

      toast.success('Lote excluído com sucesso');
      fetchBatches();
      calculateKPIs();
    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      toast.error('Erro ao excluir lote');
    }
  };

  const updateBatchStatus = async (batchId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('delivery_batches')
        .update({ status })
        .eq('id', batchId);

      if (error) throw error;

      toast.success('Status atualizado');
      fetchBatches();
      calculateKPIs();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const reassignDriver = async (batchId: string, driverId: string | null) => {
    try {
      const { error } = await supabase
        .from('delivery_batches')
        .update({ driver_id: driverId })
        .eq('id', batchId);

      if (error) throw error;

      toast.success('Motorista reatribuído');
      fetchBatches();
    } catch (error) {
      console.error('Erro ao reatribuir motorista:', error);
      toast.error('Erro ao reatribuir motorista');
    }
  };

  useEffect(() => {
    fetchBatches();
    calculateKPIs();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      fetchBatches();
      calculateKPIs();
    }, 30000);

    // Realtime updates
    const channel = supabase
      .channel('admin-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_batches'
        },
        () => {
          fetchBatches();
          calculateKPIs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries'
        },
        () => {
          fetchBatches();
          calculateKPIs();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    batches,
    kpis,
    loading,
    deleteBatch,
    updateBatchStatus,
    reassignDriver,
    refresh: () => {
      fetchBatches();
      calculateKPIs();
    },
  };
};
