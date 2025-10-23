# 🚀 Sistema de WebSocket Tracking em Tempo Real

## 📋 Visão Geral

Sistema completo de rastreamento em tempo real implementado com WebSocket nativo do Deno, permitindo que clientes acompanhem a localização do motorista com atualização automática de ETA.

---

## 🏗️ Arquitetura

### **Backend - Edge Function**
`supabase/functions/realtime-tracking/index.ts`

**Características:**
- WebSocket Server nativo do Deno
- Sistema de "salas" (rooms) por `ride_id`
- Broadcast de localização para todos os clientes conectados
- Limite de 50 clientes por sala
- Heartbeat (ping/pong) para manter conexão ativa

**Parâmetros da URL:**
```
wss://dnflkxdyfmuubgjnfshe.supabase.co/functions/v1/realtime-tracking?ride_id={id}&role={driver|customer}
```

---

### **Frontend - Hooks React**

#### 1. `useDriverTracking` (Motorista)
**Localização:** `src/hooks/useDriverTracking.ts`

**Funcionalidades:**
- ✅ Conecta ao WebSocket como "driver"
- ✅ Obtém localização GPS em tempo real (watchPosition)
- ✅ Envia localização a cada movimento (high accuracy)
- ✅ Salva histórico no DB (`ride_locations`)
- ✅ Heartbeat automático a cada 5s
- ✅ Reconnect automático

**Dados enviados:**
```json
{
  "type": "location_update",
  "lat": -15.7942,
  "lng": -47.8822,
  "heading": 45.2,
  "speed": 12.5,
  "accuracy": 10,
  "timestamp": 1234567890
}
```

---

#### 2. `useRideTracking` (Cliente)
**Localização:** `src/hooks/useRideTracking.ts`

**Funcionalidades:**
- ✅ Conecta ao WebSocket como "customer"
- ✅ Recebe atualizações de localização do driver
- ✅ Calcula ETA automaticamente com Mapbox Directions
- ✅ Recalcula ETA a cada 30s OU quando driver move >200m
- ✅ Retorna: `{ connected, driverLocation, eta, error }`

**Dados recebidos:**
```json
{
  "type": "driver_location",
  "lat": -15.7942,
  "lng": -47.8822,
  "heading": 45.2,
  "speed": 12.5,
  "accuracy": 10,
  "timestamp": 1234567890
}
```

---

### **Componentes UI**

#### 1. `LiveTrackingMap`
**Localização:** `src/components/LiveTrackingMap.tsx`

**Recursos:**
- 🗺️ Mapa com posição do motorista em tempo real
- ⏱️ Card flutuante com ETA ("Chega em ~ X min")
- 📊 Velocidade e precisão GPS do motorista
- 🟢 Indicador de conexão (conectado/reconectando)
- 🎯 Auto-centraliza no motorista

**Props:**
```tsx
<LiveTrackingMap
  rideId="uuid"
  originLat={-15.7942}
  originLng={-47.8822}
  destLat={-15.8011}
  destLng={-47.8858}
  destAddress="Rua Exemplo, 123"
/>
```

---

#### 2. `DriverTrackingControl`
**Localização:** `src/components/DriverTrackingControl.tsx`

**Recursos:**
- 🔘 Botão Iniciar/Parar Rastreamento
- 🟢 Badge de status (Ativo/Desconectado)
- ⚠️ Alerta de erros de conexão/GPS
- 🔒 Aviso de privacidade LGPD

**Props:**
```tsx
<DriverTrackingControl
  rideId="uuid"
  className="mb-6"
/>
```

---

## 🔄 Fluxo de Funcionamento

### **Cenário 1: Motorista Inicia Rastreamento**

1. Motorista clica em "Iniciar Rastreamento"
2. `useDriverTracking` é ativado (`enabled: true`)
3. Hook conecta ao WebSocket com `role=driver`
4. Obtém permissão de geolocalização do navegador
5. `watchPosition` envia localização a cada movimento
6. WebSocket envia `location_update` para o servidor
7. Servidor faz broadcast para todos os clientes (customers) na sala

---

### **Cenário 2: Cliente Visualiza Rastreamento**

1. Cliente abre página `/ride/{rideId}`
2. `useRideTracking` conecta com `role=customer`
3. Hook recebe `driver_location` via WebSocket
4. Atualiza mapa com nova posição
5. Se driver moveu >200m OU passou 30s:
   - Chama `calculateETA` com Mapbox Directions API
   - Atualiza card de ETA ("Chega em ~ X min")

---

## 📊 Otimizações de Performance

### **Recálculo Inteligente de ETA**
```typescript
// Recalcula apenas quando necessário:
- A cada 30 segundos (polling)
- OU quando motorista move mais de 200 metros
```

