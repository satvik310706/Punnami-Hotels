export class ReconnectingEventSource {
  private url: string;
  private es: EventSource | null = null;
  private retryTimes = [1000, 2000, 5000, 10000];
  private retryAttempt = 0;
  private maxRetries = this.retryTimes.length - 1;
  private isClosed = false;
  private listeners: Map<string, Array<(event: MessageEvent) => void>> = new Map();

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    if (this.isClosed) return;
    
    this.es = new EventSource(this.url);

    this.es.onopen = () => {
      this.retryAttempt = 0; // Reset backoff on success
    };

    this.es.onerror = () => {
      this.es?.close();
      if (this.isClosed) return;

      const delay = this.retryTimes[Math.min(this.retryAttempt, this.maxRetries)];
      this.retryAttempt++;
      
      setTimeout(() => {
        this.connect();
      }, delay);
    };

    // Reattach listeners
    for (const [event, callbacks] of this.listeners.entries()) {
      for (const cb of callbacks) {
        this.es.addEventListener(event, cb);
      }
    }
  }

  addEventListener(event: string, callback: (event: MessageEvent) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    this.es?.addEventListener(event, callback);
  }

  removeEventListener(event: string, callback: (event: MessageEvent) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
    this.es?.removeEventListener(event, callback);
  }

  close() {
    this.isClosed = true;
    this.es?.close();
  }
}
