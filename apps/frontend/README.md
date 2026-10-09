# PhonoLogic frontend

React + TypeScript + Vite. Code is organized by feature, with shared UI and layout components.

```text
src/
├── components/
│   ├── ui/                    # Button, Card, TextField, Badge, ProgressBar…
│   ├── learning/              # Reusable AnswerOption, SegmentTile, LessonNode…
│   └── layout/                # Navigation and shared application layout
├── features/
│   └── component-gallery/
│       ├── components/        # Private LessonPreview composition
│       ├── ComponentGallery.tsx
│       ├── ComponentGallery.css
│       └── index.ts           # Public feature entry
├── styles/
│   ├── tokens.css             # Stitch color, type, spacing and radius values
│   └── globals.css            # Fonts, reset, focus and reduced motion
├── store/                     # Existing shared application state
├── App.tsx                    # App composition; future routes belong here
└── main.tsx
```

## Placement rules

- Put UI, hooks, service calls and types specific to one business feature in that feature folder. Create `hooks`, `api` or `types` only when there is real code for them.
- Shared primitives go in `components/ui`; shared learning widgets go in `components/learning`; shared navigation/layout goes in `components/layout`.
- Keep each component stylesheet beside its TSX file. Components import their own CSS. Tokens and global styles load once from `main.tsx`.
- Import a feature through its public `index.ts`. Shared components never import features. Move components to shared folders when multiple features need them, rather than coupling features through private imports.
- Future business features can be `auth`, `learning`, `practice`, `reading` and `progress`. These are not scaffolded until implemented.
- The component gallery is a development/review feature. It does not hold real lesson content or application services.

## Commands

```sh
bun run dev
bun run test
bun run typecheck
bun run build
```

See [component API](src/components/README.md) for props and design provenance. Custom notation strings are passed through unchanged.
