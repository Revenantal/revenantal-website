declare module "gamedig" {
  /** Server-only query API; its untrusted result is validated before use. */
  export const GameDig: {
    query: (options: Record<string, unknown>) => Promise<unknown>;
  };
}
