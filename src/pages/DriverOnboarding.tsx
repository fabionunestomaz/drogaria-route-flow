import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function DriverOnboarding() {
  const { user, session, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cnhFront, setCnhFront] = useState<File | null>(null);
  const [cnhBack, setCnhBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [vehicleType, setVehicleType] = useState('moto');

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .upload(path, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cnhFront || !cnhBack || !selfie) {
      toast.error('Por favor, envie todos os documentos');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const cnhNumber = formData.get('cnh_number') as string;
      const plate = formData.get('plate') as string;

      const [cnhFrontUrl, cnhBackUrl, selfieUrl] = await Promise.all([
        uploadFile(cnhFront, `${user!.id}/cnh-front-${Date.now()}.jpg`),
        uploadFile(cnhBack, `${user!.id}/cnh-back-${Date.now()}.jpg`),
        uploadFile(selfie, `${user!.id}/selfie-${Date.now()}.jpg`),
      ]);

      const { data, error } = await supabase.functions.invoke('register-driver', {
        body: {
          cnh_number: cnhNumber,
          cnh_front_url: cnhFrontUrl,
          cnh_back_url: cnhBackUrl,
          selfie_url: selfieUrl,
          vehicle_type: vehicleType,
          plate,
        },
      });

      if (error) throw error;

      toast.success('Cadastro enviado!', {
        description: 'Aguarde a aprovação do administrador.',
      });

      await refreshRoles();
      navigate('/motoboy');

    } catch (error: any) {
      toast.error('Erro ao enviar cadastro', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Cadastro de Motorista</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="cnh_number">Número da CNH</Label>
            <Input id="cnh_number" name="cnh_number" required />
          </div>

          <div>
            <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
            <Select name="vehicle_type" value={vehicleType} onValueChange={setVehicleType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moto">Moto</SelectItem>
                <SelectItem value="carro">Carro</SelectItem>
                <SelectItem value="van">Van</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="plate">Placa do Veículo</Label>
            <Input id="plate" name="plate" required placeholder="ABC-1234" />
          </div>

          <div>
            <Label>CNH Frente</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setCnhFront(e.target.files?.[0] || null)}
              required 
            />
          </div>

          <div>
            <Label>CNH Verso</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setCnhBack(e.target.files?.[0] || null)}
              required 
            />
          </div>

          <div>
            <Label>Selfie com CNH</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setSelfie(e.target.files?.[0] || null)}
              required 
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Cadastro'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
