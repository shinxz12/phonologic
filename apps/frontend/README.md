# PhonoLogic frontend

React + TypeScript + Vite, backed by NestJS and PostgreSQL. Screens follow the archived [Stitch project](https://stitch.withgoogle.com/projects/17316557323109953295), using the existing component design system rather than a parallel set of primitives.

## Structure and placement

- `src/components/ui`: existing Button, IconButton, Card, Badge, TextField, ProgressBar and feedback primitives.
- `src/components/learning`: shared AnswerOption, SegmentTile, LessonNode and AudioControl.
- `src/components/layout`: Navigation and the EN/VI LanguageSelector.
- `src/features/auth`, `learning`, `reading`, `progress`, `admin`: feature-specific screen compositions, API calls and state. The component gallery remains a development/review surface, not course content.
- `src/lib/api.ts`: Axios clients, token storage and interceptors; authenticated requests inject the current access token. Concurrent expired-token requests share one refresh, retry at most once and clear authentication on terminal refresh failure. Public auth endpoints do not trigger refresh.
- `src/lib/query.ts`: TanStack React Query client, query keys and invalidation. API data is not duplicated in an independent application store.
- `src/lib/i18n.ts` and `src/lib/i18n/`: i18next EN/VI resources. Locale persists under `phonologic.language`; switching updates document language and visible UI, including existing API errors. Keep error objects and translation keys in state, not already-translated strings.
- `src/styles/tailwind.css`: Tailwind CSS v4 utilities and mappings to the original design tokens. Existing primitives keep their adjacent stylesheets; new feature layouts use Tailwind, not new feature stylesheets.
- `src/App.tsx`: application composition and hash routing. Learning, reading, progress and admin bundles are lazy-loaded.

Import features through their public `index.ts`; shared components must not import features. Keep feature-specific hooks, types and services inside that feature. Extract shared code only when it is actually reused. Tokens and global styles load once in `main.tsx`.

Dependencies used: TanStack React Query 5.104.1, Axios 1.20.0, i18next 26.4.2 and react-i18next 17.0.16. Authored course words, meanings and custom notation are data, not automatically translated UI strings. Custom notation is passed through unchanged; there is no IPA substitution.

## Implemented flows

- Registration, login, logout, profile and password changes, persistent EN/VI selector.
- Learning path, published-rule handbook, six question types, feedback, resume, missed-question review and content reporting.
- Microphone recording, preview, upload, authenticated playback and deletion. Uploads are limited to 5 MB and ownership is enforced by the API.
- Reading library with search/filters, exact target offsets, spelling practice and persistent reading completion.
- Progress from actual attempts, activity and reading state; learner preferences and private recordings.
- Permission-gated content administration (`rbac.manageRoles`): 155 Excel-derived draft rules, inline editing, JSON lesson/reading authoring, validation, publishing immutable versions and report moderation. Attempts and first-open readings retain their original content snapshot.

## Local setup

Requires Bun and PostgreSQL. From the repository root, install with `bun install`. Configure an ignored root `.env` with `DATABASE_URL`, `PORT`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` and `CORS_ORIGIN`. The local API uses port 4000; Vite proxies `/api` to it.

With `DATABASE_URL` available to the database commands:

```sh
# Working directory: packages/db
bun run migrate
bun run seed

# Working directory: apps/backend
bun run dev

# Separate terminal, working directory: apps/frontend
bun run dev --host 127.0.0.1
```

Frontend: http://127.0.0.1:5173. Backend: http://127.0.0.1:4000/api.

The existing development seed account is `admin@phonologic.dev` / `Admin@123456`. Replace its password and development JWT secrets before exposing the service. Seeded source rules remain drafts; the seed does not publish invented lessons or mark custom notation as confirmed.

```sh
# Working directory: apps/frontend
bun run typecheck
bun run build
bun run test

# Working directory: apps/backend
bun test test/answer-grading.test.ts
bun run typecheck
bun run build
bun run start
```

Backend runtime uses Bun for the compiled Nest entrypoint because workspace packages expose TypeScript source. Deploy the workspace packages along with `apps/backend/dist`; this is not a standalone Node-only bundle.

## Verification and limits

Observed: frontend/backend typechecks and production builds; four backend grading regression tests; real HTTP/PostgreSQL checks for authorization, concurrent refresh, idempotent answers, session resume, reading updates, snapshots, publishing validation and private audio access. Browser flows exercised desktop/mobile, registration/login, all six question types, repeated-letter spelling, recording/replay/upload/delete, reading, profile changes, publishing and moderation, with EN/VI switching and no horizontal overflow at 390 px.

Recording smoke uses a real MediaRecorder with a controlled Web Audio input and stores/replays the uploaded bytes. Recording is tap-to-start/tap-to-stop so touch browsers do not depend on long-press events. Browsers with Web Speech Recognition stop after any final utterance, whether correct or incorrect, and fall back to an eight-second limit if no final result arrives. Manual stop scores the latest interim result. The circular percentage combines normalized transcript similarity with browser recognition confidence; it is a word-recognition match, not an acoustic pronunciation or AI score. Browser TTS starts synchronously from the user action, retries when Chrome Mobile loads voices late, and resets a synthesis queue that accepts speech without starting playback. The reading practice arena uses a compact, single-word header and flattened speaking controls so the active task stays visible without repeating the word card. Physical microphone and TTS availability remain device- and permission-dependent.

Official custom-notation specification, approved pilot lessons/audio, pronunciation provider and acceptance criteria are still required from the product/content owners. Mockup-only payments, shop, league, hearts and other economy rules are not simulated; mail-based recovery/social identity providers are not configured. UI translations do not replace reviewed bilingual course content. External Google Fonts require network access, and full pixel-for-pixel screen parity is not claimed.

See [component API](src/components/README.md) and [product analysis](../../docs/product-analysis.md) for design provenance and remaining product decisions.
