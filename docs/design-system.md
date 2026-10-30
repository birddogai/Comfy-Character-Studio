# Character Studio design system

Status: approved visual direction, implementation specification. The site has not yet been migrated or audited for conformance. This document governs future UI changes across Characters, Create, Wardrobe and Storyboard. It complements the workflow review; keep the short label **UGC**.

## 1. Brand

Deep blue-green navy, warm orange, warm-white text. Precise, creative and tactile. Small corner radii and generous grouping space; avoid pill-shaped everything, translucent text and decorative gradients across panels.

Use the orange AI monogram with gently rounded endpoints beside the condensed uppercase CHARACTER / STUDIO wordmark. Redraw the approved mark as a clean vector; do not crop the generated concept image into a production logo. Keep clear space equal to half the mark height. Desktop mark: 32px; compact mark: 28px. Wordmark: 24–28px, tracking .12em, single line where space permits; abbreviate visually on mobile while preserving the accessible name “AI Character Studio.” No accounts, avatars or profile menus.

Typography proposal: self-host licensed **Barlow Condensed SemiBold** for the wordmark, **Inter** for the interface; system sans-serif fallback. Verify font licenses and include them with assets. The generated wordmark is a visual direction, not proof of an exact font match. Avoid external font requests in production. Use font-display: swap and stable fallback metrics.

## 2. Atomic tokens

### Semantic colors

| Token | Value | Role |
| --- | --- | --- |
| canvas | #061820 | Page background |
| surface | #0C252F | Sidebar, cards, dialogs |
| surface-raised | #14333F | Hover surfaces and menus |
| text | #EDEDE5 | Primary copy |
| text-muted | #AABDC4 | Helper text, metadata, placeholders |
| accent | #FF8A3D | Selected tabs, primary actions, focus |
| on-accent | #061820 | Text/icons on orange or coral fills |
| accent-hover | #FFA15F | Primary hover |
| accent-depth | #A94B12 | Decorative 3D bottom edge only |
| border-control | #647F89 | Required input/interactive boundaries |
| border-subtle | #294751 | Decorative grouping only |
| danger | #FF655D | Destructive text, icons and filled actions |

State meanings always include text or an icon. Success uses a check and a clear message; it may use the orange brand accent. Warning uses a warning icon; errors use danger plus text. Do not introduce ambiguous red/green-only feedback.

Calculated sRGB contrast, solid colors, no opacity or compositing:

| Pair | Ratio |
| --- | --- |
| Primary text / canvas | 15.39:1 |
| Primary text / surface | 13.51:1 |
| Secondary text / surface | 8.16:1 |
| Secondary text / raised surface | 6.85:1 |
| Navy text / orange button | 7.72:1 |
| Orange / raised surface | 5.69:1 |
| Control border / raised surface | 3.14:1 |
| Danger / raised surface | 4.62:1 |

These meet the relevant 4.5:1 normal-text and 3:1 control-boundary thresholds for the listed pairs. Do not use white on orange. Decorative border-subtle is not sufficient as the sole indication of a control. Audit rendered states, SVGs, images behind text and gradients separately. Disabled controls are exempt from contrast requirements but should remain legible; use explicit colors instead of fading the whole component.

### Spacing and geometry

Use a 4px base: 4, 8, 12, 16, 24, 32, 48, 64px. No arbitrary new spacing values unless driven by optical alignment.

- Icon-to-label: 8px. Label-to-control: 8px. Control-to-helper: 4px.
- Related inputs: 16px. Distinct form groups: 24px. Major sections: 32px.
- Card padding: 16px; workspace padding: 24px desktop / 16px mobile.
- Border: 1px. Radius: 4px small elements, 6px controls/cards, 8px dialogs/workspaces. Use circles only for circular meaning, such as status badges.
- Controls: 44px minimum height. Compact visible icons may be 18–20px inside a 44px target. Dense controls may look smaller but retain non-overlapping targets.
- Textareas: at least 112px high; vertically resizable. Never fix text container heights that clip enlarged text.

### Type scale

| Use | Size / line height | Weight |
| --- | --- | --- |
| Page heading | 28 / 36px | 650–700 |
| Section heading | 22 / 30px | 600–700 |
| Card heading | 18 / 26px | 600 |
| Body, input, button | 16 / 24px | 400 / 600 actions |
| Label, secondary copy | 14 / 20px | 500 / 400 |
| Small metadata only | 12 / 18px | 400 |

Use rem values in implementation. Mobile page heading: 24/32px. Never shrink primary fields or essential instructions into metadata sizes. Keep long explanations to approximately 60–70 characters per line. Dates use locale formatting; timers use tabular numerals.

