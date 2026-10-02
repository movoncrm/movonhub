import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare adapter configuration.
 *
 * Defaults are intentionally used: no incremental cache is configured, so pages
 * are server-rendered on demand. To enable caching later, add an R2/KV
 * incremental cache here (see @opennextjs/cloudflare docs).
 */
export default defineCloudflareConfig({});
