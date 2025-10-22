import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  BarChart3,
} from "lucide-react";

const Admin = () => {
  const kpis = [
    {
      label: "Entregas Hoje",
      value: "47",
      change: "+12%",
      icon: Package,
      color: "text-primary",
    },
    {
      label: "Taxa de Sucesso",
      value: "94%",
      change: "+3%",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Motoboys Ativos",
      value: "8",
      change: "0",
      icon: Users,
      color: "text-warning",
    },
    {
      label: "Tempo Médio",
      value: "28min",
      change: "-5%",
      icon: Clock,
      color: "text-accent",
    },
  ];

  const activeRoutes = [
    {
      id: 1,
      driver: "João Silva",
      stops: 8,
      completed: 3,
      onTime: true,
      currentLocation: "Av. Principal, 123",
      eta: "2.5h",
    },
    {
      id: 2,
      driver: "Maria Santos",
      stops: 12,
      completed: 7,
      onTime: true,
      currentLocation: "Rua das Flores, 456",
      eta: "3.2h",
    },
    {
      id: 3,
      driver: "Pedro Costa",
      stops: 6,
      completed: 2,
      onTime: false,
      currentLocation: "Praça Central, 789",
      eta: "1.8h",
    },
  ];

  const recentDeliveries = [
    {
      id: 1,
      customer: "Ana Paula",
      address: "Rua A, 100",
      driver: "João Silva",
      status: "delivered",
      time: "10:45",
    },
    {
      id: 2,
      customer: "Carlos Souza",
      address: "Av. B, 200",
      driver: "Maria Santos",
      status: "delivered",
      time: "10:30",
    },
    {
      id: 3,
      customer: "Beatriz Lima",
      address: "Rua C, 300",
      driver: "Pedro Costa",
      status: "enroute",
      time: "10:15",
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground">
            Monitore operações, planeje rotas e analise indicadores em tempo real
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, index) => (
            <Card key={index} className="p-6 hover:shadow-elevated transition-smooth">
              <div className="flex items-start justify-between mb-2">
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                <Badge
                  variant="outline"
                  className={
                    kpi.change.startsWith("+")
                      ? "text-success border-success"
                      : kpi.change === "0"
                      ? "text-muted-foreground"
                      : "text-destructive border-destructive"
                  }
                >
                  {kpi.change}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold">{kpi.value}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitor" className="touch-target">
              <MapPin className="h-4 w-4 mr-2" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="planner" className="touch-target">
              <Package className="h-4 w-4 mr-2" />
              Planner
            </TabsTrigger>
            <TabsTrigger value="reports" className="touch-target">
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-6">
            {/* Map Placeholder */}
            <Card className="p-4">
              <div className="bg-muted/50 rounded-lg h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Mapa em Tempo Real</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Visualização com Mapbox mostrando rotas ativas, posição dos
                    motoboys e status de entregas
                  </p>
                </div>
              </div>
            </Card>

            {/* Active Routes */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Rotas Ativas</h2>
              <div className="space-y-4">
                {activeRoutes.map((route) => (
                  <Card key={route.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{route.driver}</h3>
                          <Badge
                            className={
                              route.onTime
                                ? "bg-success text-white"
                                : "bg-destructive text-white"
                            }
                          >
                            {route.onTime ? "No Prazo" : "Atrasada"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {route.completed}/{route.stops} paradas concluídas
                        </p>
                        <p className="text-sm mb-1">
                          <MapPin className="inline h-4 w-4 mr-1" />
                          {route.currentLocation}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ETA conclusão: {route.eta}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="touch-target">
                          Ver Rota
                        </Button>
                        <Button variant="ghost" size="sm" className="touch-target">
                          Reatribuir
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planner" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Planejador de Rotas</h2>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Otimização Automática de Rotas
                  </p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Selecione pedidos pendentes, defina o depósito e deixe o
                    algoritmo criar rotas otimizadas usando Mapbox Optimization API
                  </p>
                  <Button size="lg" className="touch-target shadow-glow">
                    Criar Nova Rota
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Pedidos Pendentes</h3>
              <div className="space-y-2">
                {recentDeliveries
                  .filter((d) => d.status !== "delivered")
                  .map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{delivery.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {delivery.address}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="touch-target">
                        Adicionar
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Relatórios e KPIs</h2>
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Análise Detalhada</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Gráficos de desempenho, ranking de motoboys, análise de
                  eficiência por período e exportação de dados em CSV
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" className="touch-target">
                    Relatório Diário
                  </Button>
                  <Button variant="outline" className="touch-target">
                    Relatório Mensal
                  </Button>
                  <Button className="touch-target">Exportar CSV</Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Entregas Recentes</h3>
              <div className="space-y-2">
                {recentDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {delivery.status === "delivered" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <Clock className="h-5 w-5 text-warning" />
                      )}
                      <div>
                        <p className="font-medium">{delivery.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {delivery.address} • {delivery.driver}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {delivery.time}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
