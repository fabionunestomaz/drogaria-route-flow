import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const Motoboy = () => {
  const mockRoutes = [
    {
      id: 1,
      date: "2025-01-20",
      status: "enroute",
      stops: 8,
      completed: 3,
      current: "Rua das Flores, 123",
      eta: "12 min",
    },
    {
      id: 2,
      date: "2025-01-19",
      status: "completed",
      stops: 12,
      completed: 12,
      current: null,
      eta: null,
    },
  ];

  const mockStops = [
    {
      id: 1,
      seq: 1,
      type: "pickup",
      address: "Av. Luís Eduardo Magalhães, 500",
      status: "delivered",
      time: "09:30",
    },
    {
      id: 2,
      seq: 2,
      type: "dropoff",
      address: "Rua das Flores, 123",
      status: "enroute",
      time: "10:15 (ETA)",
    },
    {
      id: 3,
      seq: 3,
      type: "dropoff",
      address: "Praça Central, 45",
      status: "pending",
      time: "10:45 (ETA)",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enroute":
        return "bg-warning";
      case "completed":
        return "bg-success";
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
      case "enroute":
        return "Em Rota";
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

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Minhas Rotas</h1>
          <p className="text-muted-foreground">
            Gerencie suas entregas e atualize o status em tempo real
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-6 mb-8 shadow-elevated gradient-surface">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Rota Ativa</h2>
            <Badge className={`${getStatusColor("enroute")} text-white`}>
              Em Rota
            </Badge>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Paradas</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold text-success">3</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-warning">5</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Próxima ETA</p>
              <p className="text-2xl font-bold">12 min</p>
            </div>
          </div>
          <div className="mt-4">
            <Button className="w-full touch-target" size="lg">
              <Navigation className="mr-2 h-5 w-5" />
              Abrir Navegação
            </Button>
          </div>
        </Card>

        {/* Stops List */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Sequência de Paradas</h2>
          {mockStops.map((stop) => (
            <Card key={stop.id} className="p-4 hover:shadow-elevated transition-smooth">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {stop.seq}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {stop.type === "pickup" ? "Coleta" : "Entrega"}
                    </Badge>
                    <Badge className={`${getStatusColor(stop.status)} text-white text-xs`}>
                      {getStatusText(stop.status)}
                    </Badge>
                  </div>
                  <p className="font-medium mb-1">{stop.address}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {stop.time}
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  {stop.status === "enroute" && (
                    <>
                      <Button
                        size="icon"
                        variant="outline"
                        className="touch-target"
                        onClick={() => toast.success("Chegada confirmada!")}
                      >
                        <MapPin className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        className="touch-target bg-success hover:bg-success/90"
                        onClick={() => toast.success("Entrega confirmada!")}
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

        {/* Routes History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Histórico de Rotas</h2>
          <div className="space-y-4">
            {mockRoutes.map((route) => (
              <Card key={route.id} className="p-4 hover:shadow-elevated transition-smooth">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-medium">Rota #{route.id}</span>
                      <Badge className={`${getStatusColor(route.status)} text-white`}>
                        {getStatusText(route.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{route.date}</p>
                    <p className="text-sm">
                      {route.completed}/{route.stops} paradas concluídas
                    </p>
                  </div>
                  <Button variant="outline" className="touch-target">
                    Ver Detalhes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Navigation = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

export default Motoboy;
