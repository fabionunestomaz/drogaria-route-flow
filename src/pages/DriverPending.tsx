import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function DriverPending() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Clock className="h-24 w-24 text-primary animate-pulse" />
              <CheckCircle className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Cadastro Recebido!</h1>
            <p className="text-lg text-muted-foreground">
              Seu cadastro foi enviado com sucesso
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-left text-sm">
                <p className="font-medium mb-1">Aguardando aprovação</p>
                <p className="text-muted-foreground">
                  Nossa equipe está analisando seus documentos. Você receberá uma notificação assim que seu cadastro for aprovado.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              O processo de aprovação pode levar até 24 horas
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              Fazer Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
