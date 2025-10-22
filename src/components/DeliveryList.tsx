import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, GripVertical } from 'lucide-react';
import CustomerAutocomplete from './CustomerAutocomplete';

export interface Delivery {
  id: string;
  customerId?: string;
  customerName: string;
  orderNumber: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
  requestId?: string;
}

interface DeliveryListProps {
  deliveries: Delivery[];
  onUpdate: (deliveries: Delivery[]) => void;
}

const DeliveryList = ({ deliveries, onUpdate }: DeliveryListProps) => {
  const addDelivery = () => {
    const newDelivery: Delivery = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: '',
      orderNumber: '',
      address: '',
      lat: 0,
      lng: 0,
      notes: ''
    };
    onUpdate([...deliveries, newDelivery]);
  };

  const removeDelivery = (id: string) => {
    onUpdate(deliveries.filter(d => d.id !== id));
  };

  const updateDelivery = (id: string, field: keyof Delivery, value: any) => {
    onUpdate(
      deliveries.map(d => d.id === id ? { ...d, [field]: value } : d)
    );
  };

  return (
    <div className="space-y-4">
      {deliveries.map((delivery, index) => (
        <Card key={delivery.id} className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {index + 1}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Nome do cliente"
                  value={delivery.customerName}
                  onChange={(e) => updateDelivery(delivery.id, 'customerName', e.target.value)}
                />
                <Input
                  placeholder="Nº do pedido"
                  value={delivery.orderNumber}
                  onChange={(e) => updateDelivery(delivery.id, 'orderNumber', e.target.value)}
                />
              </div>

              <CustomerAutocomplete
                value={delivery.address}
                onChange={(address, coords, customerId) => {
                  updateDelivery(delivery.id, 'address', address);
                  if (coords) {
                    updateDelivery(delivery.id, 'lat', coords.lat);
                    updateDelivery(delivery.id, 'lng', coords.lng);
                  }
                  if (customerId) {
                    updateDelivery(delivery.id, 'customerId', customerId);
                  }
                }}
                placeholder="Endereço de entrega"
              />

              <Textarea
                placeholder="Observações (opcional)"
                value={delivery.notes || ''}
                onChange={(e) => updateDelivery(delivery.id, 'notes', e.target.value)}
                rows={2}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeDelivery(delivery.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Button onClick={addDelivery} variant="outline" className="w-full">
        + Adicionar Entrega
      </Button>
    </div>
  );
};

export default DeliveryList;
