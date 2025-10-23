import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Truck, BarChart3, Clock, Shield, Zap, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: MapPin,
      title: "Rastreamento em Tempo Real",
      description: "Acompanhe suas entregas ao vivo no mapa com ETA preciso",
    },
    {
      icon: Truck,
      title: "Rotas Otimizadas",
      description: "Algoritmo inteligente para as rotas mais eficientes",
    },
    {
      icon: BarChart3,
      title: "Dashboard Completo",
      description: "KPIs e relatórios detalhados para gestão total",
    },
    {
      icon: Clock,
      title: "Entregas Rápidas",
      description: "Logística ágil com multi-paradas otimizadas",
    },
    {
      icon: Shield,
      title: "Seguro e Confiável",
      description: "Motoristas verificados e entregas garantidas",
    },
    {
      icon: Zap,
      title: "PWA Mobile",
      description: "Instale no seu celular como um app nativo",
    },
  ];

  const roles = [
    {
      title: "Para Clientes",
      description: "Solicite entregas, acompanhe em tempo real e avalie o serviço",
      href: "/cliente",
      gradient: "from-primary to-accent",
    },
    {
      title: "Para Motoboys",
      description: "Receba rotas otimizadas, navegue e registre entregas facilmente",
      href: "/motoboy",
      gradient: "from-success to-primary",
    },
    {
      title: "Para Gestores",
      description: "Planeje rotas, monitore operações e analise indicadores em tempo real",
      href: "/admin",
      gradient: "from-warning to-primary",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 gradient-surface opacity-50" />
        <div className="container relative px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              Entregas Inteligentes, Rápidas e Rastreáveis
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Plataforma completa de logística com roteirização automática, rastreamento ao vivo via Mapbox e gestão em tempo real para farmácias e delivery local.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="touch-target shadow-glow">
                <Link to="/nova-entrega" className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nova Entrega
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="touch-target">
                <Link to="/motoboy">Sou Motoboy</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Recursos Principais
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-elevated transition-smooth hover:scale-105"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-16 sm:py-24">
        <div className="container px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Acesse sua Área
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {roles.map((role, index) => (
              <Link key={index} to={role.href}>
                <Card className="p-8 h-full hover:shadow-elevated transition-smooth hover:scale-105 relative overflow-hidden group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <h3 className="text-2xl font-bold mb-3">{role.title}</h3>
                  <p className="text-muted-foreground mb-4">{role.description}</p>
                  <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                    Acessar →
                  </Button>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="container relative px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experimente a plataforma mais completa de entregas com rastreamento em tempo real e gestão inteligente de rotas.
          </p>
          <Button size="lg" asChild className="touch-target shadow-glow">
            <Link to="/nova-entrega" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Primeira Entrega
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Drogaria Fast Deliver. Todos os direitos reservados.</p>
          <p className="mt-2">
            Powered by Mapbox • WebSocket Real-time • PWA Ready
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
