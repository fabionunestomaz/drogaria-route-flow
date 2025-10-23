import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePricingConfig } from '@/hooks/usePricingConfig';
import Header from '@/components/Header';
import { Calculator, TrendingUp, Fuel, Wrench, Clock, DollarSign } from 'lucide-react';

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

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig(formData);
  };

  const previewPrice = calculatePrice(previewDistance, previewTime);
  const costPerKm = formData.gasoline_price / formData.vehicle_consumption + formData.maintenance_per_km;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Calculadora de Preços</h1>
          <p className="text-muted-foreground">
            Configure parâmetros avançados para calcular preços justos automaticamente
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Custos Operacionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Custos Operacionais
              </CardTitle>
              <CardDescription>Defina os custos reais do veículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gasoline_price">Preço da Gasolina (R$/litro)</Label>
                <Input
                  id="gasoline_price"
                  type="number"
                  step="0.10"
                  value={formData.gasoline_price}
                  onChange={(e) => setFormData({ ...formData, gasoline_price: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_consumption">Consumo (km/litro)</Label>
                <Input
                  id="vehicle_consumption"
                  type="number"
                  step="1"
                  value={formData.vehicle_consumption}
                  onChange={(e) => setFormData({ ...formData, vehicle_consumption: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_per_km">
                  <Wrench className="inline h-4 w-4 mr-1" />
                  Manutenção (R$/km)
                </Label>
                <Input
                  id="maintenance_per_km"
                  type="number"
                  step="0.10"
                  value={formData.maintenance_per_km}
                  onChange={(e) => setFormData({ ...formData, maintenance_per_km: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_minute">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Custo por Minuto (R$/min)
                </Label>
                <Input
                  id="cost_per_minute"
                  type="number"
                  step="0.10"
                  value={formData.cost_per_minute}
                  onChange={(e) => setFormData({ ...formData, cost_per_minute: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Taxas e Margens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taxas e Margens
              </CardTitle>
              <CardDescription>Configure valores fixos e lucro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="base_fee">Taxa Base (R$)</Label>
                <Input
                  id="base_fee"
                  type="number"
                  step="0.50"
                  value={formData.base_fee}
                  onChange={(e) => setFormData({ ...formData, base_fee: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profit_margin">Margem de Lucro (%)</Label>
                <Input
                  id="profit_margin"
                  type="number"
                  step="1"
                  value={formData.profit_margin}
                  onChange={(e) => setFormData({ ...formData, profit_margin: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_price">Preço Mínimo (R$)</Label>
                <Input
                  id="minimum_price"
                  type="number"
                  step="0.50"
                  value={formData.minimum_price}
                  onChange={(e) => setFormData({ ...formData, minimum_price: Number(e.target.value) })}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Custo por KM:</span>
                  <span className="font-semibold">R$ {costPerKm.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview de Cálculo */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Simulação de Preço
            </CardTitle>
            <CardDescription>Teste como ficaria o cálculo com os parâmetros atuais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Distância (km)</Label>
                <Input
                  type="number"
                  value={previewDistance}
                  onChange={(e) => setPreviewDistance(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo (minutos)</Label>
                <Input
                  type="number"
                  value={previewTime}
                  onChange={(e) => setPreviewTime(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Preço Final</Label>
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span className="font-bold text-lg">R$ {previewPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Taxa Base:</span>
                <span>R$ {formData.base_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo da Distância ({previewDistance}km × R${costPerKm.toFixed(2)}):</span>
                <span>R$ {(previewDistance * costPerKm).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo do Tempo ({previewTime}min × R${formData.cost_per_minute.toFixed(2)}):</span>
                <span>R$ {(previewTime * formData.cost_per_minute).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span>Subtotal:</span>
                <span>
                  R${' '}
                  {(formData.base_fee + previewDistance * costPerKm + previewTime * formData.cost_per_minute).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-primary font-semibold">
                <span>+ Margem ({formData.profit_margin}%):</span>
                <span>R$ {previewPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} className="flex-1">
            Salvar Configurações
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingSettings;
