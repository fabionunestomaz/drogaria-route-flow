import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DriverDelivery {
  id: string;
  order_number: string;
  address: string;
  lat: number;
  lng: number;
  sequence: number;
  status: string;
  notes?: string;
  customer: {
    name: string;
    phone: string;
  };
}

export interface DriverBatch {
  id: string;
  created_at: string;
  status: string;
  total_distance: number;
  total_price: number;
  optimized_route: any;
  deliveries: DriverDelivery[];
}

export const useDriverRoutes = () => {
  const [activeBatch, setActiveBatch] = useState<DriverBatch | null>(null);
  const [historyBatches, setHistoryBatches] = useState<DriverBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDriverRoutes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar lote ativo
      const { data: activeBatchData, error: activeBatchError } = await supabase
        .from('delivery_batches')
        .select(`
          *,
          deliveries:deliveries(
            *,
            customer:customers(name, phone)
          )
        `)
        .eq('driver_id', user.id)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!activeBatchError && activeBatchData) {
        setActiveBatch(activeBatchData as any);
      }

      // Buscar histórico
      const { data: historyData, error: historyError } = await supabase
        .from('delivery_batches')
        .select(`
          *,
          deliveries:deliveries(
            *,
            customer:customers(name, phone)
          )
        `)
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!historyError && historyData) {
        setHistoryBatches(historyData as any);
      }
    } catch (error) {
      console.error('Erro ao carregar rotas do motorista:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          status,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null
        })
        .eq('id', deliveryId);

      if (error) throw error;

      await fetchDriverRoutes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar entrega:', error);
      return false;
    }
  };

  const updateBatchStatus = async (batchId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('delivery_batches')
        .update({ status })
        .eq('id', batchId);

      if (error) throw error;

      await fetchDriverRoutes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar lote:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchDriverRoutes();

    // Realtime updates
    const channel = supabase
      .channel('driver-routes-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_batches'
        },
        () => {
          fetchDriverRoutes();
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
          fetchDriverRoutes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    activeBatch, 
    historyBatches, 
    loading, 
    refresh: fetchDriverRoutes,
    updateDeliveryStatus,
    updateBatchStatus
  };
};
