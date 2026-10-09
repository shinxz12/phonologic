# PhonoLogic core UI

Import from `./components`. Each component imports its adjacent stylesheet. Tokens and global resets are loaded once by main.tsx. Fonts are Plus Jakarta Sans, Nunito Sans and Material Symbols Outlined, loaded in the styles/globals.css.

## Components

| Component       | Main props                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Button          | `variant`: primary / secondary / outline / ghost / danger; `size`: sm / md / lg; `loading`, native button props |
| IconButton      | `label`, `icon`, Button props                                                                                   |
| Icon            | Material Symbols `name`, `size`; decorative, hidden from assistive technology                                   |
| Card            | `tone`: white / soft / blue / green / yellow; HTML div props                                                    |
| Badge           | `tone`: blue / green / yellow / red / neutral; optional `icon`                                                  |
| StatPill        | `icon`, `tone`, content                                                                                         |
| ProgressBar     | `value`, `max`, accessible `label`, optional `caption`; clamps invalid values                                   |
| TextField       | `label`, `error`, `hint`, `icon`, native input props; generated accessible IDs                                  |
| AnswerOption    | `label`, `description`, `letter`, controlled `selected`, `state`: idle / correct / incorrect                    |
| SegmentTile     | `spelling`, optional opaque `notation`, controlled `selected`, `state`                                          |
| StepHeading     | `number`, content                                                                                               |
| InstructionCard | `title`, `icon`, content                                                                                        |
| FeedbackPanel   | `title`, `tone`: success / error / info; optional `action` + `onAction`                                         |
| LessonNode      | `label`, `status`: completed / current / locked / reward; `onClick`                                             |
| AudioControl    | `onPlay`, `label`, optional `onSpeedChange`, `speed`, `disabled`                                                |
| Navigation      | `items`, `activeId`, `onChange`, `placement`: sidebar / bottom                                                  |

```tsx
import { Button, SegmentTile, AnswerOption } from './components';

<Button icon="play_arrow" onClick={startLesson}>Bắt đầu ngay</Button>
<SegmentTile spelling="augh" notation={customSymbol} selected={selected}
  onClick={selectSegment} />
<AnswerOption label="Con gái (ruột)" letter="A" selected={selected}
  state="idle" onClick={selectAnswer} />
```

Selection stays controlled by the consuming screen. The primitives do not award XP, play audio, record speech or call backend services. AudioControl forwards user intent through callbacks. `notation` is displayed verbatim; no IPA conversion or phonetic assumptions.

## Design provenance

Source project: https://stitch.withgoogle.com/projects/17316557323109953295

Palette, type scales, 16/32/48px radii and spacing come from archived Stitch HTML. Primary references: mobile vocabulary `03872e3e…`, desktop sound quiz `7db7a20b…`, learning path `89387815…`. Desktop cards use 32px corners; mobile cards use 16px. Selected segments use blue, correct answers green, status badges tinted backgrounds and buttons raised shadows. Keyboard focus, disabled/loading states and error semantics supplement the static mockups.

The gallery is a new component review surface, not a replica of an entire app screen. The lesson preview adapts the vocabulary screen without IPA or fake AI scores. The illustration is the existing Stitch project asset. The reference HTML under `/stitch/reference.html` is unchanged, including original IPA labels, and only serves as a design reference.

## Run and verify

From `apps/frontend`: `bun run dev`, `bun run build`, `bun run typecheck`, `bun run test`.

Verified: TypeScript + production Vite build; five component tests covering disabled/loading controls, keyboard controlled selection, progress bounds, error associations and custom notation. Chrome visual checks at default desktop width and 390px mobile: no horizontal overflow, fonts loaded, successful answer/feedback flow.

External Google Fonts still require network access. Pixel-level screenshot parity for whole screens is not claimed; typography, palette and core treatments follow the source, while gallery layout and missing interaction states are purpose-built.

## Folder structure

- `components/ui`: reusable UI primitives; each component has its own TSX and CSS.
- `components/learning`: learning-specific components and shared answer state type.
- `components/layout`: navigation components.
- `styles`: tokens, resets, focus and reduced-motion rules.
- `features/component-gallery`: gallery feature, local lesson preview and its styles.
- `App.tsx`: application entry composition.
- `store`: existing application state.

Import individual components from their folder, or use the `components` barrel. Keep new hooks in `hooks` when actual shared behavior is extracted; no empty placeholder is needed.
