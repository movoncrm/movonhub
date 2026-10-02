/**
 * MOVONHUB AI service abstraction.
 *
 * The platform ships with a provider-agnostic boundary so an AI backend can be
 * added without restructuring the app. No provider is bundled and no keys are
 * exposed to the client. Until AI_PROVIDER and AI_API_KEY are configured,
 * `isConfigured()` is false and `generate()` refuses to fabricate responses.
 */

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiContext {
  /** Official catalogue entries the assistant may ground its answer in. */
  products?: { name: string; summary: string; sourceUrl?: string }[];
}

export interface AiProvider {
  name: string;
  generate(messages: AiMessage[], context?: AiContext): Promise<string>;
}

export function isConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER && process.env.AI_API_KEY);
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("MOVONHUB AI is not configured. Set AI_PROVIDER and AI_API_KEY on the server.");
    this.name = "AiNotConfiguredError";
  }
}

/**
 * Resolve the configured provider. Returns null when nothing is configured so
 * the UI can show an honest "not configured" state instead of a fake reply.
 */
export function getProvider(): AiProvider | null {
  if (!isConfigured()) return null;
  // Provider implementations are added here as they are enabled. The interface
  // above is intentionally the only contract the rest of the app depends on.
  return null;
}

export async function generate(messages: AiMessage[], context?: AiContext): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new AiNotConfiguredError();
  return provider.generate(messages, context);
}
