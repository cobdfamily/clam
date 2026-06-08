// @cobdfamily/oister -- the umbrella-shell template + its generator.
export type {
    OisterConfig,
    CdnAsset,
    CdnManifest,
    NavLink,
    Brand,
    Menu,
    MenuItem,
    Seo,
    AppInput,
} from "./types.js";
export {
    renderApp,
    renderOisterShell,
    appToConfig,
    validateOisterConfig,
    loadBundledTemplate,
} from "./generate.js";
