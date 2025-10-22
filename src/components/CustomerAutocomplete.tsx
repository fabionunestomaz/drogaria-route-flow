import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './ui/command';
import { MapPin, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { searchAddresses, GeocodingResult } from '@/lib/mapbox';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
}

interface CustomerAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }, customerId?: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomerAutocomplete = ({
  value,
  onChange,
  placeholder = "Buscar cliente ou endereço...",
  className = ""
}: CustomerAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const searchCustomersAndAddresses = async () => {
      if (query.length < 2) {
        setCustomers([]);
        setAddressSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      
      // Buscar clientes cadastrados
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (customersData) {
        setCustomers(customersData);
      }

      // Buscar endereços no Mapbox
      const addresses = await searchAddresses(query);
      setAddressSuggestions(addresses);

      setIsOpen(true);
      setIsLoading(false);
    };

    const timer = setTimeout(searchCustomersAndAddresses, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCustomer = (customer: Customer) => {
    setQuery(customer.address);
    onChange(customer.address, { lat: customer.lat, lng: customer.lng }, customer.id);
    setIsOpen(false);
  };

  const handleSelectAddress = (suggestion: GeocodingResult) => {
    setQuery(suggestion.place_name);
    onChange(suggestion.place_name, {
      lat: suggestion.center[1],
      lng: suggestion.center[0]
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      
      {isOpen && (customers.length > 0 || addressSuggestions.length > 0) && (
        <Command className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
          <CommandList>
            {isLoading && (
              <CommandEmpty>Buscando...</CommandEmpty>
            )}
            
            {customers.length > 0 && (
              <CommandGroup heading="Clientes Cadastrados">
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    onSelect={() => handleSelectCustomer(customer)}
                    className="cursor-pointer"
                  >
                    <UserCircle className="mr-2 h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-sm text-muted-foreground">{customer.address}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {addressSuggestions.length > 0 && (
              <CommandGroup heading="Novos Endereços">
                {addressSuggestions.map((suggestion, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => handleSelectAddress(suggestion)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{suggestion.place_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      )}
    </div>
  );
};

export default CustomerAutocomplete;
