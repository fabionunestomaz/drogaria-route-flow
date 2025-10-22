import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { searchAddresses, type GeocodingResult } from '@/lib/mapbox';
import { searchCep, formatAddress } from '@/lib/viaCep';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete = ({
  value,
  onChange,
  placeholder = 'Digite um endereço ou CEP...',
  className = ''
}: AddressAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      // Verificar se é CEP
      const cleanQuery = query.replace(/\D/g, '');
      if (cleanQuery.length === 8) {
        const cepData = await searchCep(cleanQuery);
        if (cepData) {
          const fullAddress = formatAddress(cepData);
          const results = await searchAddresses(fullAddress);
          setSuggestions(results);
          setIsOpen(true);
          setIsLoading(false);
          return;
        }
      }

      // Busca normal por endereço
      const results = await searchAddresses(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (result: GeocodingResult) => {
    setQuery(result.place_name);
    onChange(result.place_name, { lat: result.center[1], lng: result.center[0] });
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="w-full"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
          <Command>
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Buscando...</CommandEmpty>
              ) : (
                <CommandGroup>
                  {suggestions.map((result, index) => (
                    <CommandItem
                      key={index}
                      value={result.place_name}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{result.place_name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
