import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PricingConfig {
  gasoline_price: number;
  vehicle_consumption: number;
  maintenance_per_km: number;
  cost_per_minute: number;
  base_fee: number;
  profit_margin: number;
  minimum_price: number;
}

export const usePricingConfig = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchConfig();
  }, [user]);

  const fetchConfig = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('delivery_pricing_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configuração de preços:', error);
    } else if (data) {
      setConfig({
        gasoline_price: Number(data.gasoline_price),
        vehicle_consumption: Number(data.vehicle_consumption),
        maintenance_per_km: Number(data.maintenance_per_km),
        cost_per_minute: Number(data.cost_per_minute),
        base_fee: Number(data.base_fee),
        profit_margin: Number(data.profit_margin),
        minimum_price: Number(data.minimum_price),
      });
    }
    setLoading(false);
  };

  const updateConfig = async (newConfig: Partial<PricingConfig>) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_pricing_config')
        .upsert({
          user_id: user.id,
          ...newConfig,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        toast.error('Erro ao salvar configurações');
      } else {
        toast.success('Configurações salvas com sucesso!');
        await fetchConfig();
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const calculatePrice = (distanceKm: number, durationMin: number): number => {
    if (!config) {
      // Fallback para cálculo simples
      return 5 + distanceKm * 2;
    }

    // Custo por km = (preço gasolina / consumo) + manutenção
    const costPerKm = config.gasoline_price / config.vehicle_consumption + config.maintenance_per_km;

    // Custo total = taxa base + (distância × custo/km) + (tempo × custo/min)
    const baseCost = config.base_fee + (distanceKm * costPerKm) + (durationMin * config.cost_per_minute);

    // Adicionar margem de lucro
    const priceWithMargin = baseCost * (1 + config.profit_margin / 100);

    // Garantir preço mínimo
    return Math.max(priceWithMargin, config.minimum_price);
  };

  return {
    config,
    loading,
    updateConfig,
    calculatePrice,
  };
};
