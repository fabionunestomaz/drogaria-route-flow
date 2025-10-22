import { useState } from 'react';
import { optimizeRoute, Waypoint, OptimizedRoute } from '@/lib/routeOptimization';
import { toast } from 'sonner';

export const useRouteOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);

  const optimize = async (
    origin: { lat: number; lng: number },
    destinations: Waypoint[]
  ) => {
    if (destinations.length === 0) {
      toast.error('Adicione pelo menos uma entrega');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeRoute(origin, destinations);
      setOptimizedRoute(result);
      toast.success('Rota otimizada com sucesso!');
      return result;
    } catch (error) {
      toast.error('Erro ao otimizar rota');
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const reset = () => {
    setOptimizedRoute(null);
  };

  return {
    optimize,
    reset,
    isOptimizing,
    optimizedRoute
  };
};
