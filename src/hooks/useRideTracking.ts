import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateETA } from '@/lib/mapboxDirections';

const WS_URL = `wss://dnflkxdyfmuubgjnfshe.supabase.co/functions/v1/realtime-tracking`;
const ETA_RECALC_INTERVAL = 30000; // 30 seconds
const SIGNIFICANT_DISTANCE = 200; // meters

interface DriverLocation {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

interface RideInfo {
  dest_lat: number;
  dest_lng: number;
}

interface UseRideTrackingProps {
  rideId: string;
  enabled: boolean;
}

export const useRideTracking = ({ rideId, enabled }: UseRideTrackingProps) => {
  const [connected, setConnected] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [eta, setEta] = useState<{ seconds: number; distance_km: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const lastEtaCalcRef = useRef<number>(0);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const rideInfoRef = useRef<RideInfo | null>(null);
  const etaIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !rideId) {
      return;
    }

    let ws: WebSocket | null = null;
    let etaInterval: NodeJS.Timeout | null = null;
    const lastEtaCalc = { value: 0 };
    const lastLocation = { value: null as { lat: number; lng: number } | null };
    const rideInfo = { value: null as RideInfo | null };

    const cleanup = () => {
      if (etaInterval) {
        clearInterval(etaInterval);
      }
      
      if (ws) {
        ws.close();
      }
      
      setConnected(false);
      setDriverLocation(null);
      setEta(null);
    };

    const calculateDistanceMeters = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number => {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const shouldRecalculateEta = (location: DriverLocation, now: number): boolean => {
      if (now - lastEtaCalc.value > ETA_RECALC_INTERVAL) {
        return true;
      }

      if (lastLocation.value) {
        const distance = calculateDistanceMeters(
          lastLocation.value.lat,
          lastLocation.value.lng,
          location.lat,
          location.lng
        );

        if (distance > SIGNIFICANT_DISTANCE) {
          return true;
        }
      }

      return false;
    };

    const recalculateEta = async (location: DriverLocation) => {
      if (!rideInfo.value) return;

      try {
        const result = await calculateETA(
          location.lng,
          location.lat,
          rideInfo.value.dest_lng,
          rideInfo.value.dest_lat
        );

        if (result) {
          setEta({
            seconds: result.eta_seconds,
            distance_km: result.distance_km
          });

          lastEtaCalc.value = Date.now();
          lastLocation.value = { lat: location.lat, lng: location.lng };

          console.log(`🎯 ETA atualizado: ${Math.round(result.eta_seconds / 60)} min`);
        }
      } catch (error) {
        console.error('Error calculating ETA:', error);
      }
    };

    const handleLocationUpdate = (location: DriverLocation) => {
      const now = Date.now();
      const shouldRecalcEta = shouldRecalculateEta(location, now);

      if (shouldRecalcEta) {
        recalculateEta(location);
      }
    };

    const startPeriodicEtaRecalc = () => {
      etaInterval = setInterval(() => {
        const currentLocation = driverLocation;
        if (currentLocation && rideInfo.value) {
          recalculateEta(currentLocation);
        }
      }, ETA_RECALC_INTERVAL);
    };

    const fetchRideInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('dest_lat, dest_lng')
          .eq('id', rideId)
          .single();

        if (error) throw error;
        rideInfo.value = data;
      } catch (error) {
        console.error('Error fetching ride info:', error);
      }
    };

    const connectWebSocket = async () => {
      try {
        await fetchRideInfo();

        ws = new WebSocket(`${WS_URL}?ride_id=${rideId}&role=customer`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('🟢 Customer tracking connected');
          setConnected(true);
          setError(null);
          startPeriodicEtaRecalc();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'driver_location') {
              const location: DriverLocation = {
                lat: data.lat,
                lng: data.lng,
                heading: data.heading,
                speed: data.speed,
                accuracy: data.accuracy,
                timestamp: data.timestamp
              };

              setDriverLocation(location);
              handleLocationUpdate(location);
            } else if (data.type === 'connected') {
              console.log('✅ Connected to tracking');
            } else if (data.type === 'client_disconnected') {
              console.log(`ℹ️ ${data.role} disconnected`);
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
          console.log('🔴 Customer tracking disconnected');
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
  }, [rideId, enabled, driverLocation]);

  return { connected, driverLocation, eta, error };
};

// Haversine formula
function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}