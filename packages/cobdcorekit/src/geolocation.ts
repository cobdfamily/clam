import type { Transport } from "./types.js";

/** Flat position payload the host broker sends back (coords + timestamp). */
interface HostPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface HostError {
  code?: number;
  message: string;
}

/** GeolocationPosition is not constructible — fabricate the right shape. */
function toPosition(p: HostPosition): GeolocationPosition {
  return {
    coords: {
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy,
      altitude: p.altitude,
      altitudeAccuracy: p.altitudeAccuracy,
      heading: p.heading,
      speed: p.speed,
      toJSON() {
        return this;
      },
    },
    timestamp: p.timestamp,
    toJSON() {
      return this;
    },
  } as GeolocationPosition;
}

function toError(e: HostError): GeolocationPositionError {
  return {
    code: e.code ?? 2,
    message: e.message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

/**
 * Override `navigator.geolocation` so a mini-app's ordinary W3C calls are
 * intercepted and routed to the host broker. The app can't tell the API isn't
 * the browser's own — the OS permission prompt and the real GPS read happen in
 * the host, where per-mini-app policy is enforced.
 */
export function installGeolocationShim(transport: Transport): void {
  let watchSeq = 0;
  const watchOff = new Map<number, () => void>();

  const geolocation: Geolocation = {
    getCurrentPosition(success, error, options) {
      transport
        .call("geo", "getCurrentPosition", options)
        .then((p) => success(toPosition(p as HostPosition)))
        .catch((e) => error?.(toError(e as HostError)));
    },

    watchPosition(success, error, options) {
      // W3C watchPosition is synchronous: mint a local id now, start streaming.
      const watchId = ++watchSeq;
      transport.call("geo", "watchPosition", { ...options, watchId }).catch((e) => {
        error?.(toError(e as HostError));
      });
      const off = transport.onEvent("geo", `tick:${watchId}`, (payload) => {
        const p = payload as HostPosition & { error?: HostError };
        if (p.error) error?.(toError(p.error));
        else success(toPosition(p));
      });
      watchOff.set(watchId, off);
      return watchId;
    },

    clearWatch(watchId) {
      watchOff.get(watchId)?.();
      watchOff.delete(watchId);
      transport.call("geo", "clearWatch", { watchId }).catch(() => {});
    },
  };

  Object.defineProperty(navigator, "geolocation", {
    value: geolocation,
    configurable: true,
    writable: false,
  });
}
