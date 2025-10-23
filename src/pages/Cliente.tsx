import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, XCircle, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import ShareTrackingButton from "@/components/ShareTrackingButton";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import MapPicker from "@/components/MapPicker";
import { searchCep, formatAddress, formatCepMask } from "@/lib/viaCep";
import { geocodeAddress } from "@/lib/mapbox";
import { calculateRoute as calculateMapboxRoute } from "@/lib/mapboxDirections";
import { useDeliveryRequests } from "@/hooks/useDeliveryRequests";
import { usePharmacySettings } from "@/hooks/usePharmacySettings";
import MapboxMap from "@/components/MapboxMap";

const Cliente = () => {
  const { requests, loading: loadingRequests, createRequest, cancelRequest } = useDeliveryRequests();
  const { settings: pharmacySettings, loading: loadingSettings } = usePharmacySettings();
  
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastTrackingToken, setLastTrackingToken] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Fixar origem automaticamente com as configurações da farmácia
  useEffect(() => {
    if (pharmacySettings) {
      setOrigin(pharmacySettings.address);
      setOriginCoords({ lat: pharmacySettings.lat, lng: pharmacySettings.lng });
    }
  }, [pharmacySettings]);

  const calculateRoute = async () => {
    if (originCoords && destCoords) {
      const routeData = await calculateMapboxRoute(
        originCoords.lng, originCoords.lat, destCoords.lng, destCoords.lat
      );

      if (routeData?.routes?.[0]) {
        const route = routeData.routes[0];
        const dist = route.distance / 1000;
        const time = Math.round(route.duration / 60);
        const basePrice = pharmacySettings?.base_price || 5;
        const pricePerKm = pharmacySettings?.price_per_km || 2;
        setDistance(dist);
        setEstimatedTime(time);
        setPrice(basePrice + (dist * pricePerKm));
        setRouteCoordinates(route.geometry.coordinates);
      }
    }
  };

  // Detectar e processar CEP ou endereço automaticamente
  const handleDestinationInput = async (input: string, coords?: { lat: number; lng: number }) => {
    // Se coords já foi passado (do autocomplete), usar diretamente
    if (coords) {
      setDestination(input);
      setDestCoords(coords);
      if (originCoords) calculateRoute();
      return;
    }

    const cleaned = input.replace(/\D/g, '');
    
    // Detectar se é CEP (8 dígitos)
    if (cleaned.length === 8) {
      setIsSearchingCep(true);
      const data = await searchCep(cleaned);
      if (data) {
        const address = formatAddress(data);
        const result = await geocodeAddress(address);
        if (result) {
          setDestination(address);
          setDestCoords({ lat: result.center[1], lng: result.center[0] });
          if (originCoords) calculateRoute();
          toast.success("CEP encontrado!");
        }
      } else {
        toast.error("CEP não encontrado");
      }
      setIsSearchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originCoords || !destCoords || !distance || !estimatedTime || !price) {
      toast.error("Preencha todos os dados da entrega");
      return;
    }

    setIsSubmitting(true);
    try {
      const request = await createRequest({
        origin_address: origin,
        origin_lat: originCoords.lat,
        origin_lng: originCoords.lng,
        dest_address: destination,
        dest_lat: destCoords.lat,
        dest_lng: destCoords.lng,
        distance,
        estimated_time: estimatedTime,
        estimated_price: price,
      });

      if (request) {
        setLastTrackingToken(request.tracking_token);
        // Reset form (mantém origem fixa)
        setDestination("");
        setDestCoords(null);
        setDistance(null);
        setEstimatedTime(null);
        setPrice(null);
        setRouteCoordinates(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Nova Entrega</h1>
          <p className="text-muted-foreground">
            Preencha o destino da sua entrega e acompanhe em tempo real
          </p>
        </div>

        {/* Card de Origem Fixa */}
        {loadingSettings ? (
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Carregando configurações...</span>
            </div>
          </Card>
        ) : pharmacySettings ? (
          <Card className="p-4 bg-primary/10 border-primary/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Origem da Entrega (Fixo)</p>
                <p className="font-semibold truncate">{pharmacySettings.pharmacy_name}</p>
                <p className="text-sm text-muted-foreground">{pharmacySettings.address}</p>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="p-6 shadow-elevated">
          <Tabs defaultValue="address" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="address" className="touch-target">
                <MapPin className="h-4 w-4 mr-2" />
                Endereço/CEP
              </TabsTrigger>
              <TabsTrigger value="map" className="touch-target">
                <Navigation className="h-4 w-4 mr-2" />
                Mapa
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6">
              <TabsContent value="address" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Endereço ou CEP de Entrega</Label>
                  <AddressAutocomplete
                    value={destination}
                    onChange={(address, coords) => {
                      handleDestinationInput(address, coords);
                    }}
                    placeholder="Digite o endereço ou CEP (ex: 47670-025)"
                    className="touch-target"
                  />
                  {isSearchingCep && (
                    <Badge variant="secondary" className="mt-1">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      CEP detectado - Buscando endereço...
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Digite o endereço completo ou apenas o CEP para buscar automaticamente
                  </p>
                </div>

                {distance && estimatedTime && price && (
                  <div className="space-y-4 mt-6">
                    {routeCoordinates && originCoords && destCoords && (
                      <div className="h-[300px] rounded-lg overflow-hidden border">
                        <MapboxMap
                          center={[originCoords.lng, originCoords.lat]}
                          zoom={12}
                          markers={[
                            { lng: originCoords.lng, lat: originCoords.lat, color: '#22c55e', label: 'Origem' },
                            { lng: destCoords.lng, lat: destCoords.lat, color: '#ef4444', label: 'Destino' }
                          ]}
                          route={routeCoordinates}
                        />
                      </div>
                    )}

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Distância estimada:</span>
                        <span className="text-muted-foreground">{distance.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Tempo estimado:</span>
                        <span className="text-muted-foreground">{estimatedTime} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">Valor:</span>
                        <span className="text-2xl font-bold text-primary">R$ {price.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full touch-target shadow-glow" 
                      size="lg"
                      disabled={!originCoords || !destCoords || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Solicitar Entrega'
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map" className="space-y-4">
                {!destCoords && originCoords ? (
                  <MapPicker
                    label="Clique no mapa para selecionar o local de entrega"
                    fixedOrigin={originCoords ? { lat: originCoords.lat, lng: originCoords.lng, label: pharmacySettings?.pharmacy_name || 'Origem' } : undefined}
                    initialCenter={[originCoords.lng, originCoords.lat]}
                    onSelect={(address, coords) => {
                      setDestination(address);
                      setDestCoords({ lat: coords[1], lng: coords[0] });
                      calculateRoute();
                      toast.success("Destino selecionado e rota calculada!");
                    }}
                  />
                ) : destCoords && originCoords ? (
                  <div className="space-y-4">
                    {routeCoordinates && (
                      <div className="h-[400px] rounded-lg overflow-hidden border">
                        <MapboxMap
                          center={[originCoords.lng, originCoords.lat]}
                          zoom={13}
                          markers={[
                            { lng: originCoords.lng, lat: originCoords.lat, color: '#22c55e', label: 'Origem' },
                            { lng: destCoords.lng, lat: destCoords.lat, color: '#ef4444', label: 'Destino' }
                          ]}
                          route={routeCoordinates}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Origem:</span> {origin}</p>
                      <p className="text-sm"><span className="font-medium">Destino:</span> {destination}</p>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => {
                          setDestCoords(null);
                          setDestination("");
                          setRouteCoordinates(null);
                          setDistance(null);
                          setEstimatedTime(null);
                          setPrice(null);
                        }}
                        className="w-full"
                      >
                        Selecionar Outro Destino
                      </Button>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Distância estimada:</span>
                        <span className="text-muted-foreground">{distance ? `${distance.toFixed(1)} km` : '--'}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Tempo estimado:</span>
                        <span className="text-muted-foreground">{estimatedTime ? `${estimatedTime} min` : '--'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">Valor:</span>
                        <span className="text-2xl font-bold text-primary">{price ? `R$ ${price.toFixed(2)}` : 'R$ --'}</span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full touch-target shadow-glow" 
                      size="lg"
                      disabled={!originCoords || !destCoords || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Solicitar Entrega'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    Carregando mapa...
                  </div>
                )}
              </TabsContent>
            </form>
          </Tabs>
        </Card>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Minhas Entregas</h2>
          {loadingRequests ? (
            <Card className="p-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          ) : requests.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground py-8">
                Nenhuma entrega ainda. Crie sua primeira entrega acima!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const statusMap: Record<string, { label: string; className: string }> = {
                  pending: { label: "Pendente", className: "bg-yellow-500 text-white" },
                  assigned: { label: "Atribuído", className: "bg-blue-500 text-white" },
                  completed: { label: "Concluído", className: "bg-green-500 text-white" },
                  cancelled: { label: "Cancelado", className: "bg-red-500 text-white" },
                };
                const status = statusMap[request.status] || statusMap.pending;

                return (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-5 w-5 text-primary" />
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">Origem: {request.origin_address}</p>
                          <p className="font-medium">Destino: {request.dest_address}</p>
                          <p className="text-muted-foreground">
                            {request.distance ? `${request.distance.toFixed(1)} km` : '--'} • {request.estimated_time ? `${request.estimated_time} min` : '--'}
                          </p>
                          {request.estimated_price && (
                            <p className="text-lg font-bold text-primary">
                              R$ {request.estimated_price.toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Criado em: {new Date(request.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <ShareTrackingButton trackingToken={request.tracking_token} />
                        {request.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelRequest(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cliente;
