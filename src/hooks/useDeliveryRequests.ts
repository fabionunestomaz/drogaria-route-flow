import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeliveryRequest {
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

export const useDeliveryRequests = () => {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar suas entregas');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (data: {
    origin_address: string;
    origin_lat: number;
    origin_lng: number;
    dest_address: string;
    dest_lat: number;
    dest_lng: number;
    distance: number;
    estimated_time: number;
    estimated_price: number;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: request, error } = await supabase
        .from('delivery_requests')
        .insert({
          customer_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Pedido criado com sucesso!');
      fetchRequests();
      return request;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error('Erro ao criar pedido');
      return null;
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Pedido cancelado');
      fetchRequests();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast.error('Erro ao cancelar pedido');
    }
  };

  useEffect(() => {
    fetchRequests();

    // Realtime updates
    const channel = supabase
      .channel('customer-requests')
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
    createRequest,
    cancelRequest,
    refresh: fetchRequests,
  };
};
