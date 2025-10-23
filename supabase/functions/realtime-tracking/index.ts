import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REALTIME_PING_MS = 5000;
const MAX_CLIENTS_PER_RIDE = 10;

// Store active WebSocket connections by tracking ID (ride_id or batch_id)
const rooms = new Map<string, Set<WebSocket>>();

serve(async (req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const url = new URL(req.url);
  const ride_id = url.searchParams.get("ride_id");
  const batch_id = url.searchParams.get("batch_id");
  const role = url.searchParams.get("role"); // 'driver' or 'customer'
  
  const trackingId = ride_id || batch_id;
  
  if (!trackingId) {
    return new Response("Missing ride_id or batch_id", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log(`🟢 Client connected: ${role} for ${trackingId}`);
    
    // Create room if it doesn't exist
    if (!rooms.has(trackingId)) {
      rooms.set(trackingId, new Set());
    }
    
    const room = rooms.get(trackingId)!;
    
    // Check max clients limit
    if (room.size >= MAX_CLIENTS_PER_RIDE) {
      socket.close(1008, "Room full");
      return;
    }
    
    room.add(socket);
    
    // Send connection confirmation
    socket.send(JSON.stringify({
      type: 'connected',
      trackingId,
      role,
      clients: room.size
    }));
    
    console.log(`Room ${trackingId} now has ${room.size} clients`);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const room = rooms.get(trackingId);
      
      if (!room) return;

      console.log(`📨 Message from ${role}:`, data.type);

      // Handle different message types
      switch (data.type) {
        case 'location_update':
          // Driver sends location, broadcast to all other clients in room
          if (role === 'driver') {
            const locationData = {
              type: 'driver_location',
              lat: data.lat,
              lng: data.lng,
              heading: data.heading,
              speed: data.speed,
              accuracy: data.accuracy,
              timestamp: data.timestamp || Date.now()
            };
            
            // Broadcast to all clients except sender
            room.forEach(client => {
              if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(locationData));
              }
            });
            
            // Send acknowledgment to driver
            socket.send(JSON.stringify({
              type: 'ack',
              timestamp: Date.now()
            }));
          }
          break;

        case 'ping':
          // Respond to ping with pong
          socket.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;

        case 'eta_request':
          // Customer requests ETA, broadcast to driver
          if (role === 'customer') {
            room.forEach(client => {
              if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'eta_request',
                  timestamp: Date.now()
                }));
              }
            });
          }
          break;

        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  };

  socket.onerror = (error) => {
    console.error(`❌ WebSocket error for ${trackingId}:`, error);
  };

  socket.onclose = () => {
    console.log(`🔴 Client disconnected: ${role} from ${trackingId}`);
    
    const room = rooms.get(trackingId);
    if (room) {
      room.delete(socket);
      
      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(trackingId);
        console.log(`Room ${trackingId} deleted (empty)`);
      } else {
        // Notify remaining clients about disconnection
        room.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'client_disconnected',
              role,
              clients: room.size
            }));
          }
        });
        console.log(`Room ${trackingId} now has ${room.size} clients`);
      }
    }
  };

  return response;
});
