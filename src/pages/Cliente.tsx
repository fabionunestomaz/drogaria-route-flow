import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, Navigation } from "lucide-react";
import { toast } from "sonner";
import ShareTrackingButton from "@/components/ShareTrackingButton";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import MapPicker from "@/components/MapPicker";
import { searchCep, formatAddress } from "@/lib/viaCep";
import { calculateDistance, geocodeAddress } from "@/lib/mapbox";

const Cliente = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [cepOrigin, setCepOrigin] = useState("");
  const [cepDest, setCepDest] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  const calculateRoute = () => {
    if (originCoords && destCoords) {
      const dist = calculateDistance(
        originCoords[1], originCoords[0],
        destCoords[1], destCoords[0]
      );
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
          setOriginCoords(result.center);
        } else {
          setDestination(address);
          setDestCoords(result.center);
        }
        toast.success("CEP encontrado!");
      }
    } else {
      toast.error("CEP não encontrado");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate creating a ride with tracking token
    const mockToken = crypto.randomUUID();
    setTrackingToken(mockToken);
    toast.success("Pedido criado com sucesso! Compartilhe o link de rastreamento.");
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
                      setOrigin(address);
                      setOriginCoords(coords);
                      toast.success("Origem selecionada!");
                    }}
                  />
                ) : !destCoords ? (
                  <MapPicker
                    label="Clique no mapa para selecionar o destino"
                    initialCenter={originCoords}
                    onSelect={(address, coords) => {
                      setDestination(address);
                      setDestCoords(coords);
                      calculateRoute();
                      toast.success("Destino selecionado!");
                    }}
                  />
                ) : (
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
                )}
              </TabsContent>

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
                  <Button type="submit" className="flex-1 touch-target shadow-glow" size="lg">
                    Solicitar Entrega
                  </Button>
                  {trackingToken && (
                    <ShareTrackingButton trackingToken={trackingToken} />
                  )}
                </div>
              </div>
            </form>
          </Tabs>
        </Card>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Minhas Entregas</h2>
          <Card className="p-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhuma entrega ainda. Crie sua primeira entrega acima!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cliente;
