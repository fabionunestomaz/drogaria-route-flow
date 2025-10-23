import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import Header from '@/components/Header';
import { TrendingUp, Package, Clock, CheckCircle, DollarSign, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Analytics = () => {
  const { financial, operational, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Receita Total',
      value: `R$ ${financial?.totalRevenue.toFixed(2) || '0.00'}`,
      description: 'Receita acumulada',
      icon: DollarSign,
      trend: '+12.5%',
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${financial?.averageTicket.toFixed(2) || '0.00'}`,
      description: 'Valor médio por entrega',
      icon: TrendingUp,
      trend: '+5.2%',
    },
    {
      title: 'Total de Entregas',
      value: operational?.totalDeliveries || 0,
      description: 'Entregas realizadas',
      icon: Package,
      trend: '+23 esta semana',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${operational?.successRate.toFixed(1) || '0.0'}%`,
      description: 'Entregas bem-sucedidas',
      icon: CheckCircle,
      trend: '+2.1%',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard Analytics</h1>
          <p className="text-muted-foreground">Métricas e indicadores para tomada de decisão</p>
        </div>

        {/* KPIs Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                  <p className="text-xs text-primary mt-2">{metric.trend}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Métricas Operacionais Detalhadas */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Métricas Operacionais
              </CardTitle>
              <CardDescription>Indicadores de desempenho operacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Distância Média</span>
                <span className="font-semibold">{operational?.averageDistance.toFixed(2)} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tempo Médio de Entrega</span>
                <span className="font-semibold">{operational?.averageDeliveryTime || 0} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
                <span className="font-semibold text-green-600">{operational?.successRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Desempenho por Motorista
              </CardTitle>
              <CardDescription>Rankings e métricas individuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Dados de motoristas serão exibidos aqui</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Receita nos Últimos 30 Dias</CardTitle>
            <CardDescription>Evolução temporal da receita</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Gráfico de tendências em breve</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
