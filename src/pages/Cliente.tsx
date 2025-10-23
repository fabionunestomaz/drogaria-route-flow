import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, Package, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ShareTrackingButton from "@/components/ShareTrackingButton";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import MapPicker from "@/components/MapPicker";
import { searchCep, formatAddress } from "@/lib/viaCep";
import { calculateDistance, geocodeAddress } from "@/lib/mapbox";
import { useDeliveryRequests } from "@/hooks/useDeliveryRequests";

const Cliente = () => {
  const { requests, loading: loadingRequests, createRequest, cancelRequest } = useDeliveryRequests();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastTrackingToken, setLastTrackingToken] = useState<string | null>(null);
  const [cepOrigin, setCepOrigin] = useState("");
  const [cepDest, setCepDest] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateRoute = () => {
    if (originCoords && destCoords) {
      console.log('📍 Calculando rota:', {
        origem: { lat: originCoords.lat, lng: originCoords.lng },
        destino: { lat: destCoords.lat, lng: destCoords.lng }
      });
      const dist = calculateDistance(
        originCoords.lat, originCoords.lng,
        destCoords.lat, destCoords.lng
      );
      console.log(`📏 Distância calculada: ${dist.toFixed(2)} km`);
      setDistance(dist);
      const time = Math.round(dist / 30 * 60); // 30km/h média
      setEstimatedTime(time);
      setPrice(Math.max(10, dist * 3)); // R$ 3/km, mínimo R$ 10
    }
  };

  const handleCepSearch = async (cep: string, type: 'origin' | 'dest') => {
    const data = await searchCep(cep);
    if (data) {
      const address = formatAddress(data);
      const result = await geocodeAddress(address);
      if (result) {
        if (type === 'origin') {
          setOrigin(address);
          setOriginCoords({ lat: result.center[1], lng: result.center[0] });
        } else {
          setDestination(address);
          setDestCoords({ lat: result.center[1], lng: result.center[0] });
        }
        toast.success("CEP encontrado!");
      }
    } else {
      toast.error("CEP não encontrado");
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
        // Reset form
        setOrigin("");
        setDestination("");
        setOriginCoords(null);
        setDestCoords(null);
        setDistance(null);
        setEstimatedTime(null);
        setPrice(null);
        setCepOrigin("");
        setCepDest("");
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
            Preencha os dados da sua entrega e acompanhe em tempo real
          </p>
        </div>

        <Card className="p-6 shadow-elevated">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="touch-target">
                <Search className="h-4 w-4 mr-2" />
                Busca
              </TabsTrigger>
              <TabsTrigger value="cep" className="touch-target">
                <MapPin className="h-4 w-4 mr-2" />
                CEP
              </TabsTrigger>
              <TabsTrigger value="map" className="touch-target">
                <Navigation className="h-4 w-4 mr-2" />
                Mapa
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6">
              <TabsContent value="search" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Endereço de Coleta</Label>
                  <AddressAutocomplete
                    value={origin}
                    onChange={(address, coords) => {
                      setOrigin(address);
                      if (coords) {
                        setOriginCoords(coords);
                        if (destCoords) calculateRoute();
                      }
                    }}
                    placeholder="Digite o endereço de coleta..."
                    className="touch-target"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: Av. Luís Eduardo Magalhães, São Félix do Coribe - BA
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Endereço de Entrega</Label>
                  <AddressAutocomplete
                    value={destination}
                    onChange={(address, coords) => {
                      setDestination(address);
                      if (coords) {
                        setDestCoords(coords);
                        if (originCoords) calculateRoute();
                      }
                    }}
                    placeholder="Digite o endereço de entrega..."
                    className="touch-target"
                  />
                </div>
              </TabsContent>

              <TabsContent value="cep" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cep-origin">CEP de Coleta</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep-origin"
                      placeholder="00000-000"
                      maxLength={9}
                      value={cepOrigin}
                      onChange={(e) => setCepOrigin(e.target.value)}
                      className="touch-target flex-1"
                    />
                    <Button 
                      type="button"
                      onClick={() => handleCepSearch(cepOrigin, 'origin')}
                      disabled={cepOrigin.replace(/\D/g, '').length !== 8}
                    >
                      Buscar
                    </Button>
                  </div>
                  {origin && <p className="text-xs text-muted-foreground mt-1">{origin}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep-dest">CEP de Entrega</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep-dest"
                      placeholder="00000-000"
                      maxLength={9}
                      value={cepDest}
                      onChange={(e) => setCepDest(e.target.value)}
                      className="touch-target flex-1"
                    />
                    <Button 
                      type="button"
                      onClick={() => handleCepSearch(cepDest, 'dest')}
                      disabled={cepDest.replace(/\D/g, '').length !== 8}
                    >
                      Buscar
                    </Button>
                  </div>
                  {destination && <p className="text-xs text-muted-foreground mt-1">{destination}</p>}
                </div>
              </TabsContent>

              <TabsContent value="map" className="space-y-4">
                {!originCoords ? (
                  <MapPicker
                    label="Clique no mapa para selecionar a origem"
                    onSelect={(address, coords) => {
                      console.log('✅ Cliente - Origem selecionada:', {
                        address,
                        coordsRecebidas: coords,
                        coordsSalvas: { lat: coords[1], lng: coords[0] }
                      });
                      setOrigin(address);
                      setOriginCoords({ lat: coords[1], lng: coords[0] });
                      toast.success("Origem selecionada!");
                    }}
                  />
                ) : !destCoords ? (
                  <MapPicker
                    label="Clique no mapa para selecionar o destino"
                    initialCenter={[originCoords.lng, originCoords.lat]}
                    onSelect={(address, coords) => {
                      console.log('✅ Cliente - Destino selecionado:', {
                        address,
                        coordsRecebidas: coords,
                        coordsSalvas: { lat: coords[1], lng: coords[0] }
                      });
                      setDestination(address);
                      setDestCoords({ lat: coords[1], lng: coords[0] });
                      calculateRoute();
                      toast.success("Destino selecionado!");
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Origem: {origin}</p>
                      <p className="text-sm font-medium">Destino: {destination}</p>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => {
                          setOriginCoords(null);
                          setDestCoords(null);
                          setOrigin("");
                          setDestination("");
                        }}
                      >
                        Selecionar Novamente
                      </Button>
                    </div>

                    {/* Resumo da rota na aba Mapa */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Distância estimada:</span>
                        <span className="text-muted-foreground">
                          {distance ? `${distance.toFixed(1)} km` : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Tempo estimado:</span>
                        <span className="text-muted-foreground">
                          {estimatedTime ? `${estimatedTime} min` : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">Valor:</span>
                        <span className="text-2xl font-bold text-primary">
                          {price ? `R$ ${price.toFixed(2)}` : 'R$ --'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        className="flex-1 touch-target shadow-glow" 
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
                      {lastTrackingToken && (
                        <ShareTrackingButton trackingToken={lastTrackingToken} />
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Resumo da rota nas outras abas */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Distância estimada:</span>
                    <span className="text-muted-foreground">
                      {distance ? `${distance.toFixed(1)} km` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Tempo estimado:</span>
                    <span className="text-muted-foreground">
                      {estimatedTime ? `${estimatedTime} min` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">Valor:</span>
                    <span className="text-2xl font-bold text-primary">
                      {price ? `R$ ${price.toFixed(2)}` : 'R$ --'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 touch-target shadow-glow" 
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
                  {lastTrackingToken && (
                    <ShareTrackingButton trackingToken={lastTrackingToken} />
                  )}
                </div>
              </div>
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
