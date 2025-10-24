import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const REALTIME_PING_MS = 5000;
const WS_URL = `wss://dnflkxdyfmuubgjnfshe.supabase.co/functions/v1/realtime-tracking`;

interface LocationData {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
}

interface UseDriverTrackingProps {
  batchId: string;
  enabled: boolean;
}

export const useDriverTracking = ({ batchId, enabled }: UseDriverTrackingProps) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !batchId) {
      return;
    }

    let ws: WebSocket | null = null;
    let watchId: number | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      
      if (ws) {
        ws.close();
      }
      
      setConnected(false);
    };

    const sendLocation = (location: LocationData) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'location_update',
          ...location,
          timestamp: Date.now()
        }));
      }
    };

    const saveLocationToDb = async (location: LocationData) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('delivery_batch_locations').insert({
          batch_id: batchId,
          driver_id: user.id,
          lat: location.lat,
          lng: location.lng,
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy
        });
      } catch (error) {
        console.error('Error saving location:', error);
      }
    };

    const startLocationTracking = () => {
      if (!navigator.geolocation) {
        toast.error('Geolocalização não suportada');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            accuracy: position.coords.accuracy
          };

          sendLocation(locationData);
          saveLocationToDb(locationData);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Erro ao obter localização');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    const startHeartbeat = () => {
      pingInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }));
        }
      }, REALTIME_PING_MS);
    };

    const connectWebSocket = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('❌ Not authenticated');
          setError('Não autenticado');
          throw new Error('Not authenticated');
        }

        console.log('🔌 Connecting to WebSocket:', `${WS_URL}?batch_id=${batchId}&role=driver`);
        ws = new WebSocket(`${WS_URL}?batch_id=${batchId}&role=driver`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('🟢 Driver tracking connected');
          setConnected(true);
          setError(null);
          startLocationTracking();
          startHeartbeat();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ack') {
              console.log('✅ Location update acknowledged');
            } else if (data.type === 'pong') {
              console.log('🏓 Pong received');
            } else if (data.type === 'error') {
              console.error('❌ Server error:', data.message);
              toast.error(data.message);
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setError('Connection error');
          setConnected(false);
        };

        ws.onclose = () => {
          console.log('🔴 Driver tracking disconnected');
          setConnected(false);
        };
      } catch (error: any) {
        console.error('Failed to connect:', error);
        setError(error.message);
        toast.error('Erro ao conectar tracking');
      }
    };

    connectWebSocket();

    return cleanup;
  }, [batchId, enabled]);

  return { connected, error };
};