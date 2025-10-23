import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { useSubscribeToPush } from '@/hooks/useNotifications';

export const PushNotificationPrompt = () => {
  const [show, setShow] = useState(false);
  const { mutate: subscribe, isPending } = useSubscribeToPush();

  useEffect(() => {
    // Check if user has already decided
    const dismissed = localStorage.getItem('push-prompt-dismissed');
    const hasPermission = 'Notification' in window && Notification.permission !== 'default';
    
    if (!dismissed && !hasPermission && 'serviceWorker' in navigator) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('push-prompt-dismissed', 'true');
  };

  const handleSubscribe = () => {
    subscribe(undefined, {
      onSuccess: () => {
        setShow(false);
      },
    });
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card>
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Ativar Notificações</CardTitle>
          </div>
          <CardDescription>
            Receba atualizações em tempo real sobre suas entregas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleSubscribe} disabled={isPending} className="flex-1">
            {isPending ? 'Ativando...' : 'Ativar'}
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Agora não
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};