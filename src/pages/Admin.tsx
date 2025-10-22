import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Clock,
  CheckCircle,
  Users,
  MapPin,
  BarChart3,
  Trash2,
  RefreshCw,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { useDrivers } from "@/hooks/useDrivers";
import RouteMap from "@/components/RouteMap";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { batches, kpis, loading, deleteBatch, updateBatchStatus, reassignDriver } = useAdminData();
  const { drivers } = useDrivers();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const handleDeleteClick = (batchId: string) => {
    setSelectedBatchId(batchId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedBatchId) {
      await deleteBatch(selectedBatchId);
      setDeleteDialogOpen(false);
      setSelectedBatchId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-500 text-white" },
      in_progress: { label: "Em Progresso", className: "bg-blue-500 text-white" },
      completed: { label: "Concluído", className: "bg-green-500 text-white" },
      cancelled: { label: "Cancelado", className: "bg-red-500 text-white" },
    };
    return statusMap[status] || statusMap.pending;
  };

  const activeBatches = batches.filter(b => b.status === 'in_progress');
  const pendingBatches = batches.filter(b => b.status === 'pending');
  const completedBatches = batches.filter(b => b.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpiData = [
    {
      label: "Entregas Hoje",
      value: kpis.deliveriesToday.toString(),
      icon: Package,
      color: "text-primary",
    },
    {
      label: "Taxa de Sucesso",
      value: `${kpis.successRate}%`,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "Motoboys Ativos",
      value: kpis.activeDrivers.toString(),
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Tempo Médio",
      value: `${kpis.averageTime}min`,
      icon: Clock,
      color: "text-orange-500",
    },
  ];

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Dashboard Administrativo
              </h1>
              <p className="text-muted-foreground">
                Monitore operações, planeje rotas e analise indicadores em tempo real
              </p>
            </div>
            <Button onClick={() => navigate('/new-route')} size="lg">
              <Package className="mr-2 h-5 w-5" />
              Nova Rota
            </Button>
          </div>

          {/* KPIs Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiData.map((kpi, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-2">
                  <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold">{kpi.value}</p>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="monitor" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monitor">
                <MapPin className="h-4 w-4 mr-2" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="planner">
                <Package className="h-4 w-4 mr-2" />
                Pendentes
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Concluídos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monitor" className="space-y-6">
              {/* Map */}
              {activeBatches.length > 0 ? (
                <Card className="p-4">
                  <div className="h-[400px] rounded-lg overflow-hidden">
                    <RouteMap
                      destinations={activeBatches.flatMap(batch => 
                        batch.deliveries.map(d => ({
                          lat: d.lat,
                          lng: d.lng,
                          label: d.customers.name,
                          sequence: d.sequence
                        }))
                      )}
                    />
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <div className="bg-muted/50 rounded-lg h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Nenhuma rota ativa</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Crie uma nova rota ou atribua um motorista aos lotes pendentes
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Active Routes */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Rotas Ativas ({activeBatches.length})</h2>
                {activeBatches.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-center text-muted-foreground">Nenhuma rota ativa no momento</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {activeBatches.map((batch) => {
                      const completed = batch.deliveries.filter(d => d.status === 'delivered').length;
                      const total = batch.deliveries.length;
                      const statusBadge = getStatusBadge(batch.status);

                      return (
                        <Card key={batch.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">
                                  {batch.driver?.profiles?.name || 'Sem motorista'}
                                </h3>
                                <Badge className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {completed}/{total} paradas concluídas
                              </p>
                              {batch.total_distance && (
                                <p className="text-sm text-muted-foreground">
                                  Distância: {(batch.total_distance / 1000).toFixed(1)} km
                                </p>
                              )}
                              {batch.total_price && (
                                <p className="text-sm text-muted-foreground">
                                  Valor: R$ {batch.total_price.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/route-details/${batch.id}`)}
                              >
                                Ver Rota
                              </Button>
                              <Select onValueChange={(value) => reassignDriver(batch.id, value || null)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Reatribuir" />
                                </SelectTrigger>
                                <SelectContent>
                                  {drivers.map(driver => (
                                    <SelectItem key={driver.id} value={driver.user_id}>
                                      {driver.profiles.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateBatchStatus(batch.id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Concluir
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(batch.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="planner" className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Lotes Pendentes ({pendingBatches.length})</h2>
                  <Button onClick={() => navigate('/new-route')}>
                    <Package className="mr-2 h-4 w-4" />
                    Criar Nova Rota
                  </Button>
                </div>

                {pendingBatches.length === 0 ? (
                  <Card className="p-6">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Nenhum lote pendente</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Crie uma nova rota para começar a planejar entregas
                      </p>
                      <Button onClick={() => navigate('/new-route')}>
                        Criar Primeira Rota
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingBatches.map((batch) => {
                      const statusBadge = getStatusBadge(batch.status);
                      return (
                        <Card key={batch.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {batch.deliveries.length} entregas
                              </p>
                              {batch.total_distance && (
                                <p className="text-sm text-muted-foreground">
                                  Distância: {(batch.total_distance / 1000).toFixed(1)} km
                                </p>
                              )}
                              {batch.total_price && (
                                <p className="text-sm text-muted-foreground">
                                  Valor: R$ {batch.total_price.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Select onValueChange={(value) => {
                                reassignDriver(batch.id, value);
                                updateBatchStatus(batch.id, 'in_progress');
                              }}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Atribuir motorista" />
                                </SelectTrigger>
                                <SelectContent>
                                  {drivers.filter(d => d.shift_status === 'online').map(driver => (
                                    <SelectItem key={driver.id} value={driver.user_id}>
                                      {driver.profiles.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/route-details/${batch.id}`)}
                              >
                                Ver Detalhes
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(batch.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Lotes Concluídos ({completedBatches.length})</h2>
                
                {completedBatches.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-center text-muted-foreground">Nenhum lote concluído ainda</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {completedBatches.map((batch) => {
                      const completed = batch.deliveries.filter(d => d.status === 'delivered').length;
                      const total = batch.deliveries.length;
                      const statusBadge = getStatusBadge(batch.status);

                      return (
                        <Card key={batch.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">
                                  {batch.driver?.profiles?.name || 'Sem motorista'}
                                </h3>
                                <Badge className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {completed}/{total} entregas realizadas
                              </p>
                              {batch.total_distance && (
                                <p className="text-sm text-muted-foreground">
                                  Distância: {(batch.total_distance / 1000).toFixed(1)} km
                                </p>
                              )}
                              {batch.total_price && (
                                <p className="text-sm text-muted-foreground">
                                  Valor: R$ {batch.total_price.toFixed(2)}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Concluído em: {new Date(batch.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/route-details/${batch.id}`)}
                              >
                                Ver Detalhes
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(batch.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita e todas as entregas associadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Admin;
