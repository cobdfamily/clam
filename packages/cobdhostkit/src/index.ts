export const VERSION = "0.0.0";

export { createHostBroker } from "./broker.js";
export type { HostBroker } from "./broker.js";

export { createTorchCapability } from "./capabilities/torch.js";
export type { TorchBackend, TorchOptions } from "./capabilities/torch.js";

export { createGeoCapability } from "./capabilities/geo.js";
export type { GeoBackend, GeoOptions } from "./capabilities/geo.js";

export { createBrowserCapability } from "./capabilities/browser.js";
export type { BrowserBackend, BrowserOptions } from "./capabilities/browser.js";

export { createPdfCapability } from "./capabilities/pdf.js";
export type { PdfBackend, PdfOpenParams, PdfOptions } from "./capabilities/pdf.js";

export { createNavCapability } from "./capabilities/nav.js";
export type { NavOptions, NavTarget } from "./capabilities/nav.js";

export type { CapabilityContext, CapabilityHandler, HostBrokerOptions } from "./types.js";
