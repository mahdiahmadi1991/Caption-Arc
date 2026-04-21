import { DEVELOPMENT_ENVIRONMENT_CONFIG } from "./development";
import { PRODUCTION_ENVIRONMENT_CONFIG } from "./production";
import {
  detectAppEnvironment,
  type AppEnvironment,
} from "../runtime-environment";

export const APP_ENVIRONMENT_CONFIGS = {
  development: DEVELOPMENT_ENVIRONMENT_CONFIG,
  production: PRODUCTION_ENVIRONMENT_CONFIG,
} as const;

export type AppEnvironmentConfig =
  (typeof APP_ENVIRONMENT_CONFIGS)[AppEnvironment];

export function getAppEnvironmentConfig(
  environment: AppEnvironment = detectAppEnvironment()
): AppEnvironmentConfig {
  return APP_ENVIRONMENT_CONFIGS[environment];
}

export function isDiagnosticsViewerEnabledForEnvironment(
  environment: AppEnvironment = detectAppEnvironment()
): boolean {
  return Boolean(getAppEnvironmentConfig(environment).diagnostics.viewerEnabled);
}