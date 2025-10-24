import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Loader2, CheckCircle, Clock } from 'lucide-react';
import LiveTrackingMapBatch from '@/components/LiveTrackingMapBatch';
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
  } | null;
}

interface Batch {
  id: string;
  status: string;
  total_distance: number;
  total_price: number;
  created_at: string;
  pharmacy: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
  driver: {
    profiles: {
      name: string;
    };
  } | null;
  deliveries: Delivery[];
}

const BatchTracking = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;

    const fetchBatch = async () => {
      try {
        const { data: batchData, error: batchError } = await supabase
          .from('delivery_batches')
          .select(`
            *,
            pharmacy:pharmacy_settings!delivery_batches_pharmacy_id_fkey(
              name,
              address,
              lat,
              lng
            ),
            driver:drivers!delivery_batches_driver_id_fkey(
              profiles:user_id(name)
            ),
            deliveries:deliveries(
              *,
              customer:customers(name, phone)
            )
          `)
          .eq('id', batchId)
          .single();

        if (batchError) throw batchError;
        
        console.log('Batch data:', batchData);
        setBatch(batchData as any);
      } catch (err: any) {
        console.error('Error fetching batch:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();

    // Realtime subscription for batch updates
    const channel = supabase
      .channel(`batch:${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_batches',
          filter: `id=eq.${batchId}`
        },
        () => {
          fetchBatch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `batch_id=eq.${batchId}`
        },
        () => {
          fetchBatch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-6 text-center max-w-md">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Lote não encontrado</h2>
            <p className="text-muted-foreground">{error || 'Verifique o link de rastreamento'}</p>
          </Card>
        </div>
      </>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-gray-500" },
      assigned: { label: "Atribuída", className: "bg-blue-500" },
      in_progress: { label: "Em Rota", className: "bg-orange-500" },
      completed: { label: "Concluída", className: "bg-green-600" }
    };
    return statusMap[status] || statusMap.pending;
  };

  const statusBadge = getStatusBadge(batch.status);
  const completedCount = batch.deliveries.filter(d => d.status === 'delivered').length;
  const showTracking = batch.driver && ['assigned', 'in_progress'].includes(batch.status);

  return (
    <>
      <Header />
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
              {showTracking && batch.pharmacy ? (
                <LiveTrackingMapBatch
                  batchId={batch.id}
                  originLat={batch.pharmacy.lat}
                  originLng={batch.pharmacy.lng}
                  deliveries={batch.deliveries.map(d => ({
                    lat: d.lat,
                    lng: d.lng,
                    address: d.address
                  }))}
                />
              ) : (
                <Card className="p-6">
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {batch.driver ? 'Aguardando início da rota' : 'Aguardando motorista'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      O rastreamento ao vivo será exibido quando o motorista iniciar
                    </p>
                  </div>
                </Card>
              )}

              {/* Deliveries List */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Entregas ({completedCount}/{batch.deliveries.length})
                </h3>
                <div className="space-y-3">
                  {batch.deliveries
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((delivery) => (
                      <div key={delivery.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {delivery.sequence}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{delivery.customer?.name || 'Cliente'}</p>
                            {delivery.status === 'delivered' && (
                              <CheckCircle className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{delivery.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pedido #{delivery.order_number}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Detalhes
                </h3>
                <div className="space-y-3 text-sm">
                  {batch.pharmacy && (
                    <div>
                      <p className="text-muted-foreground mb-1">Origem</p>
                      <p className="font-medium">{batch.pharmacy.name}</p>
                      <p className="text-xs text-muted-foreground">{batch.pharmacy.address}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Total de Entregas</p>
                    <p className="font-medium">{batch.deliveries.length} paradas</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Distância Total</p>
                    <p className="font-medium">{Number(batch.total_distance || 0).toFixed(1)} km</p>
                  </div>
                  {batch.total_price && (
                    <div>
                      <p className="text-muted-foreground mb-1">Valor Total</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {Number(batch.total_price).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Criado em</p>
                    <p className="font-medium text-xs">
                      {new Date(batch.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>

              {batch.driver && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Motorista
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">
                      {Array.isArray(batch.driver.profiles) 
                        ? batch.driver.profiles[0]?.name 
                        : (batch.driver.profiles as any)?.name || 'Motorista'}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BatchTracking;
