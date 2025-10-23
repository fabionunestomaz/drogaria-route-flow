import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Truck, Package, Smile } from 'lucide-react';
import { useCreateRating } from '@/hooks/useRatings';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
}

export const RatingDialog = ({ open, onOpenChange, rideId }: RatingDialogProps) => {
  const [overallRating, setOverallRating] = useState(5);
  const [deliverySpeed, setDeliverySpeed] = useState(5);
  const [productQuality, setProductQuality] = useState(5);
  const [serviceQuality, setServiceQuality] = useState(5);
  const [comment, setComment] = useState('');

  const { mutate: createRating, isPending } = useCreateRating();

  const handleSubmit = () => {
    createRating({
      ride_id: rideId,
      stars: overallRating,
      comment: comment || undefined,
      rating_type: 'delivery',
      delivery_speed_stars: deliverySpeed,
      product_quality_stars: productQuality,
      service_quality_stars: serviceQuality,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setOverallRating(5);
        setDeliverySpeed(5);
        setProductQuality(5);
        setServiceQuality(5);
        setComment('');
      },
    });
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label, 
    icon: Icon 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string; 
    icon: any;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <Label>{label}</Label>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Entrega</DialogTitle>
          <DialogDescription>
            Sua opinião nos ajuda a melhorar o serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
            label="Avaliação Geral"
            icon={Star}
          />

          <StarRating
            value={deliverySpeed}
            onChange={setDeliverySpeed}
            label="Velocidade da Entrega"
            icon={Truck}
          />

          <StarRating
            value={productQuality}
            onChange={setProductQuality}
            label="Qualidade dos Produtos"
            icon={Package}
          />

          <StarRating
            value={serviceQuality}
            onChange={setServiceQuality}
            label="Qualidade do Atendimento"
            icon={Smile}
          />

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};