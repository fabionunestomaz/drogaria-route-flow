import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import RouteMap from '@/components/RouteMap';
import { calculateRoute } from '@/lib/mapboxDirections';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePharmacySettings } from '@/hooks/usePharmacySettings';
import { toast } from 'sonner';
import { searchAddresses } from '@/lib/mapbox';
import { Clock, MapPin, DollarSign, Zap } from 'lucide-react';

const DROGACOM_ADDRESS = "Avenida Luiz Eduardo Magalhães, 657 - São Félix do Coribe, BA, 47670-025";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

const NewDelivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = usePharmacySettings();
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [manualPrice, setManualPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const initOrigin = async () => {
      const results = await searchAddresses(DROGACOM_ADDRESS);
      if (results && results.length > 0) {
        setOrigin({
          lat: results[0].center[1],
          lng: results[0].center[0],
          address: DROGACOM_ADDRESS
        });
      }
    };
    initOrigin();
  }, []);

  useEffect(() => {
    if (!origin || !destination || !settings) return;

    const fetchRoute = async () => {
      setCalculating(true);
      try {
        const routeData = await calculateRoute(
          origin.lng,
          origin.lat,
          destination.lng,
          destination.lat
        );

        if (routeData && routeData.routes && routeData.routes.length > 0) {
          const sortedRoutes = routeData.routes.sort((a, b) => a.duration - b.duration);
          setAllRoutes(sortedRoutes);
          setSelectedRouteIndex(0);

          const fastestRoute = sortedRoutes[0];
          setDistance(fastestRoute.distance / 1000);
          setDuration(Math.round(fastestRoute.duration / 60));

          const basePrice = settings.base_price;
          const pricePerKm = settings.price_per_km;
          const price = basePrice + (fastestRoute.distance / 1000) * pricePerKm;
          setCalculatedPrice(price);
          setManualPrice(price.toFixed(2));
        }
      } catch (error) {
        console.error('Erro ao calcular rota:', error);
        toast.error('Erro ao calcular rota');
      } finally {
        setCalculating(false);
      }
    };

    fetchRoute();
  }, [origin, destination, settings]);

  const handleDestinationChange = (address: string, coords?: { lat: number; lng: number }) => {
    if (coords) {
      setDestination({
        lat: coords.lat,
        lng: coords.lng,
        address
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!destination) {
      toast.error('Selecione um endereço de entrega');
      return;
    }

    const finalPrice = manualPrice ? parseFloat(manualPrice) : calculatedPrice;
    
    if (!finalPrice || finalPrice <= 0) {
      toast.error('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .insert({
          customer_id: user.id,
          origin_address: DROGACOM_ADDRESS,
          origin_lat: origin!.lat,
          origin_lng: origin!.lng,
          dest_address: destination.address,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          distance: distance,
          estimated_time: duration,
          estimated_price: finalPrice,
          notes: notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Pedido de entrega criado com sucesso!');
      navigate(`/ride-tracking/${data.id}`);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido de entrega');
    } finally {
      setLoading(false);
    }
  };

  const routesForMap = allRoutes.map((route, idx) => ({
    coordinates: route.geometry.coordinates,
    isSelected: idx === selectedRouteIndex,
    index: idx
  }));

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nova Entrega</h1>
        {allRoutes.length > 1 && (
          <Badge variant="secondary" className="gap-1">
            <Zap className="w-3 h-3" />
            {allRoutes.length} rotas encontradas
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <RouteMap
            origin={origin ? { lat: origin.lat, lng: origin.lng, label: 'Drogacom' } : undefined}
            destinations={destination ? [{ lat: destination.lat, lng: destination.lng, label: 'Entrega' }] : []}
            routes={routesForMap}
            className="h-[400px] rounded-lg"
          />
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <Label>Local de Coleta (Fixo)</Label>
            <div className="p-3 bg-muted rounded-lg mt-2 text-sm">
              {DROGACOM_ADDRESS}
            </div>
          </div>

          <div>
            <Label>Endereço de Entrega</Label>
            <AddressAutocomplete
              value={destination?.address || ''}
              onChange={handleDestinationChange}
              placeholder="Digite o endereço de entrega..."
            />
          </div>

          {calculating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Zap className="w-4 h-4" />
              Calculando melhor rota...
            </div>
          )}

          {allRoutes.length > 1 && (
            <div className="space-y-2">
              <Label>Escolha a rota preferida:</Label>
              <div className="grid gap-2">
                {allRoutes.map((route, idx) => {
                  const routeDistance = (route.distance / 1000).toFixed(2);
                  const routeDuration = Math.round(route.duration / 60);
                  const basePrice = settings?.base_price || 5;
                  const pricePerKm = settings?.price_per_km || 2;
                  const routePrice = (basePrice + (route.distance / 1000) * pricePerKm).toFixed(2);
                  
                  return (
                    <Button
                      key={idx}
                      variant={idx === selectedRouteIndex ? "default" : "outline"}
                      className="justify-start h-auto p-3"
                      onClick={() => {
                        setSelectedRouteIndex(idx);
                        setDistance(route.distance / 1000);
                        setDuration(routeDuration);
                        setCalculatedPrice(Number(routePrice));
                        setManualPrice(routePrice);
                      }}
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-2 font-semibold">
                          {idx === 0 && <Zap className="w-4 h-4" />}
                          Rota {idx + 1} {idx === 0 && '(Mais rápida)'}
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {routeDuration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {routeDistance} km
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            R$ {routePrice}
                          </span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {distance && duration && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center gap-1">
                <MapPin className="w-5 h-5 text-primary" />
                <div className="text-xs text-muted-foreground">Distância</div>
                <div className="font-semibold">{distance.toFixed(2)} km</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Clock className="w-5 h-5 text-primary" />
                <div className="text-xs text-muted-foreground">Tempo</div>
                <div className="font-semibold">{duration} min</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <DollarSign className="w-5 h-5 text-primary" />
                <div className="text-xs text-muted-foreground">Valor sugerido</div>
                <div className="font-semibold">R$ {calculatedPrice?.toFixed(2)}</div>
              </div>
            </div>
          )}

          {destination && (
            <div>
              <Label>Valor da Entrega (editável)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder="R$ 0,00"
                className="mt-2"
              />
            </div>
          )}

          <div>
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Entregar no portão, ligar antes..."
              rows={3}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !destination || calculating}
            className="w-full"
            size="lg"
          >
            {loading ? 'Criando...' : 'Confirmar Entrega'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default NewDelivery;
