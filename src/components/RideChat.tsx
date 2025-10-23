import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  sent_at: string;
}

interface RideChatProps {
  rideId: string;
  otherUserId: string;
  otherUserName: string;
  className?: string;
}

const RideChat = ({ rideId, otherUserId, otherUserName, className }: RideChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUserId(user.id);

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('ride_id', rideId)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        toast.error('Erro ao carregar chat');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${rideId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          ride_id: rideId,
          from_user_id: currentUserId,
          to_user_id: otherUserId,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-4 flex items-center justify-center", className)}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    );
  }

  return (
    <Card className={cn("p-4 flex flex-col", className)}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Chat com {otherUserName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-80">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma mensagem ainda. Inicie a conversa!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.from_user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] px-3 py-2 rounded-lg text-sm",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.sent_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Digite sua mensagem..."
          disabled={sending}
          maxLength={1000}
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          size="icon"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default RideChat;