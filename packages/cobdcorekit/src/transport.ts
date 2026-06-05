import type { InboundMessage, Transport, TransportOptions } from "./types.js";

/**
 * The single postMessage pipe shared by every cobdkit surface. Both the
 * `navigator.geolocation` shim and `cobdkit.torch` sit on top of this — they
 * never talk to the host directly.
 */
export function createTransport(opts: TransportOptions = {}): Transport {
  const hostOrigin = opts.hostOrigin ?? "*";
  const target: Window = opts.target ?? window.parent;

  let seq = 0;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  const handlers = new Map<string, Set<(payload: unknown) => void>>();

  window.addEventListener("message", (e: MessageEvent) => {
    if (hostOrigin !== "*" && e.origin !== hostOrigin) return;
    const msg = e.data as InboundMessage | undefined;
    if (!msg || (msg as { __cobdkit?: unknown }).__cobdkit !== true) return;

    if (msg.kind === "result") {
      const p = pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        p.resolve(msg.value);
      }
    } else if (msg.kind === "error") {
      const p = pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        p.reject(msg.error);
      }
    } else if (msg.kind === "event") {
      handlers.get(`${msg.capability}:${msg.event}`)?.forEach((h) => h(msg.payload));
    }
  });

  function post(message: object): void {
    target.postMessage({ __cobdkit: true, ...message }, hostOrigin);
  }

  function call(capability: string, method: string, options?: unknown): Promise<unknown> {
    const id = ++seq;
    return new Promise<unknown>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      post({ kind: "call", id, capability, method, options });
    });
  }

  function onEvent(
    capability: string,
    event: string,
    handler: (payload: unknown) => void,
  ): () => void {
    const key = `${capability}:${event}`;
    let set = handlers.get(key);
    if (!set) {
      set = new Set();
      handlers.set(key, set);
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
    };
  }

  return { call, onEvent, post };
}
