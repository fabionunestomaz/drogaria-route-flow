import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Package, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDriverRoutes } from "@/hooks/useDriverRoutes";
import { useNavigate } from "react-router-dom";
import RouteMap from "@/components/RouteMap";

const Motoboy = () => {
  const navigate = useNavigate();
  const { activeBatch, historyBatches, loading, updateDeliveryStatus, updateBatchStatus } = useDriverRoutes();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
      case "assigned":
        return "bg-warning";
      case "completed":
      case "delivered":
        return "bg-success";
      case "pending":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_progress":
        return "Em Rota";
      case "assigned":
        return "Atribuída";
      case "completed":
        return "Concluída";
      case "delivered":
        return "Entregue";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  const handleStartRoute = async () => {
    if (!activeBatch) return;
    
    const success = await updateBatchStatus(activeBatch.id, 'in_progress');
    if (success) {
      toast.success('Rota iniciada!');
    } else {
      toast.error('Erro ao iniciar rota');
    }
  };

  const handleCompleteDelivery = async (deliveryId: string) => {
    const success = await updateDeliveryStatus(deliveryId, 'delivered');
    if (success) {
      toast.success('Entrega confirmada!');
    } else {
      toast.error('Erro ao confirmar entrega');
    }
  };

  const handleNavigate = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeDeliveries = activeBatch?.deliveries || [];
  const completedCount = activeDeliveries.filter(d => d.status === 'delivered').length;
  const pendingCount = activeDeliveries.length - completedCount;
  const nextDelivery = activeDeliveries.find(d => d.status !== 'delivered');

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Minhas Rotas</h1>
          <p className="text-muted-foreground">
            Gerencie suas entregas e atualize o status em tempo real
          </p>
        </div>

        {!activeBatch ? (
          <Card className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma rota ativa</h3>
            <p className="text-muted-foreground">
              Você não possui rotas atribuídas no momento
            </p>
          </Card>
        ) : (
          <>
            {/* Status Card */}
            <Card className="p-6 mb-8 shadow-elevated gradient-surface">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Rota Ativa</h2>
                <Badge className={`${getStatusColor(activeBatch.status)} text-white`}>
                  {getStatusText(activeBatch.status)}
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de Paradas</p>
                  <p className="text-2xl font-bold">{activeDeliveries.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold text-success">{completedCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Distância Total</p>
                  <p className="text-2xl font-bold">{(activeBatch.total_distance || 0).toFixed(1)} km</p>
                </div>
              </div>
              {activeBatch.status === 'assigned' && (
                <div className="mt-4">
                  <Button 
                    className="w-full touch-target" 
                    size="lg"
                    onClick={handleStartRoute}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    Iniciar Rota
                  </Button>
                </div>
              )}
              {nextDelivery && (
                <div className="mt-4">
                  <Button 
                    className="w-full touch-target" 
                    size="lg"
                    variant="outline"
                    onClick={() => handleNavigate(nextDelivery.lat, nextDelivery.lng)}
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    Navegar para Próxima Parada
                  </Button>
                </div>
              )}
            </Card>

            {/* Map */}
            {activeBatch.optimized_route && (
              <Card className="mb-8 h-[400px] overflow-hidden">
                <RouteMap
                  origin={
                    activeBatch.optimized_route?.waypoints?.[0]
                      ? {
                          lat: activeBatch.optimized_route.waypoints[0].lat,
                          lng: activeBatch.optimized_route.waypoints[0].lng,
                          label: 'Origem'
                        }
                      : undefined
                  }
                  destinations={activeDeliveries.map((d) => ({
                    lat: d.lat,
                    lng: d.lng,
                    label: d.customer.name,
                    sequence: d.sequence
                  }))}
                  route={activeBatch.optimized_route?.coordinates}
                />
              </Card>
            )}

            {/* Stops List */}
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl font-bold">Sequência de Paradas</h2>
              {activeDeliveries.map((delivery) => (
                <Card key={delivery.id} className="p-4 hover:shadow-elevated transition-smooth">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {delivery.sequence}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Entrega
                        </Badge>
                        <Badge className={`${getStatusColor(delivery.status)} text-white text-xs`}>
                          {getStatusText(delivery.status)}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{delivery.customer.name}</p>
                      <p className="text-sm text-muted-foreground mb-1">{delivery.customer.phone}</p>
                      <p className="text-sm mb-1">{delivery.address}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        Pedido #{delivery.order_number}
                      </div>
                      {delivery.notes && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">{delivery.notes}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      {delivery.status !== 'delivered' && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="touch-target"
                            onClick={() => handleNavigate(delivery.lat, delivery.lng)}
                          >
                            <MapPin className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            className="touch-target bg-success hover:bg-success/90"
                            onClick={() => handleCompleteDelivery(delivery.id)}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Routes History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Histórico de Rotas</h2>
          {historyBatches.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma rota concluída ainda</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {historyBatches.map((batch) => {
                const completed = batch.deliveries.filter(d => d.status === 'delivered').length;
                return (
                  <Card key={batch.id} className="p-4 hover:shadow-elevated transition-smooth">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-5 w-5 text-primary" />
                          <span className="font-medium">Rota {new Date(batch.created_at).toLocaleDateString()}</span>
                          <Badge className={`${getStatusColor(batch.status)} text-white`}>
                            {getStatusText(batch.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {new Date(batch.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm">
                          {completed}/{batch.deliveries.length} paradas concluídas
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="touch-target"
                        onClick={() => navigate(`/route-details/${batch.id}`)}
                      >
                        Ver Detalhes
                      </Button>
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

export default Motoboy;
