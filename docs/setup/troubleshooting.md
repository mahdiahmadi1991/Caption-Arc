# Troubleshooting

## Extension Does Not Inject On Meeting Page

- run `pnpm chrome:debug:reload`
- verify host permissions and supported meeting URL shape
- rerun provider smoke scenario

## Runtime Messaging Fails With Unknown Action

- ensure extension runtime is reloaded
- confirm sender surface is using current action names from `entrypoints/background/index.ts`

## Cloud Sync Connection Issues

- check provider auth state in Settings
- re-run connect/disconnect flow
- inspect background logs for auth token errors

## Summary Generation Reliability Issues

- retry summary from history detail
- test a smaller or simpler profile instruction set for diagnosis
- verify OpenAI configuration and model readiness
