import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ShareTrackingButtonProps {
  trackingToken: string;
}

export default function ShareTrackingButton({ trackingToken }: ShareTrackingButtonProps) {
  const [copied, setCopied] = useState(false);
  const trackingUrl = `${window.location.origin}/track/${trackingToken}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'O link de rastreamento foi copiado para a área de transferência',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    }
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Sua entrega está a caminho! 🚀\n\nAcompanhe em tempo real aqui:\n${trackingUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareSMS = () => {
    const message = encodeURIComponent(
      `Sua entrega está a caminho! Acompanhe: ${trackingUrl}`
    );
    window.location.href = `sms:?body=${message}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar Rastreamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Rastreamento</DialogTitle>
          <DialogDescription>
            Compartilhe este link para que outros possam acompanhar a entrega em tempo real
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* URL Display */}
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={trackingUrl}
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
            />
            <Button size="icon" variant="outline" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={shareWhatsApp} className="w-full">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </Button>
            <Button variant="outline" onClick={shareSMS} className="w-full">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              SMS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