### Icons, elevation and motion

Consistent 20px outline icons, 1.75–2px strokes, rounded caps/joins. Decorative SVGs are aria-hidden. Icon-only controls have action-specific accessible names. Never rely on a tooltip as the only label.

Surfaces use borders before shadows. Menus/dialogs may use a restrained dark shadow. Layer scale: base 0, sticky controls 10, popovers 30, backdrop/dialog 50/60, toast 70. Toasts must not block dialog controls.

Transitions: 120ms controls, 180ms disclosure/popover, ease-out. No infinite decorative pulsing. With prefers-reduced-motion, remove transform animations and shimmer; keep static loading text. Avoid layout shifts during hover and generation.

## 3. Primitive controls and states

Every control defines default, hover, focus-visible, active, disabled, busy and error states where applicable.

**Primary button:** orange, navy semibold text, 6px radius. Generate alone gets a tactile 4px burnt-orange bottom shadow. Hover translates up 1px and slightly brightens; active translates down 2px and reduces depth to 1px. Reserve space so neither changes layout. Disabled/busy has no lift or glow. Keep button width stable when label changes. No automatic generation on focus or selection.

**Secondary button:** navy surface, readable outline and warm-white label. Tertiary action: underlined text or an unambiguous button treatment. Destructive action: danger text with icon, or coral fill with navy text in the confirmation dialog. Do not style every action as primary.

**Focus:** visible 2px orange outline with 3px offset, including around orange buttons with a navy separation gap. Never clip focus rings. Keyboard focus must not be hidden behind sticky bars.

**Inputs:** persistent label, optional helper, explicit required indication. Use border-control; error adds danger border, an error icon and a text explanation linked with aria-describedby. Preserve entered values on failure. Use aria-invalid only after relevant validation. Placeholders are examples, never labels.

**Choices:** retain native radio/checkbox semantics where practical. Radio sets permit one selection; use fieldset/legend and native arrow-key behavior. Selected shape tiles combine outline, check indicator and text. Multi-select uses checkboxes, not radio-shaped buttons. Story / UGC is a compact segmented choice, not page navigation.

**Disclosure:** native details/summary, chevron, concise summary of non-default selections. Entire summary is keyboard and touch operable. Avoid unnecessary nested disclosures. Optional controls may collapse; required errors must remain discoverable.

## 4. Composed components

### Attached page tabs

Top navigation: Characters, Create, Wardrobe, Storyboard. Active tab is solid orange with navy text, rounded upper corners and square lower corners, touching the workspace top border. Unselected tabs are quiet text with a clear hover surface. No floating pill navigation and no account controls.

The current app swaps panels in place: use tablist/tab/tabpanel with aria-selected, matching aria-controls/id, roving tabindex and Left/Right/Home/End keys. Use manual Enter/Space activation to avoid discarding state during arrow navigation. If these become separate routes, use links with aria-current instead of tab semantics. Preserve each screen's draft state on navigation.

### Reference card

Thumbnail, name, reference role and selected outfit. An optional swap action and explicit remove control. Contain images without cropping identifying features. Distinguish Character identity, Outfit, Location and Product/prop. Show Original outfit rather than Main sheet. Explain missing/deleted references and block dependent actions instead of silently substituting.

### Upload and clothing pieces

A click/touch file chooser is always available beside drag-and-drop. State accepted file types and actual size/count limits. Show preview, type, replace and remove actions. Announce rejected files individually and preserve valid files. Upload/Presets/Describe methods share persistent selected pieces; replacing them requires explicit confirmation.

### Action bar and progress

One prominent Generate action, with a short missing-input reason when disabled. Keep the bar inside the workspace grid; it must not overlay content. On small screens prefer natural flow; any sticky version must reserve its full height and respect safe-area insets and the software keyboard.

Show named stages such as Planning shots / Generating image / Saving. Compact progress region, elapsed time, no invented percentages or completion promises. Announce stage changes once with role=status; do not announce timer updates every second. Preserve visible previous results. Long errors wrap without pushing the primary action offscreen.

### Results and image viewer

Separate current result from saved history. Image plus concise metadata and contextual actions. Use object-fit: contain for sheets and boards; no clipped faces or frames. Labels distinguish Download, Edit, Use in storyboard and Generate variation. Variation/repeat communicate that they start a new generation.

The concept shows individual storyboard cards, but the current backend returns one composite image. Do not pretend each frame is an independently editable asset until frame extraction and persistence exist. Keep the composite preview and shot list usable in the initial migration.

