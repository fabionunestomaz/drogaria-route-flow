import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REALTIME_PING_MS = 5000;
const MAX_CLIENTS_PER_RIDE = 50;

// Store active connections by ride_id
const rooms = new Map<string, Set<WebSocket>>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const rideId = url.searchParams.get("ride_id");
  const role = url.searchParams.get("role"); // 'driver' or 'customer'

  if (!rideId) {
    return new Response("Missing ride_id parameter", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log(`[${rideId}] ${role} connected`);

    // Initialize room if it doesn't exist
    if (!rooms.has(rideId)) {
      rooms.set(rideId, new Set());
    }

    const room = rooms.get(rideId)!;

    // Limit clients per room
    if (room.size >= MAX_CLIENTS_PER_RIDE) {
      console.warn(`[${rideId}] Max clients reached`);
      socket.close(1008, "Room full");
      return;
    }

    room.add(socket);

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connected',
      ride_id: rideId,
      timestamp: Date.now()
    }));

    console.log(`[${rideId}] Total clients: ${room.size}`);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[${rideId}] Message from ${role}:`, data.type);

      if (data.type === 'location_update' && role === 'driver') {
        // Validate location data
        const { lat, lng, heading, speed, accuracy, timestamp } = data;

        if (!lat || !lng) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid location data'
          }));
          return;
        }

        // Broadcast to all clients in the room
        const room = rooms.get(rideId);
        if (room) {
          const broadcastData = JSON.stringify({
            type: 'driver_location',
            lat,
            lng,
            heading: heading || null,
            speed: speed || null,
            accuracy: accuracy || null,
            timestamp: timestamp || Date.now()
          });

          let broadcastCount = 0;
          room.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
              broadcastCount++;
            }
          });

          console.log(`[${rideId}] Broadcasted to ${broadcastCount} clients`);

          // Acknowledge to driver
          socket.send(JSON.stringify({
            type: 'ack',
            timestamp: Date.now()
          }));
        }
      } else if (data.type === 'ping') {
        // Heartbeat
        socket.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
      } else if (data.type === 'eta_request' && role === 'customer') {
        // Client requesting ETA recalculation
        const room = rooms.get(rideId);
        if (room) {
          room.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'eta_request',
                timestamp: Date.now()
              }));
            }
          });
        }
      }
    } catch (error) {
      console.error(`[${rideId}] Error processing message:`, error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  };

  socket.onerror = (error) => {
    console.error(`[${rideId}] WebSocket error:`, error);
  };

  socket.onclose = () => {
    console.log(`[${rideId}] ${role} disconnected`);

    const room = rooms.get(rideId);
    if (room) {
      room.delete(socket);
      console.log(`[${rideId}] Remaining clients: ${room.size}`);

      // Cleanup empty rooms
      if (room.size === 0) {
        rooms.delete(rideId);
        console.log(`[${rideId}] Room closed`);
      } else {
        // Notify remaining clients
        room.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'client_disconnected',
              role,
              timestamp: Date.now()
            }));
          }
        });
      }
    }
  };

  return response;
});