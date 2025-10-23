import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Navigation, MapPin, Clock, Package } from 'lucide-react';
import RouteMap from '@/components/RouteMap';
import Header from '@/components/Header';

interface Delivery {
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

const RouteDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRouteDetails();
  }, [batchId]);

  const loadRouteDetails = async () => {
    const { data: batchData } = await supabase
      .from('delivery_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    const { data: deliveriesData } = await supabase
      .from('deliveries')
      .select(`
        *,
        customer:customers(name, phone)
      `)
      .eq('batch_id', batchId)
      .order('sequence');

    if (batchData) setBatch(batchData);
    if (deliveriesData) setDeliveries(deliveriesData);
    setLoading(false);
  };

  const handleCompleteDelivery = async (deliveryId: string) => {
    const { error } = await supabase
      .from('deliveries')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', deliveryId);

    if (error) {
      toast.error('Erro ao atualizar entrega');
    } else {
      toast.success('Entrega concluída!');
      loadRouteDetails();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'secondary',
      picked_up: 'default',
      in_transit: 'default',
      delivered: 'default',
      failed: 'destructive'
    };

    const labels: any = {
      pending: 'Pendente',
      picked_up: 'Coletado',
      in_transit: 'Em trânsito',
      delivered: 'Entregue',
      failed: 'Falhou'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Esquerda - Lista de Entregas */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Paradas da Rota</span>
                  <Badge>{deliveries.length} entregas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                        {delivery.sequence}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{delivery.customer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {delivery.customer.phone}
                            </div>
                          </div>
                          {getStatusBadge(delivery.status)}
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{delivery.address}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Pedido #{delivery.order_number}</span>
                        </div>

                        {delivery.notes && (
                          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {delivery.notes}
                          </div>
                        )}

                        {delivery.status !== 'delivered' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleCompleteDelivery(delivery.id)}
                              className="flex-1"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Marcar como Entregue
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(
                                  `https://www.google.com/maps/dir/?api=1&destination=${delivery.lat},${delivery.lng}`,
                                  '_blank'
                                );
                              }}
                            >
                              <Navigation className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Direita - Mapa */}
          <Card className="lg:sticky lg:top-6 h-[600px]">
            <CardContent className="p-0 h-full">
              <RouteMap
                origin={
                  batch?.optimized_route
                    ? {
                        lat: batch.optimized_route.waypoints[0]?.lat,
                        lng: batch.optimized_route.waypoints[0]?.lng,
                        label: 'Farmácia'
                      }
                    : undefined
                }
                destinations={deliveries.map((d) => ({
                  lat: d.lat,
                  lng: d.lng,
                  label: d.customer.name,
                  sequence: d.sequence
                }))}
                routes={batch?.optimized_route?.coordinates ? [{
                  coordinates: batch.optimized_route.coordinates,
                  isSelected: true
                }] : []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RouteDetails;
