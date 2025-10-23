import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FinancialMetrics {
  totalRevenue: number;
  averageTicket: number;
  revenueByDriver: Record<string, number>;
  monthlyGrowth: number;
}

interface OperationalMetrics {
  totalDeliveries: number;
  averageDeliveryTime: number;
  averageDistance: number;
  successRate: number;
}

interface DriverMetrics {
  id: string;
  name: string;
  totalDeliveries: number;
  averageRating: number;
  totalRevenue: number;
  averageTime: number;
}

export const useAnalytics = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();
  const [financial, setFinancial] = useState<FinancialMetrics | null>(null);
  const [operational, setOperational] = useState<OperationalMetrics | null>(null);
  const [drivers, setDrivers] = useState<DriverMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, startDate, endDate]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);

    // Buscar batches com suas entregas
    const { data: batches, error } = await supabase
      .from('delivery_batches')
      .select(`
        *,
        deliveries(*)
      `)
      .eq('pharmacy_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar analytics:', error);
      setLoading(false);
      return;
    }

    // Calcular métricas financeiras
    const totalRevenue = batches?.reduce((sum, batch) => sum + Number(batch.total_price || 0), 0) || 0;
    const totalDeliveries = batches?.reduce((sum, batch) => sum + (batch.deliveries?.length || 0), 0) || 0;
    const averageTicket = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;

    // Calcular métricas operacionais
    const deliveredCount = batches?.reduce(
      (sum, batch) => sum + (batch.deliveries?.filter((d: any) => d.status === 'delivered').length || 0),
      0
    ) || 0;
    const successRate = totalDeliveries > 0 ? (deliveredCount / totalDeliveries) * 100 : 0;

    const totalDistance = batches?.reduce((sum, batch) => sum + Number(batch.total_distance || 0), 0) || 0;
    const averageDistance = totalDeliveries > 0 ? totalDistance / totalDeliveries : 0;

    setFinancial({
      totalRevenue,
      averageTicket,
      revenueByDriver: {},
      monthlyGrowth: 0,
    });

    setOperational({
      totalDeliveries,
      averageDeliveryTime: 0,
      averageDistance,
      successRate,
    });

    setLoading(false);
  };

  return {
    financial,
    operational,
    drivers,
    loading,
    refresh: fetchAnalytics,
  };
};
