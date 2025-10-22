import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, Navigation } from "lucide-react";
import { toast } from "sonner";
import ShareTrackingButton from "@/components/ShareTrackingButton";

const Cliente = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

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
                  <Input
                    id="origin"
                    placeholder="Digite o endereço de coleta..."
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="touch-target"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: Av. Luís Eduardo Magalhães, São Félix do Coribe - BA
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Endereço de Entrega</Label>
                  <Input
                    id="destination"
                    placeholder="Digite o endereço de entrega..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="touch-target"
                  />
                </div>
              </TabsContent>

              <TabsContent value="cep" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cep-origin">CEP de Coleta</Label>
                  <Input
                    id="cep-origin"
                    placeholder="00000-000"
                    maxLength={9}
                    className="touch-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep-dest">CEP de Entrega</Label>
                  <Input
                    id="cep-dest"
                    placeholder="00000-000"
                    maxLength={9}
                    className="touch-target"
                  />
                </div>
              </TabsContent>

              <TabsContent value="map" className="space-y-4">
                <div className="bg-muted rounded-lg p-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Componente de mapa Mapbox será integrado aqui
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique no mapa para selecionar origem e destino
                  </p>
                </div>
              </TabsContent>

              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Distância estimada:</span>
                    <span className="text-muted-foreground">--</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Tempo estimado:</span>
                    <span className="text-muted-foreground">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">Valor:</span>
                    <span className="text-2xl font-bold text-primary">R$ --</span>
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
