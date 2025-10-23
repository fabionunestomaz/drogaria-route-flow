import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Package, Clock, User, Phone, MessageCircle, Loader2 } from 'lucide-react';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import RideChat from '@/components/RideChat';

interface Ride {
  id: string;
  status: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  dest_address: string;
  dest_lat: number;
  dest_lng: number;
  driver_id: string | null;
  customer_id: string;
  price_final: number | null;
  created_at: string;
}

const RideTracking = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [driverName, setDriverName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const fetchRide = async () => {
      try {
        const { data: rideData, error: rideError } = await supabase
          .from('rides')
          .select('*')
          .eq('id', rideId)
          .single();

        if (rideError) throw rideError;
        setRide(rideData);

        if (rideData.driver_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', rideData.driver_id)
            .single();

          if (profileData) {
            setDriverName(profileData.name);
          }
        }
      } catch (err: any) {
        console.error('Error fetching ride:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRide();

    // Realtime subscription for ride updates
    const channel = supabase
      .channel(`ride:${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`
        },
        (payload) => {
          setRide(payload.new as Ride);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Corrida não encontrada</h2>
          <p className="text-muted-foreground">{error || 'Verifique o link de rastreamento'}</p>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      created: { label: "Criado", className: "bg-gray-500" },
      offered: { label: "Buscando motorista", className: "bg-yellow-500" },
      accepted: { label: "Aceito", className: "bg-blue-500" },
      enroute_pickup: { label: "A caminho da coleta", className: "bg-indigo-500" },
      picked: { label: "Coletado", className: "bg-purple-500" },
      enroute_dropoff: { label: "A caminho do destino", className: "bg-orange-500" },
      delivered: { label: "Entregue", className: "bg-green-500" },
      completed: { label: "Concluído", className: "bg-green-600" },
      canceled: { label: "Cancelado", className: "bg-red-500" }
    };
    return statusMap[status] || statusMap.created;
  };

  const statusBadge = getStatusBadge(ride.status);
  const showTracking = ride.driver_id && ['enroute_pickup', 'picked', 'enroute_dropoff'].includes(ride.status);

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Rastreamento de Entrega</h1>
          <Badge className={`${statusBadge.className} text-white`}>
            {statusBadge.label}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {showTracking ? (
              <LiveTrackingMap
                rideId={ride.id}
                originLat={ride.origin_lat}
                originLng={ride.origin_lng}
                destLat={ride.dest_lat}
                destLng={ride.dest_lng}
                destAddress={ride.dest_address}
              />
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {ride.driver_id ? 'Aguardando início da rota' : 'Buscando motorista'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    O rastreamento ao vivo será exibido quando o motorista iniciar a entrega
                  </p>
                </div>
              </Card>
            )}

            {ride.driver_id && (
              <RideChat
                rideId={ride.id}
                otherUserId={ride.driver_id}
                otherUserName={driverName || 'Motorista'}
              />
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Detalhes da Entrega
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Origem</p>
                  <p className="font-medium">{ride.origin_address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Destino</p>
                  <p className="font-medium">{ride.dest_address}</p>
                </div>
                {ride.price_final && (
                  <div>
                    <p className="text-muted-foreground mb-1">Valor</p>
                    <p className="text-lg font-bold text-primary">
                      R$ {ride.price_final.toFixed(2)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Solicitado em</p>
                  <p className="font-medium">
                    {new Date(ride.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </Card>

            {ride.driver_id && driverName && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Motorista
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{driverName}</p>
                  <Button variant="outline" className="w-full" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideTracking;