---
description: This shoudl be loaded for following the design pattern in teh frontend
# applyTo: 'This shoudl be loaded for following the design pattern in teh frontend' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
# AlloCat — Design System

> **Single source of truth for all UI design decisions.**
> This is a **financial control interface** — not a decorative UI.

---

## Design Philosophy
- Minimalism & clarity
- Financial discipline through visual structure
- Speed of interaction
- Zero visual noise

---

## Aesthetic Canvas System (Customizable Base)

AlloCat uses a dynamic CSS variable injection system. While the core philosophy remains minimal, users can tint their UI elements globally using a curated designer palette.

| Element | CSS Variable | Function |
|---------|--------------|----------|
| **Background** | `--background` | Main page background (solid/tinted) |
| **Cards** | `--card` | Background for interactive cards and components |
| **Primary** | `--primary` | Toggles, primary action buttons (excluding destructive) |
| **Borders** | `--border` | Must remain extremely subtle (e.g. 5% opacity overlay) to preserve the borderless aesthetic |

### Curated Color Palette
The customizer supports the following aesthetic tints tailored to preserve contrast:
`zinc`, `slate`, `stone`, `blue`, `emerald`, `rose`, `indigo`, `orange`.

### Color Rules
- **No ad-hoc bright colors** outside the customizable palette or explicit destructive actions.
- **No gradients.**
- **No shadows** (very minimal box-shadow only if absolutely necessary).
- Contrast defines hierarchy.

---

## Typography

### Font
**Primary:** Inter (Google Fonts)

### Scale

| Type | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 24–28px | Bold (700) | Key financial numbers |
| Heading | 18–20px | SemiBold (600) | Section titles |
| Body | 14–16px | Regular (400) | Content text |
| Label | 12–13px | Medium (500) | Labels, captions |

### Rules
- Use `font-variant-numeric: tabular-nums` for all financial values
- Important numbers must always be bold
- Avoid excessive font sizes — let spacing create hierarchy

---

## Spacing System

### Base Unit: 4px

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 20px |
| `xxl` | 24px |

### Rules
- Use spacing instead of borders to separate sections
- Maintain consistent vertical rhythm
- Sections must breathe — generous whitespace between logical groups

---

## Layout

### Mobile-First Container
- Max width: **480px**, centered
- Full height scroll
- Structure: `Header → Content → Bottom Navigation`

### Card Layout
- Background: `white`
- Padding: `16px`
- Border radius: `12px`
- No heavy shadows

---

## Navigation

### Bottom Navigation (Fixed)
**Tabs:** Dashboard | Budget | Net Worth | Debt

- Icon + label per tab
- Active tab: bold text + darker icon
- Fixed at viewport bottom

### Navigation Rules
- No deep nesting — max **2 levels** deep
- Use push navigation for detail views

---

## Component System

### Card
- Props: `title`, `content`, optional `actions`
- Used everywhere for content grouping

### InlineEditableText
- For names, labels
- **Tap → input mode → blur/Enter → save → ESC → cancel**

### InlineEditableNumber
- For amounts
- Numeric-only input, positive values enforced

### ProgressBar
- Height: `6px`, rounded edges
- Grayscale fill only

### ListItemRow
- Used in: category items, asset list, debt list
- Consistent row height with inline actions

### Button Types
| Type | Style |
|------|-------|
| Primary | Filled black (`#000`) with white text |
| Secondary | Outlined black border |
| Ghost | Text only, no background/border |

### BottomSheet
- Used for monthly reports
- Slides from bottom, dismissible on swipe down

### Modal
- Used for delete confirmations
- Centered overlay with dimmed backdrop

---

## Interaction Patterns

### Inline Editing
- Tap → edit mode
- Enter or Blur → save
- ESC → cancel

### Feedback
- Slight background change on tap (`gray-100`)
- Opacity change on press (0.7)
- No heavy animations

### Delete Flow
1. Tap delete icon
2. Confirmation modal appears
3. Confirm → delete, Cancel → dismiss

---

## State Handling (UI)

| State | Treatment |
|-------|-----------|
| Loading | Skeleton loaders (no blank screens) |
| Empty | Simple text message, optional illustration |
| Error | Inline error message + retry button |

---

## Charts

### Line Chart
- Used for: net worth trends, category trends

### Pie Chart
- Used for: budget AlloCation, asset distribution

### Chart Rules
- **No colors** — use grayscale variations only
- Use different stroke styles (solid, dashed) for distinction
- Keep charts minimal and readable

---

## Accessibility
- Maintain readable contrast ratios (WCAG AA minimum)
- Minimum touch target size: **44px** height
- All interactive elements must be keyboard accessible

---

## Animation Guidelines

### Allowed
- Subtle scale transitions
- Opacity fade (150–200ms)
- Bottom sheet slide animation

### Avoid
- Heavy transitions
- Complex multi-step animations
- Decorative motion

---

## Form Philosophy
- **No full-page forms** — inline editing is always preferred
- Minimal input fields per interaction
- Immediate save on blur/enter

---

## Design Constraints (Hard Rules)
1. Strict adherence to the curated Aesthetic Canvas palette for themes. No unstructured Hex codes.
2. No gradients.
3. No heavy shadows.
4. No clutter — every element must earn its place.
5. Financial values always use tabular numerals.
6. Mobile-first, 480px max container.

---