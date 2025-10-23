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
import { useAdminDeliveryRequests } from "@/hooks/useAdminDeliveryRequests";
import { useDriverApprovals } from "@/hooks/useDriverApprovals";
import RouteMap from "@/components/RouteMap";
import ClusteredMap from "@/components/ClusteredMap";
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
import SeedDataButton from "@/components/SeedDataButton";
import { Settings, Calculator } from "lucide-react";

const Admin = () => {
  const { batches, kpis, loading, deleteBatch, updateBatchStatus, reassignDriver } = useAdminData();
  const { requests: deliveryRequests, loading: loadingRequests, deleteRequest } = useAdminDeliveryRequests();
  const { drivers } = useDrivers();
  const { pendingDrivers, loading: loadingDrivers, approveDriver, rejectDriver } = useDriverApprovals();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [deleteRequestDialogOpen, setDeleteRequestDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

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

  const handleDeleteRequestConfirm = async () => {
    if (selectedRequestId) {
      await deleteRequest(selectedRequestId);
      setDeleteRequestDialogOpen(false);
      setSelectedRequestId(null);
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
            <div className="flex gap-2">
              <Button onClick={() => navigate('/settings')} variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
              <Button onClick={() => navigate('/pricing-settings')} variant="outline" size="sm">
                <Calculator className="mr-2 h-4 w-4" />
                Calculadora
              </Button>
              <Button onClick={() => navigate('/analytics')} variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <SeedDataButton />
              <Button onClick={() => navigate('/new-route')} size="lg">
                <Package className="mr-2 h-5 w-5" />
                Nova Rota
              </Button>
            </div>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="monitor">
                <MapPin className="h-4 w-4 mr-2" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="requests">
                <AlertCircle className="h-4 w-4 mr-2" />
                Solicitações
              </TabsTrigger>
              <TabsTrigger value="drivers">
                <UserPlus className="h-4 w-4 mr-2" />
                Motoristas
                {pendingDrivers.length > 0 && (
                  <Badge className="ml-2 bg-red-500">{pendingDrivers.length}</Badge>
                )}
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
              {/* Clustered Map */}
              <ClusteredMap
                deliveries={activeBatches.flatMap(batch =>
                  batch.deliveries.map(d => ({
                    id: d.id,
                    lat: d.lat,
                    lng: d.lng,
                    status: d.status,
                    address: d.address,
                    customerName: d.customers?.name,
                    driverName: batch.driver?.profiles?.[0]?.name,
                    orderNumber: (d as any).order_number
                  }))
                )}
              />

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
                                  {batch.driver?.profiles?.[0]?.name || 'Sem motorista'}
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
                                       {driver.profiles?.[0]?.name || 'Motorista'}
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

            <TabsContent value="requests" className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Solicitações de Clientes ({deliveryRequests.length})</h2>
                </div>

                {loadingRequests ? (
                  <Card className="p-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </Card>
                ) : deliveryRequests.length === 0 ? (
                  <Card className="p-6">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Nenhuma solicitação pendente</p>
                      <p className="text-sm text-muted-foreground">
                        As solicitações de entrega dos clientes aparecerão aqui
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {deliveryRequests.map((request) => (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-primary" />
                              <Badge className="bg-yellow-500 text-white">
                                Aguardando
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
                                Solicitado em: {new Date(request.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Implementar criação de lote a partir da solicitação
                                navigate('/new-route', { 
                                  state: { 
                                    requestId: request.id,
                                    origin: { lat: request.origin_lat, lng: request.origin_lng, address: request.origin_address },
                                    destination: { lat: request.dest_lat, lng: request.dest_lng, address: request.dest_address }
                                  }
                                });
                              }}
                            >
                              Criar Lote
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequestId(request.id);
                                setDeleteRequestDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="drivers" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Motoristas Aguardando Aprovação ({pendingDrivers.length})
                </h2>

                {loadingDrivers ? (
                  <Card className="p-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </Card>
                ) : pendingDrivers.length === 0 ? (
                  <Card className="p-6">
                    <div className="text-center">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Nenhum motorista aguardando aprovação</p>
                      <p className="text-sm text-muted-foreground">
                        Novos cadastros de motoristas aparecerão aqui
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingDrivers.map((driver) => (
                      <Card key={driver.id} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{driver.profiles?.name || 'Nome não informado'}</h3>
                              <p className="text-sm text-muted-foreground">{driver.profiles?.phone || 'Telefone não informado'}</p>
                              <p className="text-sm text-muted-foreground mt-1">CNH: {driver.cnh_number}</p>
                              <p className="text-sm text-muted-foreground">Veículo: {driver.vehicle_type} - {driver.plate}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Cadastrado em: {new Date(driver.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <Badge className="bg-yellow-500">Pendente</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <a 
                              href={driver.cnh_front_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="aspect-video rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors">
                                <img 
                                  src={driver.cnh_front_url} 
                                  alt="CNH Frente" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-center mt-2 text-muted-foreground">CNH Frente</p>
                            </a>
                            <a 
                              href={driver.cnh_back_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="aspect-video rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors">
                                <img 
                                  src={driver.cnh_back_url} 
                                  alt="CNH Verso" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-center mt-2 text-muted-foreground">CNH Verso</p>
                            </a>
                            <a 
                              href={driver.selfie_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="aspect-video rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors">
                                <img 
                                  src={driver.selfie_url} 
                                  alt="Selfie" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-center mt-2 text-muted-foreground">Selfie</p>
                            </a>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => approveDriver(driver.id)}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button 
                              onClick={() => rejectDriver(driver.id)}
                              variant="destructive"
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
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
                                       {driver.profiles?.[0]?.name || 'Motorista'}
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
                                  {batch.driver?.profiles?.[0]?.name || 'Sem motorista'}
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

      <AlertDialog open={deleteRequestDialogOpen} onOpenChange={setDeleteRequestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta solicitação de entrega? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequestConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Admin;
