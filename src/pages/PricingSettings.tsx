import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePricingConfig } from '@/hooks/usePricingConfig';
import Header from '@/components/Header';
import { 
  Calculator, 
  TrendingUp, 
  Fuel, 
  Wrench, 
  Clock, 
  DollarSign,
  Percent,
  Target,
  ArrowLeft,
  Save,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

const PricingSettings = () => {
  const navigate = useNavigate();
  const { config, loading, updateConfig, calculatePrice } = usePricingConfig();
  const [formData, setFormData] = useState({
    gasoline_price: 6.0,
    vehicle_consumption: 30.0,
    maintenance_per_km: 0.5,
    cost_per_minute: 0.3,
    base_fee: 5.0,
    profit_margin: 20.0,
    minimum_price: 10.0,
  });

  const [previewDistance, setPreviewDistance] = useState(5);
  const [previewTime, setPreviewTime] = useState(15);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
      setHasChanges(false);
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      const changed = JSON.stringify(config) !== JSON.stringify(formData);
      setHasChanges(changed);
    }
  }, [formData, config]);

  const handleSave = () => {
    updateConfig(formData);
  };

  const handleReset = () => {
    if (config) {
      setFormData(config);
      setHasChanges(false);
    }
  };

  const updateField = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  const previewPrice = calculatePrice(previewDistance, previewTime);
  const costPerKm = formData.gasoline_price / formData.vehicle_consumption + formData.maintenance_per_km;
  const fuelCostPerKm = formData.gasoline_price / formData.vehicle_consumption;
  const subtotal = formData.base_fee + (previewDistance * costPerKm) + (previewTime * formData.cost_per_minute);
  const profitAmount = subtotal * (formData.profit_margin / 100);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Calculadora de Preços
                {hasChanges && <Badge variant="outline" className="text-warning">Não salvo</Badge>}
              </h1>
              <p className="text-muted-foreground">
                Configure parâmetros avançados e simule preços em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna 1: Configurações */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="costs" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="costs">
                  <Fuel className="h-4 w-4 mr-2" />
                  Custos
                </TabsTrigger>
                <TabsTrigger value="fees">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Taxas
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <Target className="h-4 w-4 mr-2" />
                  Avançado
                </TabsTrigger>
              </TabsList>

              <TabsContent value="costs" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Combustível</CardTitle>
                    <CardDescription>Configure preço e consumo do veículo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Preço da Gasolina</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            step="0.10"
                            value={formData.gasoline_price}
                            onChange={(e) => updateField('gasoline_price', Number(e.target.value))}
                            className="w-24 text-right"
                          />
                          <span className="text-sm text-muted-foreground">/L</span>
                        </div>
                      </div>
                      <Slider
                        value={[formData.gasoline_price]}
                        onValueChange={([value]) => updateField('gasoline_price', value)}
                        min={4}
                        max={10}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Combustível/km: R$ {fuelCostPerKm.toFixed(2)}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Consumo do Veículo</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="1"
                            value={formData.vehicle_consumption}
                            onChange={(e) => updateField('vehicle_consumption', Number(e.target.value))}
                            className="w-24 text-right"
                          />
                          <span className="text-sm text-muted-foreground">km/L</span>
                        </div>
                      </div>
                      <Slider
                        value={[formData.vehicle_consumption]}
                        onValueChange={([value]) => updateField('vehicle_consumption', value)}
                        min={15}
                        max={50}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Manutenção
                    </CardTitle>
                    <CardDescription>Desgaste e manutenção do veículo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Custo por KM</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          step="0.10"
                          value={formData.maintenance_per_km}
                          onChange={(e) => updateField('maintenance_per_km', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[formData.maintenance_per_km]}
                      onValueChange={([value]) => updateField('maintenance_per_km', value)}
                      min={0.1}
                      max={2}
                      step={0.1}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Tempo
                    </CardTitle>
                    <CardDescription>Valor do tempo do motorista</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Custo por Minuto</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          step="0.10"
                          value={formData.cost_per_minute}
                          onChange={(e) => updateField('cost_per_minute', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[formData.cost_per_minute]}
                      onValueChange={([value]) => updateField('cost_per_minute', value)}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      ~R$ {(formData.cost_per_minute * 60).toFixed(2)}/hora
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Taxa Base</CardTitle>
                    <CardDescription>Valor fixo cobrado em todas as entregas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Valor Fixo</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          step="0.50"
                          value={formData.base_fee}
                          onChange={(e) => updateField('base_fee', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[formData.base_fee]}
                      onValueChange={([value]) => updateField('base_fee', value)}
                      min={0}
                      max={15}
                      step={0.5}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Margem de Lucro
                    </CardTitle>
                    <CardDescription>Percentual de lucro sobre os custos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Margem</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="1"
                          value={formData.profit_margin}
                          onChange={(e) => updateField('profit_margin', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Slider
                      value={[formData.profit_margin]}
                      onValueChange={([value]) => updateField('profit_margin', value)}
                      min={0}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                    <div className="bg-muted p-3 rounded-lg mt-3">
                      <p className="text-sm text-muted-foreground mb-1">Lucro na simulação:</p>
                      <p className="text-lg font-bold text-primary">+ R$ {profitAmount.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Preço Mínimo
                    </CardTitle>
                    <CardDescription>Valor mínimo para qualquer entrega</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Mínimo</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          step="0.50"
                          value={formData.minimum_price}
                          onChange={(e) => updateField('minimum_price', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[formData.minimum_price]}
                      onValueChange={([value]) => updateField('minimum_price', value)}
                      min={5}
                      max={25}
                      step={0.5}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo dos Custos</CardTitle>
                    <CardDescription>Visão geral dos seus custos operacionais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Combustível/km</p>
                        <p className="text-xl font-bold">R$ {fuelCostPerKm.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Manutenção/km</p>
                        <p className="text-xl font-bold">R$ {formData.maintenance_per_km.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Custo Total/km</p>
                        <p className="text-2xl font-bold text-primary">R$ {costPerKm.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Custo/hora</p>
                        <p className="text-2xl font-bold text-primary">R$ {(formData.cost_per_minute * 60).toFixed(2)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Exemplo: 10km em 20min</p>
                      <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Combustível:</span>
                          <span>R$ {(10 * fuelCostPerKm).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manutenção:</span>
                          <span>R$ {(10 * formData.maintenance_per_km).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo:</span>
                          <span>R$ {(20 * formData.cost_per_minute).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa Base:</span>
                          <span>R$ {formData.base_fee.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Custo Total:</span>
                          <span>R$ {(10 * costPerKm + 20 * formData.cost_per_minute + formData.base_fee).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-primary font-bold">
                          <span>+ Margem ({formData.profit_margin}%):</span>
                          <span>R$ {calculatePrice(10, 20).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Coluna 2: Simulador */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Simulador
                </CardTitle>
                <CardDescription>Teste em tempo real</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Distância</Label>
                      <Badge variant="secondary">{previewDistance} km</Badge>
                    </div>
                    <Slider
                      value={[previewDistance]}
                      onValueChange={([value]) => setPreviewDistance(value)}
                      min={1}
                      max={50}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Tempo</Label>
                      <Badge variant="secondary">{previewTime} min</Badge>
                    </div>
                    <Slider
                      value={[previewTime]}
                      onValueChange={([value]) => setPreviewTime(value)}
                      min={5}
                      max={120}
                      step={5}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taxa Base</span>
                    <span className="font-medium">R$ {formData.base_fee.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Distância ({previewDistance}km)</span>
                    <span className="font-medium">R$ {(previewDistance * costPerKm).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tempo ({previewTime}min)</span>
                    <span className="font-medium">R$ {(previewTime * formData.cost_per_minute).toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lucro ({formData.profit_margin}%)</span>
                    <span className="font-semibold text-primary">+ R$ {profitAmount.toFixed(2)}</span>
                  </div>

                  <Separator className="my-3" />

                  <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Preço Final</span>
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      R$ {Math.max(previewPrice, formData.minimum_price).toFixed(2)}
                    </div>
                    {previewPrice < formData.minimum_price && (
                      <p className="text-xs text-muted-foreground mt-2">
                        * Aplicado preço mínimo
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground">Custo/km</p>
                      <p className="font-bold text-sm">R$ {costPerKm.toFixed(2)}</p>
                    </div>
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground">Custo/min</p>
                      <p className="font-bold text-sm">R$ {formData.cost_per_minute.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-4 border-t mt-8">
          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              className="flex-1"
              size="lg"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges}
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resetar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSettings;
