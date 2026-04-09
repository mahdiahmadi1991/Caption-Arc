export const APP_ENVIRONMENTS = ["development", "production"] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

type RuntimeImportMeta = ImportMeta & {
  env?: {
    MODE?: string;
  };
};

export function detectAppEnvironment(): AppEnvironment {
  const mode = (import.meta as RuntimeImportMeta)?.env?.MODE;
  return mode === "production" ? "production" : "development";
}