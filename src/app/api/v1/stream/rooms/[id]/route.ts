import { NextRequest, NextResponse } from 'next/server';
import { sseManager } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  if (!sseManager.canAcceptClient()) {
    return new Response('Connection limit reached', { status: 429 });
  }

  let clientCallback: ((message: string) => void) | null = null;
  let intervalId: NodeJS.Timeout | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (clientCallback) {
      sseManager.removeClient(roomId, clientCallback);
      clientCallback = null;
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(new TextEncoder().encode("event: connected\ndata: {\"status\": \"ok\"}\n\n"));

      // Callback to push data to the client
      clientCallback = (message: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(message));
        } catch (e) {
          cleanup();
        }
      };

      const added = sseManager.addClient(roomId, clientCallback);
      if (!added) {
        controller.close();
        return;
      }

      // Keep connection alive with pings every 20 seconds
      intervalId = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode("event: ping\ndata: alive\n\n"));
        } catch (e) {
          cleanup();
          try { controller.close(); } catch {}
        }
      }, 20000);

      // Gracefully terminate stream after 3 minutes to recycle connections and garbage collect
      timeoutId = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch (e) {}
      }, 180000);

      req.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch (e) {}
      });
    },
    cancel() {
      cleanup();
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
