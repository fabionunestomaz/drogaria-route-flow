import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, Database, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Card } from './ui/card';

interface SeedResponse {
  success: boolean;
  message: string;
  credentials?: {
    admin: { email: string; password: string };
    driver: { email: string; password: string };
    customer: { email: string; password: string };
  };
}

const SeedDataButton = () => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [result, setResult] = useState<SeedResponse | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<SeedResponse>('seed-data');

      if (error) throw error;

      setResult(data);
      toast.success(data.message || 'Dados de teste criados!');
    } catch (error: any) {
      console.error('Error seeding data:', error);
      toast.error('Erro ao criar dados de teste');
      setResult({
        success: false,
        message: error.message || 'Erro ao criar dados de teste'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setDialogOpen(true)}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Database className="h-4 w-4 mr-2" />
            Criar Dados de Teste
          </>
        )}
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Criar Dados de Teste
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {!result ? (
                  <>
                    <p>
                      Isso criará dados de exemplo para testar o sistema, incluindo:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>3 usuários (Admin, Motorista, Cliente)</li>
                      <li>1 motorista aprovado e disponível</li>
                      <li>3 clientes cadastrados</li>
                      <li>2 lotes de entrega (1 em progresso, 1 pendente)</li>
                      <li>5 entregas em diferentes status</li>
                      <li>2 solicitações de clientes</li>
                      <li>2 cupons de desconto</li>
                    </ul>
                    <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                      ⚠️ Usuários existentes com os mesmos emails serão reutilizados.
                    </p>
                  </>
                ) : (
                  <div className="space-y-4">
                    {result.success ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                          <Check className="h-5 w-5" />
                          <span className="font-semibold">{result.message}</span>
                        </div>

                        {result.credentials && (
                          <Card className="p-4 bg-muted/50">
                            <h4 className="font-semibold mb-3">Credenciais de Acesso:</h4>
                            <div className="space-y-3 text-sm font-mono">
                              <div>
                                <p className="font-semibold text-primary">🔐 Admin</p>
                                <p>Email: {result.credentials.admin.email}</p>
                                <p>Senha: {result.credentials.admin.password}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-blue-500">🚗 Motorista</p>
                                <p>Email: {result.credentials.driver.email}</p>
                                <p>Senha: {result.credentials.driver.password}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-green-500">👤 Cliente</p>
                                <p>Email: {result.credentials.customer.email}</p>
                                <p>Senha: {result.credentials.customer.password}</p>
                              </div>
                            </div>
                          </Card>
                        )}

                        <p className="text-sm text-muted-foreground">
                          Faça logout e login com uma das credenciais acima para testar.
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span>{result.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {!result ? (
              <>
                <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleSeed();
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Dados'
                  )}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => {
                setDialogOpen(false);
                setResult(null);
                window.location.reload();
              }}>
                Fechar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SeedDataButton;