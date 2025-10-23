import { useState } from 'react';
import MapboxMap from './MapboxMap';
import { Button } from '@/components/ui/button';
import { reverseGeocode } from '@/lib/mapbox';
import { MapPin } from 'lucide-react';

interface MapPickerProps {
  onSelect: (address: string, coordinates: [number, number]) => void;
  initialCenter?: [number, number];
  label?: string;
}

const MapPicker = ({ 
  onSelect, 
  initialCenter = [-44.1900, -13.4100],
  label = 'Clique no mapa para selecionar o local'
}: MapPickerProps) => {
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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

      <div className="h-[400px] rounded-lg overflow-hidden border">
        <MapboxMap
          center={selectedCoords || initialCenter}
          zoom={selectedCoords ? 15 : 12}
          markers={selectedCoords ? [{
            lng: selectedCoords[0],
            lat: selectedCoords[1],
            color: '#3b82f6',
            label: 'Local selecionado'
          }] : []}
          onMapClick={handleMapClick}
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
