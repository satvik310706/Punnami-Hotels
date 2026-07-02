import { NextRequest, NextResponse } from 'next/server';
import { sseManager } from '@/lib/sse';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  let clientCallback: ((message: string) => void) | null = null;
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(new TextEncoder().encode("event: connected\ndata: {\"status\": \"ok\"}\n\n"));

      // Callback to push data to the client
      clientCallback = (message: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(message));
        } catch (e) {
          // Stream might be closed
        }
      };

      sseManager.addClient(roomId, clientCallback);

      // Keep connection alive with pings every 20 seconds
      intervalId = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode("event: ping\ndata: alive\n\n"));
        } catch (e) {
          // Stream closed
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (clientCallback) {
          sseManager.removeClient(roomId, clientCallback);
        }
        try {
          controller.close();
        } catch (e) {}
      });
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (clientCallback) {
        sseManager.removeClient(roomId, clientCallback);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
