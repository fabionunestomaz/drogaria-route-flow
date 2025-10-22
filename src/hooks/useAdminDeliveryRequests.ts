import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminDeliveryRequest {
  id: string;
  customer_id: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  dest_address: string;
  dest_lat: number;
  dest_lng: number;
  distance: number | null;
  estimated_time: number | null;
  estimated_price: number | null;
  status: string;
  tracking_token: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdminDeliveryRequests = () => {
  const [requests, setRequests] = useState<AdminDeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações de entrega');
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitação excluída');
      fetchRequests();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir solicitação');
    }
  };

  useEffect(() => {
    fetchRequests();

    // Realtime updates
    const channel = supabase
      .channel('admin-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    requests,
    loading,
    deleteRequest,
    refresh: fetchRequests,
  };
};
