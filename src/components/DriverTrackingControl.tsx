import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Navigation, Activity, AlertCircle, MapPin } from 'lucide-react';
import { useDriverTracking } from '@/hooks/useDriverTracking';
import { Alert, AlertDescription } from './ui/alert';

interface DriverTrackingControlProps {
  batchId: string;
  className?: string;
}

const DriverTrackingControl = ({ batchId, className }: DriverTrackingControlProps) => {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const { connected, error } = useDriverTracking({
    batchId,
    enabled: trackingEnabled
  });
  
  console.log('DriverTrackingControl - batchId:', batchId, 'enabled:', trackingEnabled, 'connected:', connected, 'error:', error);

  const handleToggleTracking = () => {
    setTrackingEnabled(!trackingEnabled);
  };

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Compartilhamento de Localização</h3>
          </div>
          {connected && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Ativo
            </Badge>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-muted-foreground">
                {trackingEnabled
                  ? 'Sua localização está sendo compartilhada com o cliente em tempo real.'
                  : 'Ative o rastreamento para compartilhar sua localização durante a entrega.'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleToggleTracking}
            variant={trackingEnabled ? 'destructive' : 'default'}
            className="w-full"
            size="lg"
          >
            {trackingEnabled ? 'Parar Rastreamento' : 'Iniciar Rastreamento'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {trackingEnabled
              ? 'Sua localização só é compartilhada durante entregas ativas'
              : 'O cliente poderá ver sua localização aproximada no mapa'}
          </p>
        </div>

        {trackingEnabled && !connected && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 animate-spin" />
              Conectando ao sistema de rastreamento...
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DriverTrackingControl;