Viewer: accessible modal, labelled title, close control, Fit/100% when supported, keyboard navigation and focus return. Image detail and metadata have sensible bounds; controls stay reachable. No actions available only on hover.

### Custom confirmation dialog

Replace window.confirm with a shared confirmation component. A deletion confirmation is a modal dialog, **not a transient toast**. Name the item, explain whether deletion is permanent, provide Cancel and Delete. Initial focus is Cancel; trap focus; Escape cancels; restore focus to the trigger or next logical item after deletion. Background is inert. During deletion prevent duplicate submission; show failures inside the dialog and keep it open. Await completion before announcing success.

### Toasts

Nonblocking confirmations such as Outfit saved, Download started or Storyboard deleted. Include icon, concise message and a 44px dismiss target. Use polite status announcements for success; errors should also appear by the affected action. Never auto-dismiss a critical error or a required decision. Routine success toasts may dismiss after 6 seconds, pause on hover/focus, and must not contain the sole route to essential information or an expiring essential action. Stack at most three; aggregate repeated events. Desktop: top-right below navigation; mobile: inset 16px without covering the current task.

## 5. Layout and responsiveness

Use content-driven minmax grids with min-width: 0, not fixed-width desktop canvases. App shell uses the full viewport width, without a desktop maximum; outer gutters 16px compact / 24px regular / 32px wide.

| Range | Layout |
| --- | --- |
| Under 768px | Single column; compact brand; navigation on its own row; normal page scroll; 16px padding |
| 768–1199px | Two columns only if a 300px sidebar and useful preview fit; otherwise stack; 16–24px gaps |
| 1200px and above | 320–360px sidebar plus minmax(0,1fr) output; 24px padding; optional independent bounded scrolling |

Tabs remain at least 44px tall; allow horizontal tab scrolling without page overflow if needed, keep active tab visible. Never compress labels below readable size. Galleries use auto-fit/minmax with a one-column fallback at 320px. Forms collapse two-column pairs before labels or controls crowd. Dialog max-width 440px for confirmation; fit within viewport minus 32px and scroll vertically when needed.

At short viewport heights, enlarged text and zoom, release fixed workspace heights. Text and controls must reflow at 320 CSS px; intrinsically two-dimensional images can pan within their viewer. Test portrait/landscape, keyboard open, long names, 200% text size and 400% browser zoom. At large screens increase useful preview space, not text line lengths or enormous blank status panels.

## 6. Accessibility acceptance: WCAG 2.2 AA target

- Normal text >=4.5:1, large text >=3:1, required control/state boundaries >=3:1. Verify every enabled state in actual computed colors.
- Keyboard-operable navigation, forms, galleries, menus and dialogs; logical focus order and no keyboard trap outside intentional modal focus containment.
- Accessible names, roles and states; labels associated with controls; grouped fields and descriptive error relationships.
- Visible focus, not obscured; skip link to main content; one meaningful page heading and logical heading levels.
- Selection and errors are not color-only. Provide useful image alternatives; avoid repeating decorative thumbnail descriptions.
- Project target is 44x44px interactive areas, exceeding the WCAG AA minimum target-size criterion in normal controls.
- Respect reduced motion, browser zoom, text spacing overrides and forced-colors mode. Preserve native outlines/borders in forced colors.
- Verify with automated axe checks plus keyboard, screen reader and touch testing. Contrast calculations and a generated concept do not establish site compliance.

## 7. Implementation mapping and rollout

1. Add shared semantic CSS tokens and self-hosted font assets; replace existing purple literals and conflicting global overrides systematically, not by appending another theme layer indefinitely.
2. Implement BrandMark and attached navigation in components/studio.tsx; typography and responsive shell in app/globals.css.
3. Consolidate button/input/reference/disclosure patterns; apply to all four pages, not just Storyboard.
4. Add shared ConfirmDialog and ToastProvider; migrate all window.confirm/alert callers, including preset replacement and bulk actions. Preserve existing storage and deletion semantics.
5. Update model settings, pending state, image viewer and gallery controls consistently. Keep current generation payloads unchanged during visual migration.
6. Verify each viewport/state, contrast and keyboard behavior. Add interaction tests for dialog cancellation/focus return and navigation, plus existing tests/typecheck/build. Visual review uses representative local fixtures; paid generation requires separate permission.

Component stories/fixtures must cover default, populated, empty, validation error, server failure, busy, disabled, focus and long-content states. Record tested browsers, viewport sizes, unresolved issues and date before claiming accessibility conformance.

Approved visual reference: generated_images/exec-ce604703-a813-4036-a979-072bb720501e.png in the workspace. This reference is illustrative; the semantic and behavioral requirements above govern production implementation.
