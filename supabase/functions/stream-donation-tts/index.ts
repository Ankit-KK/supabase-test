import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const SARVAM_API_KEY = Deno.env.get('SARVAM_API_KEY');
  if (!SARVAM_API_KEY) {
    return new Response("SARVAM_API_KEY not configured", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let sarvamSocket: WebSocket | null = null;

  socket.onopen = () => {
    console.log("Client WebSocket connected");
    
    // Connect to Sarvam AI streaming endpoint
    sarvamSocket = new WebSocket("wss://api.sarvam.ai/text-to-speech-stream");
    
    sarvamSocket.onopen = () => {
      console.log("Connected to Sarvam AI");
      socket.send(JSON.stringify({ type: "ready" }));
    };

    sarvamSocket.onmessage = (event) => {
      // Forward audio chunks from Sarvam to client
      socket.send(event.data);
    };

    sarvamSocket.onerror = (error) => {
      console.error("Sarvam WebSocket error:", error);
      socket.send(JSON.stringify({ type: "error", message: "Sarvam connection error" }));
    };

    sarvamSocket.onclose = () => {
      console.log("Sarvam WebSocket closed");
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === "config") {
        // Forward config with API key
        if (sarvamSocket && sarvamSocket.readyState === WebSocket.OPEN) {
          const configMessage = {
            type: "config",
            data: {
              ...message.data,
              api_subscription_key: SARVAM_API_KEY,
            }
          };
          sarvamSocket.send(JSON.stringify(configMessage));
          console.log("Config sent to Sarvam AI");
        }
      } else if (message.type === "text" || message.type === "flush" || message.type === "ping") {
        // Forward text/flush/ping messages
        if (sarvamSocket && sarvamSocket.readyState === WebSocket.OPEN) {
          sarvamSocket.send(JSON.stringify(message));
          console.log(`${message.type} message forwarded to Sarvam AI`);
        }
      }
    } catch (error) {
      console.error("Error processing client message:", error);
      socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket disconnected");
    if (sarvamSocket) {
      sarvamSocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (sarvamSocket) {
      sarvamSocket.close();
    }
  };

  return response;
});
