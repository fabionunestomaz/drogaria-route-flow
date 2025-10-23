import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Navigation, Clock, DollarSign, Package } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import RouteMap from "@/components/RouteMap";
import { geocodeAddress } from "@/lib/mapbox";
import { calculateRoute } from "@/lib/mapboxDirections";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DROGACOM_ADDRESS = "Avenida Luiz Eduardo Magalhães, 657 - São Félix do Coribe, BA, 47670-025";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export default function NewDelivery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [destAddress, setDestAddress] = useState("");
  const [notes, setNotes] = useState("");
  
  const [routeData, setRouteData] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [manualPrice, setManualPrice] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Geocodificar endereço de origem fixo
  useEffect(() => {
    const initOrigin = async () => {
      const result = await geocodeAddress(DROGACOM_ADDRESS);
      if (result) {
        setOrigin({
          lat: result.center[1],
          lng: result.center[0],
          address: DROGACOM_ADDRESS
        });
      }
    };
    initOrigin();
  }, []);

  // Calcular rota quando origem e destino estiverem definidos
  useEffect(() => {
    if (!origin || !destination) {
      setRouteData(null);
      setDistance(0);
      setDuration(0);
      setCalculatedPrice(0);
      return;
    }

    const calculateRouteData = async () => {
      setCalculating(true);
      try {
        const route = await calculateRoute(
          origin.lng,
          origin.lat,
          destination.lng,
          destination.lat
        );

        if (route && route.routes && route.routes.length > 0) {
          // Pegar a rota mais rápida (já vem ordenada por duração)
          const bestRoute = route.routes[0];
          
          setRouteData(bestRoute.geometry);
          setDistance(bestRoute.distance / 1000); // converter para km
          setDuration(Math.round(bestRoute.duration / 60)); // converter para minutos

          // Calcular preço: R$ 5,00 base + R$ 2,00 por km
          const basePrice = 5.0;
          const pricePerKm = 2.0;
          const totalPrice = basePrice + (bestRoute.distance / 1000) * pricePerKm;
          
          setCalculatedPrice(Number(totalPrice.toFixed(2)));
          setManualPrice(totalPrice.toFixed(2));
          
          toast.success("Rota calculada com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao calcular rota:", error);
        toast.error("Erro ao calcular rota");
      } finally {
        setCalculating(false);
      }
    };

    calculateRouteData();
  }, [origin, destination]);

  const handleDestinationChange = (address: string, coords?: { lat: number; lng: number }) => {
    setDestAddress(address);
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
      toast.error("Você precisa estar logado");
      return;
    }

    if (!destination) {
      toast.error("Selecione um endereço de entrega");
      return;
    }

    const finalPrice = manualPrice ? parseFloat(manualPrice) : calculatedPrice;
    
    if (!finalPrice || finalPrice <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("delivery_requests")
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
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Pedido de entrega criado com sucesso!");
      navigate(`/ride-tracking/${data.id}`);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast.error("Erro ao criar pedido de entrega");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mapa */}
      <div className="h-[50vh] relative">
        <RouteMap
          origin={origin ? { lat: origin.lat, lng: origin.lng } : undefined}
          destinations={destination ? [{ 
            lat: destination.lat, 
            lng: destination.lng,
            label: "Entrega"
          }] : []}
          route={routeData}
          className="w-full h-full"
        />
        {calculating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm">Calculando melhor rota...</p>
            </div>
          </div>
        )}
      </div>

      {/* Formulário */}
      <div className="flex-1 overflow-auto p-4 pb-24">
        <Card className="max-w-2xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Nova Entrega</h1>
            <p className="text-muted-foreground text-sm">
              Configure sua entrega e veja a melhor rota no mapa
            </p>
          </div>

          {/* Origem (Fixo) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Local de Coleta (Drogacom)
            </Label>
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm">{DROGACOM_ADDRESS}</p>
            </div>
          </div>

          {/* Destino (Autocomplete) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Endereço de Entrega
            </Label>
            <AddressAutocomplete
              value={destAddress}
              onChange={handleDestinationChange}
              placeholder="Digite o endereço de entrega..."
            />
          </div>

          {/* Informações da Rota */}
          {destination && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distância</p>
                    <p className="text-lg font-bold">{distance.toFixed(2)} km</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo Estimado</p>
                    <p className="text-lg font-bold">{duration} min</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Calculado</p>
                    <p className="text-lg font-bold">R$ {calculatedPrice.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Valor Manual (Editável) */}
          {destination && (
            <div className="space-y-2">
              <Label>Valor da Entrega (editável)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder="R$ 0,00"
              />
              <p className="text-xs text-muted-foreground">
                Valor sugerido: R$ {calculatedPrice.toFixed(2)} (Base: R$ 5,00 + R$ 2,00/km)
              </p>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Entregar no portão, ligar antes de chegar..."
              rows={3}
            />
          </div>

          {/* Botão de Confirmação */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !destination || calculating}
            className="w-full"
            size="lg"
          >
            {loading ? "Criando..." : "Confirmar Entrega"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
