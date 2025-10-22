import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouteOptimization } from '@/hooks/useRouteOptimization';
import { calculateRoutePrice } from '@/lib/routeOptimization';
import { Route, DollarSign, Clock, MapPin } from 'lucide-react';
import DeliveryList, { Delivery } from '@/components/DeliveryList';
import RouteMap from '@/components/RouteMap';
import Header from '@/components/Header';

const NewRoute = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { optimize, isOptimizing, optimizedRoute } = useRouteOptimization();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pharmacySettings, setPharmacySettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPharmacySettings();
  }, [user]);

  const loadPharmacySettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('pharmacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setPharmacySettings(data);
    } else {
      toast.error('Configure sua farmácia primeiro');
      navigate('/settings');
    }
  };

  const handleOptimize = async () => {
    if (!pharmacySettings) return;

    const validDeliveries = deliveries.filter(
      d => d.customerName && d.orderNumber && d.address && d.lat && d.lng
    );

    if (validDeliveries.length === 0) {
      toast.error('Adicione pelo menos uma entrega válida');
      return;
    }

    const origin = {
      lat: pharmacySettings.lat,
      lng: pharmacySettings.lng
    };

    const waypoints = validDeliveries.map(d => ({
      id: d.id,
      lat: d.lat,
      lng: d.lng,
      address: d.address,
      name: d.customerName
    }));

    await optimize(origin, waypoints);
  };

  const handleSave = async () => {
    if (!user || !optimizedRoute) {
      toast.error('Otimize a rota antes de salvar');
      return;
    }

    setSaving(true);

    const totalPrice = calculateRoutePrice(
      optimizedRoute.totalDistance,
      Number(pharmacySettings.base_price),
      Number(pharmacySettings.price_per_km)
    );

    // Criar batch
    const { data: batch, error: batchError } = await supabase
      .from('delivery_batches')
      .insert({
        pharmacy_id: user.id,
        status: 'pending',
        total_distance: optimizedRoute.totalDistance,
        total_price: totalPrice,
        optimized_route: optimizedRoute as any
      })
      .select()
      .single();

    if (batchError || !batch) {
      toast.error('Erro ao criar rota');
      setSaving(false);
      return;
    }

    // Criar deliveries
    const deliveriesData = optimizedRoute.waypoints.map((wp, index) => {
      const delivery = deliveries.find(d => d.id === wp.id)!;
      return {
        batch_id: batch.id,
        customer_id: delivery.customerId,
        order_number: delivery.orderNumber,
        address: wp.address,
        lat: wp.lat,
        lng: wp.lng,
        sequence: index + 1,
        notes: delivery.notes,
        status: 'pending'
      };
    });

    const { error: deliveriesError } = await supabase
      .from('deliveries')
      .insert(deliveriesData);

    setSaving(false);

    if (deliveriesError) {
      toast.error('Erro ao salvar entregas');
    } else {
      toast.success('Rota criada com sucesso!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lado Esquerdo - Formulário */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Nova Rota de Entregas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryList deliveries={deliveries} onUpdate={setDeliveries} />

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleOptimize}
                    disabled={isOptimizing || deliveries.length === 0}
                    className="flex-1"
                  >
                    {isOptimizing ? 'Otimizando...' : 'Otimizar Rota'}
                  </Button>

                  {optimizedRoute && (
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      variant="default"
                      className="flex-1"
                    >
                      {saving ? 'Salvando...' : 'Salvar Rota'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {optimizedRoute && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Rota</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Distância Total</div>
                      <div className="font-semibold">
                        {optimizedRoute.totalDistance.toFixed(1)} km
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Tempo Estimado</div>
                      <div className="font-semibold">
                        {Math.round(optimizedRoute.totalDuration / 60)} min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Preço Total</div>
                      <div className="font-semibold text-lg">
                        R$ {calculateRoutePrice(
                          optimizedRoute.totalDistance,
                          Number(pharmacySettings?.base_price || 5),
                          Number(pharmacySettings?.price_per_km || 2)
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lado Direito - Mapa */}
          <Card className="lg:sticky lg:top-6 h-[600px]">
            <CardContent className="p-0 h-full">
              <RouteMap
                origin={pharmacySettings ? {
                  lat: pharmacySettings.lat,
                  lng: pharmacySettings.lng,
                  label: pharmacySettings.pharmacy_name
                } : undefined}
                destinations={
                  optimizedRoute
                    ? optimizedRoute.waypoints.map((wp, idx) => ({
                        lat: wp.lat,
                        lng: wp.lng,
                        label: wp.name,
                        sequence: idx + 1
                      }))
                    : deliveries
                        .filter(d => d.lat && d.lng)
                        .map((d, idx) => ({
                          lat: d.lat,
                          lng: d.lng,
                          label: d.customerName,
                          sequence: idx + 1
                        }))
                }
                route={optimizedRoute?.coordinates}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewRoute;
