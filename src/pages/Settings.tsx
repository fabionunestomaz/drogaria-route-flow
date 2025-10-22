import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Header from '@/components/Header';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pharmacyName: '',
    address: '',
    lat: 0,
    lng: 0,
    phone: '',
    basePrice: 5,
    pricePerKm: 2
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pharmacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSettings({
        pharmacyName: data.pharmacy_name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone || '',
        basePrice: Number(data.base_price),
        pricePerKm: Number(data.price_per_km)
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!settings.pharmacyName || !settings.address || !settings.lat || !settings.lng) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('pharmacy_settings')
      .upsert({
        user_id: user.id,
        pharmacy_name: settings.pharmacyName,
        address: settings.address,
        lat: settings.lat,
        lng: settings.lng,
        phone: settings.phone,
        base_price: settings.basePrice,
        price_per_km: settings.pricePerKm
      });

    setLoading(false);

    if (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } else {
      toast.success('Configurações salvas com sucesso!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Farmácia</CardTitle>
            <CardDescription>
              Configure os dados da sua farmácia e valores de entrega
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pharmacyName">Nome da Farmácia *</Label>
              <Input
                id="pharmacyName"
                value={settings.pharmacyName}
                onChange={(e) => setSettings({ ...settings, pharmacyName: e.target.value })}
                placeholder="Ex: Farmácia São João"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço da Farmácia *</Label>
              <AddressAutocomplete
                value={settings.address}
                onChange={(address, coords) => {
                  setSettings({
                    ...settings,
                    address,
                    lat: coords?.lat || 0,
                    lng: coords?.lng || 0
                  });
                }}
                placeholder="Digite o endereço"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="(11) 98765-4321"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Preço Base (R$)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={settings.basePrice}
                  onChange={(e) => setSettings({ ...settings, basePrice: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerKm">Preço por KM (R$)</Label>
                <Input
                  id="pricePerKm"
                  type="number"
                  step="0.01"
                  value={settings.pricePerKm}
                  onChange={(e) => setSettings({ ...settings, pricePerKm: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
