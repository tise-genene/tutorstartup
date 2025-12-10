# tutorstartup

tutor marketplace with Next.js web app and NestJS API in a Turborepo monorepo. 
Uses pnpm workspaces and AWS-first infrastructure.

## Structure
- `apps/web` – Next.js App Router frontend (React, Tailwind).
- `apps/api` – NestJS backend.
- `packages/*` – Shared packages (to be added).

## Getting started
1) Install pnpm: `npm install -g pnpm`
2) Install deps: `pnpm install`
3) Dev servers:
   - Web: `pnpm --filter web dev`
   - API: `pnpm --filter api start:dev`

## License
MIT

