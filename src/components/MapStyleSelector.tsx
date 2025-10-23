import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Map, Satellite } from 'lucide-react';

interface MapStyleSelectorProps {
  onStyleChange: (style: 'streets' | 'satellite' | 'satellite-streets') => void;
  defaultStyle?: 'streets' | 'satellite' | 'satellite-streets';
}

const MapStyleSelector = ({ onStyleChange, defaultStyle = 'streets' }: MapStyleSelectorProps) => {
  const [currentStyle, setCurrentStyle] = useState<'streets' | 'satellite' | 'satellite-streets'>(defaultStyle);

  useEffect(() => {
    // Carregar preferência do localStorage
    const saved = localStorage.getItem('mapStyle') as 'streets' | 'satellite' | 'satellite-streets' | null;
    if (saved) {
      setCurrentStyle(saved);
      onStyleChange(saved);
    }
  }, []);

  const toggleStyle = () => {
    const styles: Array<'streets' | 'satellite' | 'satellite-streets'> = ['streets', 'satellite-streets', 'satellite'];
    const currentIndex = styles.indexOf(currentStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    
    setCurrentStyle(nextStyle);
    onStyleChange(nextStyle);
    localStorage.setItem('mapStyle', nextStyle);
  };

  const getLabel = () => {
    switch (currentStyle) {
      case 'streets':
        return 'Ruas';
      case 'satellite':
        return 'Satélite';
      case 'satellite-streets':
        return 'Híbrido';
    }
  };

  const getIcon = () => {
    return currentStyle === 'streets' ? <Satellite className="h-4 w-4" /> : <Map className="h-4 w-4" />;
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleStyle}
      className="absolute top-4 right-4 z-10 shadow-lg"
    >
      {getIcon()}
      <span className="ml-2">{getLabel()}</span>
    </Button>
  );
};

export default MapStyleSelector;
