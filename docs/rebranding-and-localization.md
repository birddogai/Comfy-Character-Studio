# Agent guide: branding and languages

Read design-system.md before changing visuals. Treat the approved design as a semantic system, not a collection of color replacements. Current state: the design specification is complete, but the existing stylesheet still contains legacy literals; token migration is outstanding. Rebranding is not yet a single-setting operation.

## Rebranding checklist

1. Record the requested brand name, vector logo, typefaces and licenses, accent, surface colors and preferred density. Preserve product behavior and saved data.
2. Update the semantic token table in design-system.md. During implementation consolidate the existing CSS into shared tokens for canvas, surfaces, text, accent/on-accent, borders, danger, spacing, radii and motion. Avoid another late override layer. Never replace colors inside generated character images.
3. Update the brand in components/studio.tsx and metadata in app/layout.tsx. Supply an accessible name for the logo and preserve compact/mobile variants. Keep brand names outside translation catalogs unless the brand has localized names.
4. Apply shared controls consistently across all four pages, viewers and dialogs. Keep existing accessible roles and focus behavior.
5. Recalculate every foreground/background pair, including hover, focus, error and selected states. Target WCAG 2.2 AA; dark text is required on the approved orange fill. Do not claim compliance from palette checks alone.
6. Check 320, 390, 768, 1440 and 1920 CSS px, 200% text and 400% zoom, long translations, keyboard operation and reduced motion. Run npm test and npm run build. Describe unresolved limitations explicitly.

Do not change API model names, prompts, stored enum values, user-written names or generated text as part of visual branding.

## Localization contract

components/language.tsx owns locale state and the native language selector. lib/messages.ts owns translations; use useLanguage().t(...) in client components. The provider wraps the app in app/layout.tsx. Supported locales: en, es, zh-CN (Simplified Chinese). Native language names remain visible in the selector. Explicit preference persists in localStorage; unavailable storage must not break the app. Update html lang when switching. Initial server and client render use English to avoid hydration mismatch.

Current coverage is an initial migration: navigation and key Wardrobe/Storyboard controls. Untranslated strings fall back to English. Create/Characters forms, helper copy, dynamic statuses, validation messages, dialog copy and option catalogs still need extraction; this is not a fully localized application yet.

For each new string add both translations in lib/messages.ts. Keep whole sentences together; introduce named interpolation for variable sentences rather than translating fragments. Never translate dynamic user content by lookup. Keep stable model IDs, API enum values and prompt language independent of display labels. Localize option labels without changing submitted values. Pass locale to Intl.DateTimeFormat and Intl.NumberFormat when migrating dates/numbers. Chinese text must not inherit uppercase wordmark letter spacing. Add CJK-capable fallback fonts and allow labels to wrap.

Future additions: make locale IDs explicit and validated, add complete catalogs, native selector option, appropriate document language/direction, and tests. Chinese Traditional needs its own zh-TW catalog; do not silently alias it to Simplified Chinese. Do not use DOM text replacement or automatic mutation of rendered text for translation.

Validation: verify dictionary coverage, missing-key fallback, storage disabled, reload persistence, locale switching with filled forms, screen-reader language, and long Spanish/CJK labels. Native-speaker review is required before declaring translation quality complete.
