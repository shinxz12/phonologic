# Core frontend design system

Scope authorized: reusable components matching the supplied Stitch designs, in the existing React/Vite frontend. Custom notation is an opaque display string; the external notation specification is still pending.

1. Extract the exact palette, fonts, spacing and corner radii from the archived Stitch HTML into CSS variables.
2. Build Button/IconButton, Icon, Card, Badge/StatPill, ProgressBar, TextField, AnswerOption, SegmentTile, StepHeading, FeedbackPanel, LessonNode and navigation primitives. Use native controls and controlled selection props.
3. Compose an interactive component gallery and lesson preview using the same primitives. Keep reference imagery local and sourced from Stitch.
4. Verify keyboard selection, disabled/loading controls, field error semantics and bounded progress with Vitest. Run TypeScript and production build.
5. Inspect desktop/mobile screenshots; compare component treatments with the original Stitch screenshot/HTML. Record limits rather than claiming pixel parity without evidence.

Files: `apps/frontend/src/components/{ui,learning,layout}`, `apps/frontend/src/styles/{tokens.css,globals.css}`, `apps/frontend/src/features/component-gallery`, `apps/frontend/src/App.tsx`, frontend TypeScript/test configuration and documentation.

Structure updated on user request: shared components with adjacent CSS and feature-based screen composition. No standalone pages or design-system folder remains.
