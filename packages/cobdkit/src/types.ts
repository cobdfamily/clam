/** Shared protocol + public types for the cobdkit mini-app runtime. */

export interface TransportOptions {
  /**
   * Origin of the host shell. Inbound messages from any other origin are
   * ignored, and outbound messages are targeted at this origin. Defaults to
   * `"*"` (no origin check) — set it in production.
   */
  hostOrigin?: string;
  /** Window to post to. Defaults to `window.parent`. */
  target?: Window;
}

export interface Transport {
  /** Send a request to the host and resolve with its result (or reject with its error). */
  call(capability: string, method: string, options?: unknown): Promise<unknown>;
  /** Subscribe to a host-pushed event for a capability. Returns an unsubscribe fn. */
  onEvent(capability: string, event: string, handler: (payload: unknown) => void): () => void;
  /** Fire-and-forget a raw message to the host. */
  post(message: object): void;
}

/** child -> host */
export interface CallMessage {
  __cobdkit: true;
  kind: "call";
  id: number;
  capability: string;
  method: string;
  options?: unknown;
}

/** host -> child: successful reply to a `call` */
export interface ResultMessage {
  __cobdkit: true;
  kind: "result";
  id: number;
  value: unknown;
}

/** host -> child: failed reply to a `call` */
export interface ErrorMessage {
  __cobdkit: true;
  kind: "error";
  id: number;
  error: { code?: number; message: string };
}

/** host -> child: unsolicited push (watch ticks, torch state changes, ...) */
export interface EventMessage {
  __cobdkit: true;
  kind: "event";
  capability: string;
  event: string;
  payload: unknown;
}

export type InboundMessage = ResultMessage | ErrorMessage | EventMessage;

export interface TorchAPI {
  on(): Promise<boolean>;
  off(): Promise<boolean>;
  toggle(): Promise<boolean>;
  /** Locally-cached mirror of host truth — eventually consistent, fine for UI. */
  readonly isOn: boolean;
}

export interface Cobdkit {
  readonly version: string;
  readonly torch: TorchAPI;
}

declare global {
  interface Window {
    cobdkit: Cobdkit;
  }
  // eslint-disable-next-line no-var
  var cobdkit: Cobdkit;
}
