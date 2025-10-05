import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    console.error("SARVAM_API_KEY not configured");
    return new Response("SARVAM_API_KEY not configured", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let sarvamSocket: WebSocket | null = null;
  let configReceived = false;

  socket.onopen = () => {
    console.log("Client connected to edge function");
    // Connect to Sarvam AI with API key in URL
    const sarvamUrl = `wss://api.sarvam.ai/text-to-speech-stream?api_subscription_key=${SARVAM_API_KEY}`;
    sarvamSocket = new WebSocket(sarvamUrl);
    
    sarvamSocket.onopen = () => {
      console.log("Edge function connected to Sarvam AI");
      socket.send(JSON.stringify({ type: "ready" }));
    };

    sarvamSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received from Sarvam:", data.type);
        socket.send(event.data);
      } catch (e) {
        console.error("Error parsing Sarvam message:", e);
      }
    };

    sarvamSocket.onerror = (error) => {
      console.error("Sarvam WebSocket error:", error);
      socket.send(JSON.stringify({ type: "error", message: "Sarvam connection error" }));
    };

    sarvamSocket.onclose = (event) => {
      console.log("Sarvam WebSocket closed:", event.code, event.reason);
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("Received from client:", message.type);
      
      if (!sarvamSocket || sarvamSocket.readyState !== WebSocket.OPEN) {
        console.error("Sarvam WebSocket not ready");
        socket.send(JSON.stringify({ type: "error", message: "Connection not ready" }));
        return;
      }

      if (message.type === "config") {
        const configMessage = {
          type: "config",
          data: {
            api_subscription_key: SARVAM_API_KEY,
            speaker: message.data?.speaker || "anushka",
            target_language_code: message.data?.target_language_code || "hi-IN",
            pitch: message.data?.pitch || 0,
            pace: message.data?.pace || 1.0,
            loudness: message.data?.loudness || 1.5,
            output_audio_codec: message.data?.output_audio_codec || "mp3",
            output_audio_bitrate: message.data?.output_audio_bitrate || "128k",
            min_buffer_size: message.data?.min_buffer_size || 50,
            max_chunk_length: message.data?.max_chunk_length || 200
          }
        };
        
        sarvamSocket.send(JSON.stringify(configMessage));
        configReceived = true;
        console.log("Config sent to Sarvam with API key");
      } else if (message.type === "text") {
        if (!configReceived) {
          console.error("Config not sent before text");
          socket.send(JSON.stringify({ type: "error", message: "Send config first" }));
          return;
        }
        sarvamSocket.send(JSON.stringify({
          type: "text",
          data: { text: message.data?.text || "" }
        }));
        console.log("Text forwarded to Sarvam");
      } else if (message.type === "flush") {
        sarvamSocket.send(JSON.stringify({ type: "flush" }));
        console.log("Flush sent to Sarvam");
      } else if (message.type === "ping") {
        sarvamSocket.send(JSON.stringify({ type: "ping" }));
        console.log("Ping sent to Sarvam");
      }
    } catch (error) {
      console.error("Error processing client message:", error);
      socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  };

  socket.onclose = () => {
    console.log("Client disconnected");
    if (sarvamSocket && sarvamSocket.readyState === WebSocket.OPEN) {
      sarvamSocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (sarvamSocket && sarvamSocket.readyState === WebSocket.OPEN) {
      sarvamSocket.close();
    }
  };

  return response;
});
