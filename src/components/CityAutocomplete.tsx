import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/mapboxConfig";
import { cn } from "@/lib/utils";

interface CityResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, coords: { lat: number; lng: number } | null) => void;
  placeholder?: string;
  className?: string;
}

const CityAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Digite a cidade...",
  className 
}: CityAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const abortController = useRef<AbortController>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Abort previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      abortController.current = new AbortController();

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&language=pt-BR&limit=8&country=BR&types=place,locality,region`;

        const response = await fetch(url, {
          signal: abortController.current.signal
        });

        if (!response.ok) throw new Error('Erro ao buscar');

        const data = await response.json();
        setResults(data.features || []);
        setIsOpen(true);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao buscar cidade:', error);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [query]);

  const handleSelect = (result: CityResult) => {
    const cityName = result.text;
    setQuery(cityName);
    onChange(cityName, { lat: result.center[1], lng: result.center[0] });
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-9", className)}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-2 hover:bg-accent cursor-pointer transition-colors text-sm"
              role="option"
            >
              <div className="font-medium">{result.text}</div>
              <div className="text-xs text-muted-foreground">{result.place_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;