### **Heartbeat (Ping/Pong)**
```typescript
// Mantém conexão ativa
setInterval(() => {
  ws.send({ type: 'ping' })
}, 5000)
```

### **Limite de Clientes**
```typescript
// Máximo 50 clientes por sala
if (room.size >= MAX_CLIENTS_PER_RIDE) {
  socket.close(1008, "Room full");
}
```

---

## 🔒 Privacidade e LGPD

### **Coleta de Localização**
✅ **Apenas durante corrida ativa**
- Localização não é coletada fora de entregas
- Motorista precisa ativar manualmente
- Pode pausar a qualquer momento

### **Armazenamento**
```sql
-- Tabela ride_locations
CREATE TABLE ride_locations (
  id UUID PRIMARY KEY,
  ride_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

### **Aviso ao Usuário**
> "Sua localização é usada apenas durante a entrega ativa e será compartilhada com o cliente."

---

## 🧪 Como Testar

### **1. Testar como Motorista**
```bash
1. Login como driver
2. Ir para /motoboy
3. Clicar em "Iniciar Rastreamento"
4. Permitir acesso à localização
5. Verificar badge "Ativo" com ícone pulsando
```

### **2. Testar como Cliente**
```bash
1. Abrir /ride/{rideId} em outra aba/dispositivo
2. Verificar mapa carregando
3. Quando motorista ativar: ver posição aparecer
4. Verificar ETA atualizando ("Chega em ~ X min")
5. Ver velocidade do motorista em tempo real
```

### **3. Testar Disconnects**
```bash
1. Fechar aba do motorista
2. Cliente deve ver mensagem "Aguardando localização..."
3. Reabrir aba do motorista
4. Tracking deve reconectar automaticamente
```

---

## 🐛 Troubleshooting

### **Problema: WebSocket não conecta**
```typescript
// Verificar URL da edge function
const WS_URL = `wss://dnflkxdyfmuubgjnfshe.supabase.co/functions/v1/realtime-tracking`;
```

### **Problema: Geolocalização não funciona**
```typescript
// Verificar permissões do navegador
// Chrome: Configurações > Privacidade > Permissões do site > Localização
// Safari: Ajustes > Safari > Localização > Permitir
```

### **Problema: ETA não atualiza**
```typescript
// Verificar token do Mapbox
console.log('MAPBOX_TOKEN:', import.meta.env.VITE_MAPBOX_TOKEN);

// Verificar logs da API
// Network tab > Filter: "mapbox" > Ver status codes
```

---

## 📱 Uso em Mobile (PWA)

### **GPS High Accuracy**
```javascript
navigator.geolocation.watchPosition(callback, error, {
  enableHighAccuracy: true,  // ✅ Usa GPS, não Wi-Fi
  timeout: 10000,            // 10s timeout
  maximumAge: 0              // Sem cache
});
```

### **Background Tracking**
⚠️ **Limitação:** WebSocket fecha quando app vai para background

**Solução Futura:**
- Implementar Background Geolocation API
- Ou usar Service Worker com Periodic Background Sync

---

## 🚀 Próximas Melhorias

1. ⏭️ **Desenhar rota no mapa** (polyline com Mapbox Directions)
2. ⏭️ **Notificação push** quando motorista se aproxima
3. ⏭️ **Histórico de rotas** com replay
4. ⏭️ **Compartilhar link de tracking** via WhatsApp
5. ⏭️ **Estimativa de bateria** para motorista

---

## 📊 Monitoramento

### **Logs da Edge Function**
```bash
# Ver logs do WebSocket
supabase functions logs realtime-tracking

# Filtrar por ride_id
supabase functions logs realtime-tracking --filter "ride_id=abc123"
```

### **Métricas Importantes**
- Número de conexões ativas por ride
- Taxa de reconnect
- Latência de broadcast (ms)
- Frequência de atualização de localização

---

## ✅ Checklist de Implementação

- [x] Edge function WebSocket
- [x] Hook useDriverTracking
- [x] Hook useRideTracking
- [x] Componente LiveTrackingMap
- [x] Componente DriverTrackingControl
- [x] Integração com Mapbox Directions (ETA)
- [x] Salvamento de histórico no DB
- [x] Página RideTracking
- [x] Sistema de salas (rooms)
- [x] Heartbeat (ping/pong)
- [x] Reconnect automático
- [x] Aviso de privacidade LGPD
- [ ] Desenhar rota no mapa
- [ ] Notificação push
- [ ] Compartilhar link de tracking

---

**Sistema completo de WebSocket tracking implementado e funcional! 🎉**