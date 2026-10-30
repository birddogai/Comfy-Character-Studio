# UI validation checkpoint

Run the app with `npm run dev`. Install optional validation tools outside the checkout:

```sh
npm install --prefix /tmp/studio-browser playwright @axe-core/playwright
NODE_PATH=/tmp/studio-browser/node_modules node scripts/ui-check.cjs
```

The script uses `/usr/bin/chromium`; override with CHROMIUM_PATH. It creates a fresh isolated browser context, seeds temporary IndexedDB fixtures and intercepts every /api request. It never performs a real generation or touches the user's browser library. Screenshots are written under /tmp/populated-*.png.

Verified in Chromium:

- Populated Characters, Create, Wardrobe and Storyboard at 320, 390, 768, 1440 and 1920 CSS px: no horizontal page overflow.
- Mobile Storyboard and desktop Wardrobe screenshots reviewed. Mobile Generate bar now follows the document flow instead of covering controls.
- axe WCAG 2 A/AA, 2.1 AA and 2.2 AA scans: zero reported violations on all four populated workspace fixtures and the confirmation dialog.
- Dialog initial Cancel focus, Escape cancellation, error persistence and successful retry passed.
- Reduced-motion emulation and 320px reflow with enlarged root text passed. This is not a substitute for actual 400% browser-zoom testing.
- Existing tests, TypeScript and production build passed before the functional checkpoint.

Limits: these results are scoped to synthetic fixtures in Chromium, not a conformance certification. Manual screen-reader testing, cross-browser checks, every expanded advanced-control state, real device/software-keyboard testing and actual 400% zoom remain recommended release checks. Real character identity accuracy still requires authorized paid generation comparisons. The planner remains text-based for character identity; only its product reference is visual.
