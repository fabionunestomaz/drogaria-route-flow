import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setMapboxToken } from '@/lib/mapboxConfig';

const MapboxTokenInput = () => {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      setMapboxToken(token.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Configurar Mapbox</h2>
          <p className="text-sm text-muted-foreground">
            Para usar os mapas, você precisa de um token público do Mapbox.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este é um token público e é seguro para uso no navegador.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token Público do Mapbox</Label>
            <Input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="pk.eyJ1Ijoi..."
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Não tem um token? Crie uma conta gratuita:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://account.mapbox.com/access-tokens/', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Obter Token do Mapbox
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={!token.trim()}>
            Salvar e Continuar
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default MapboxTokenInput;
