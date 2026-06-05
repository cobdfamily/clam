import { Geolocation } from "@capacitor/geolocation";

import type { CapabilityHandler } from "../types.js";

interface NativeCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}
interface NativePosition {
  coords: NativeCoords;
  timestamp: number;
}

/** Native ops the geo capability needs; defaults to @capacitor/geolocation. Injectable for testing. */
export interface GeoBackend {
  getCurrentPosition(options?: unknown): Promise<NativePosition>;
  watchPosition(options: unknown, cb: (pos: NativePosition | null, err?: unknown) => void): Promise<string>;
  clearWatch(id: string): Promise<void>;
}

const defaultGeoBackend: GeoBackend = {
  getCurrentPosition: (options) =>
    Geolocation.getCurrentPosition(options as never) as unknown as Promise<NativePosition>,
  watchPosition: (options, cb) =>
    Geolocation.watchPosition(options as never, (pos, err) => cb(pos as NativePosition | null, err)),
  clearWatch: (id) => Geolocation.clearWatch({ id }),
};

/** Flatten a native Position into the shape cobdcorekit's geolocation shim expects. */
function flatten(p: NativePosition) {
  const c = p.coords;
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    accuracy: c.accuracy,
    altitude: c.altitude ?? null,
    altitudeAccuracy: c.altitudeAccuracy ?? null,
    heading: c.heading ?? null,
    speed: c.speed ?? null,
    timestamp: p.timestamp,
  };
}

export interface GeoOptions {
  backend?: GeoBackend;
}

/**
 * `geo` capability — answers the `navigator.geolocation` shim that cobdcorekit
 * installs in mini-apps: `getCurrentPosition`, `watchPosition` (streams
 * `tick:<id>` events keyed by the shim's watch id), and `clearWatch`, on top of
 * `@capacitor/geolocation`. This replaces bowencommunity-core's
 * iframe `allow="geolocation"` approach — geolocation is now brokered (and
 * therefore gateable per mini-app via the broker's origin policy).
 */
export function createGeoCapability(opts: GeoOptions = {}): CapabilityHandler {
  const backend = opts.backend ?? defaultGeoBackend;
  const watches = new Map<number, string>(); // shim watch id -> native callback id

  return async (method, options, ctx) => {
    const o = (options ?? {}) as Record<string, unknown>;
    switch (method) {
      case "getCurrentPosition":
        return flatten(await backend.getCurrentPosition(o));

      case "watchPosition": {
        const watchId = Number(o.watchId);
        const geoOpts = { ...o };
        delete geoOpts.watchId;
        const nativeId = await backend.watchPosition(geoOpts, (pos, err) => {
          if (err || !pos) {
            ctx.emit(`tick:${watchId}`, {
              error: { message: String((err as Error)?.message ?? err ?? "watch error") },
            });
          } else {
            ctx.emit(`tick:${watchId}`, flatten(pos));
          }
        });
        watches.set(watchId, nativeId);
        return;
      }

      case "clearWatch": {
        const watchId = Number(o.watchId);
        const nativeId = watches.get(watchId);
        if (nativeId !== undefined) {
          await backend.clearWatch(nativeId);
          watches.delete(watchId);
        }
        return;
      }

      default:
        throw new Error(`geo: unknown method "${method}"`);
    }
  };
}
