import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import MapboxMap from '@/components/MapboxMap';
import MapStyleSelector from '@/components/MapStyleSelector';
import { reverseGeocode } from '@/lib/mapbox';
import Header from '@/components/Header';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'satellite-streets'>('satellite-streets');
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

  const handleMarkerDrag = async (lng: number, lat: number) => {
    const address = await reverseGeocode(lng, lat);
    if (address) {
      setSettings({
        ...settings,
        address,
        lat,
        lng
      });
      toast.info('📍 Localização atualizada! Verifique o endereço.');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!settings.pharmacyName || !settings.address || !settings.lat || !settings.lng || settings.lat === 0 || settings.lng === 0) {
      toast.error('Preencha todos os campos obrigatórios e selecione uma localização válida');
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
              <Label>Endereço da Farmácia *</Label>
              <Tabs defaultValue="address" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="address">📍 Buscar Endereço</TabsTrigger>
                  <TabsTrigger value="map">🗺️ Ajustar no Mapa</TabsTrigger>
                </TabsList>

                <TabsContent value="address" className="space-y-2">
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
                </TabsContent>

                <TabsContent value="map" className="space-y-2">
                  <div className="relative h-[400px] rounded-lg overflow-hidden border">
                    <MapStyleSelector 
                      onStyleChange={setMapStyle}
                      defaultStyle="satellite-streets"
                    />
                    {settings.lat !== 0 && settings.lng !== 0 && (
                      <MapboxMap
                        center={[settings.lng, settings.lat]}
                        zoom={17}
                        styleType={mapStyle}
                        markers={[{
                          lng: settings.lng,
                          lat: settings.lat,
                          color: '#22c55e',
                          label: settings.pharmacyName || 'Farmácia',
                          draggable: true
                        }]}
                        onMarkerDrag={handleMarkerDrag}
                      />
                    )}
                    {(settings.lat === 0 || settings.lng === 0) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                        <Badge variant="outline" className="text-sm">
                          Digite um endereço primeiro para ajustar no mapa
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Badge className="w-full justify-center" variant="secondary">
                    🎯 Arraste o marcador verde para ajustar a localização exata
                  </Badge>
                </TabsContent>
              </Tabs>

              {settings.address && (
                <Card className="bg-muted/50 p-3 mt-2">
                  <p className="text-xs text-muted-foreground">Localização Atual:</p>
                  <p className="text-sm font-medium">{settings.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 {settings.lat.toFixed(6)}, {settings.lng.toFixed(6)}
                  </p>
                </Card>
              )}
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
