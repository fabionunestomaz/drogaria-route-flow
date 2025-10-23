import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Rating {
  id: string;
  ride_id: string;
  customer_id: string;
  driver_id: string | null;
  stars: number;
  comment: string | null;
  rating_type: 'delivery' | 'product' | 'service';
  delivery_speed_stars: number | null;
  product_quality_stars: number | null;
  service_quality_stars: number | null;
  pharmacy_response: string | null;
  pharmacy_response_at: string | null;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
}

export const useRatings = (rideId?: string, driverId?: string) => {
  return useQuery({
    queryKey: ['ratings', rideId, driverId],
    queryFn: async () => {
      let query = supabase.from('ratings').select('*');

      if (rideId) {
        query = query.eq('ride_id', rideId);
      }

      if (driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Rating[];
    },
  });
};

export const useCreateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rating: {
      ride_id: string;
      stars: number;
      comment?: string;
      rating_type?: 'delivery' | 'product' | 'service';
      delivery_speed_stars?: number;
      product_quality_stars?: number;
      service_quality_stars?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Você precisa estar logado');
      }

      const { data, error } = await supabase
        .from('ratings')
        .insert({
          ...rating,
          customer_id: user.id,
          verified_purchase: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      toast.success('Avaliação enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação');
    },
  });
};

export const useAddPharmacyResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ratingId, response }: { ratingId: string; response: string }) => {
      const { data, error } = await supabase
        .from('ratings')
        .update({
          pharmacy_response: response,
          pharmacy_response_at: new Date().toISOString(),
        })
        .eq('id', ratingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      toast.success('Resposta adicionada!');
    },
    onError: (error) => {
      console.error('Erro ao responder:', error);
      toast.error('Erro ao adicionar resposta');
    },
  });
};