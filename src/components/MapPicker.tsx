import { useState } from 'react';
import MapboxMap from './MapboxMap';
import MapStyleSelector from './MapStyleSelector';
import { Button } from '@/components/ui/button';
import { reverseGeocode } from '@/lib/mapbox';
import { MapPin } from 'lucide-react';

interface MapPickerProps {
  onSelect: (address: string, coordinates: [number, number]) => void;
  initialCenter?: [number, number];
  label?: string;
  fixedOrigin?: { lat: number; lng: number; label: string };
}

const MapPicker = ({ 
  onSelect, 
  initialCenter = [-44.1900, -13.4100],
  label = 'Clique no mapa para selecionar o local',
  fixedOrigin
}: MapPickerProps) => {
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'satellite-streets'>('satellite-streets');

  const handleMapClick = async (lng: number, lat: number) => {
    setIsLoading(true);
    setSelectedCoords([lng, lat]);
    
    const address = await reverseGeocode(lng, lat);
    if (address) {
      setSelectedAddress(address);
    } else {
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
    setIsLoading(false);
  };

  const handleMarkerDrag = async (lng: number, lat: number) => {
    setIsLoading(true);
    setSelectedCoords([lng, lat]);
    
    const address = await reverseGeocode(lng, lat);
    if (address) {
      setSelectedAddress(address);
    } else {
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
    setIsLoading(false);
  };

  const handleConfirm = () => {
    if (selectedCoords && selectedAddress) {
      console.log('🗺️ MapPicker - Coordenadas selecionadas:', {
        lng: selectedCoords[0],
        lat: selectedCoords[1],
        address: selectedAddress
      });
      onSelect(selectedAddress, selectedCoords);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{label}</span>
      </div>

      <div className="relative h-[400px] rounded-lg overflow-hidden border">
        <MapStyleSelector 
          onStyleChange={setMapStyle}
          defaultStyle="satellite-streets"
        />
        <MapboxMap
          center={selectedCoords || initialCenter}
          zoom={selectedCoords ? 15 : 12}
          styleType={mapStyle}
          markers={[
            ...(fixedOrigin ? [{
              lng: initialCenter[0],
              lat: initialCenter[1],
              color: '#22c55e',
              label: fixedOrigin.label
            }] : []),
            ...(selectedCoords ? [{
              lng: selectedCoords[0],
              lat: selectedCoords[1],
              color: '#ef4444',
              label: 'Destino (arraste para ajustar)',
              draggable: true
            }] : [])
          ]}
          onMapClick={handleMapClick}
          onMarkerDrag={handleMarkerDrag}
        />
      </div>

      {selectedAddress && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Endereço selecionado:</p>
          <p className="text-sm text-muted-foreground">{selectedAddress}</p>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="w-full"
          >
            Confirmar Local
          </Button>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
