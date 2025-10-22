import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Package, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrackingData {
  status: string;
  origin: string;
  destination: string;
  driver: {
    name: string;
    photo_url?: string;
    vehicle_type: string;
    plate?: string;
  } | null;
  current_location: {
    lat: number;
    lng: number;
    recorded_at: string;
  } | null;
  timeline: Array<{
    status: string;
    label: string;
    timestamp: string | null;
    completed: boolean;
  }>;
  is_active: boolean;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando', color: 'bg-yellow-500' },
  assigned: { label: 'Motoboy atribuído', color: 'bg-blue-500' },
  enroute_pickup: { label: 'Indo buscar', color: 'bg-purple-500' },
  enroute_dropoff: { label: 'A caminho', color: 'bg-green-500' },
  delivered: { label: 'Entregue', color: 'bg-emerald-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
};

export default function TrackingPublic() {
  const { token } = useParams<{ token: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchTracking = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'dnflkxdyfmuubgjnfshe';
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/tracking-public/${token}`
        );

        if (!response.ok) {
          throw new Error('Rastreamento não encontrado');
        }

        const data = await response.json();
        setTracking(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar rastreamento');
        setLoading(false);
      }
    };

    fetchTracking();

    // Set up realtime subscription for location updates
    const channel = supabase
      .channel(`track:${token}`)
      .on('broadcast', { event: 'location' }, (payload) => {
        console.log('Location update:', payload);
        setTracking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            current_location: payload.payload,
          };
        });
        setIsLive(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando rastreamento...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Rastreamento não encontrado</h1>
          <p className="text-muted-foreground">{error || 'Verifique o link e tente novamente'}</p>
        </Card>
      </div>
    );
  }

  const currentStatus = statusMap[tracking.status] || { label: tracking.status, color: 'bg-gray-500' };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Rastreamento de Entrega</h1>
            <div className="flex items-center gap-2">
              {isLive && tracking.is_active && (
                <Badge variant="destructive" className="animate-pulse">
                  🔴 AO VIVO
                </Badge>
              )}
              <Badge className={currentStatus.color}>
                {currentStatus.label}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Map Placeholder */}
        <Card className="mb-6 h-[400px] flex items-center justify-center bg-muted">
          <div className="text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Mapa será exibido aqui</p>
            {tracking.current_location && (
              <p className="text-sm text-muted-foreground mt-2">
                Lat: {tracking.current_location.lat.toFixed(6)}, Lng: {tracking.current_location.lng.toFixed(6)}
              </p>
            )}
          </div>
        </Card>

        {/* Driver Info */}
        {tracking.driver && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {tracking.driver.photo_url ? (
                  <img
                    src={tracking.driver.photo_url}
                    alt={tracking.driver.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {tracking.driver.name[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{tracking.driver.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tracking.driver.vehicle_type === 'moto' ? 'Moto' : 'Carro'}
                  {tracking.driver.plate && ` • ${tracking.driver.plate}`}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Route Info */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Origem</p>
                <p className="font-medium">{tracking.origin}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Destino</p>
                <p className="font-medium">{tracking.destination}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Linha do Tempo
          </h3>
          <div className="space-y-4">
            {tracking.timeline.map((event, index) => (
              <div key={event.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      event.completed
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-muted'
                    }`}
                  >
                    {event.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  {index < tracking.timeline.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${
                        event.completed ? 'bg-green-300 dark:bg-green-700' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className={`font-medium ${event.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {event.label}
                  </p>
                  {event.timestamp && (
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
