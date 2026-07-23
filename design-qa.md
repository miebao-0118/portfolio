# Caimiao Scroll Journey Design QA

- Source visual truth:
  - `/Users/admin/Downloads/ChatGPT Image 2026年7月22日 16_00_38.png`
  - `/var/folders/z9/y2zz08md79x1hwv060054t600000gn/T/codex-clipboard-dfbf0da8-be57-4b29-9460-a72a78dc5634.png`
  - `/var/folders/z9/y2zz08md79x1hwv060054t600000gn/T/codex-clipboard-21c9c785-3af1-4b67-8ebd-77f258671115.png`
  - `/Users/admin/Downloads/ChatGPT Image 2026年7月23日 09_50_30.png`
  - `/Users/admin/Downloads/ChatGPT Image 2026年7月23日 09_50_37.png`
  - `/var/folders/z9/y2zz08md79x1hwv060054t600000gn/T/codex-clipboard-129ffdd4-9568-4957-8f55-a8e09abb16af.png`
  - `/var/folders/z9/y2zz08md79x1hwv060054t600000gn/T/codex-clipboard-6873bf62-928d-4ce7-b743-e7d1c03ee5ee.png`
  - `https://unitedcarriers.com/`, centered-subject ocean sequence around scroll position 23000 in the captured viewport
- Implementation URL: `http://127.0.0.1:4173/index-v2.html`
- Latest regression viewport: 2048 × 1030 CSS px, matching the supplied bug screenshots.
- Latest browser capture pixels: 2048 × 1030 per screenshot.
- Density normalization: the latest before/after comparisons were normalized to 1024 × 515 per side; the earlier ocean reference capture was center-cropped and normalized to 1280 × 720.
- State: Activity exit, sky hero, river-to-ocean handoff, centered ocean flight, foreground-cloud exit, and white next-section transition.

## Full-view comparison evidence

- Sky source and implementation: `/Users/admin/Desktop/Portfolio/qa-compare-sky.png`
- United Carriers motion reference and ocean implementation: `/Users/admin/Desktop/Portfolio/qa-compare-ocean.png`
- Cloud seam before/after: `/Users/admin/Desktop/Portfolio/qa-compare-cloud-fix.png`
- Sky edge and character cleanup before/after: `/Users/admin/Desktop/Portfolio/qa-compare-sky-fix.png`
- River-to-ocean implementation: `/Users/admin/Desktop/Portfolio/qa-caimiao-river-ocean.png`
- Foreground-cloud exit implementation: `/Users/admin/Desktop/Portfolio/qa-caimiao-exit.png`
- Latest Activity, entry, and river-to-ocean before/after sheet: `/Users/admin/Desktop/Portfolio/qa-comparison.png`
- Latest flying side-cloud state: `/Users/admin/Desktop/Portfolio/qa-flight-clouds-after.png`

The final implementation retains the intended bright sky palette, keeps the main subject visually centered while the environment moves, uses a curved ocean entry, preserves the full moving ocean texture, and lets foreground clouds carry the scene into white.

## Focused region comparison evidence

- Brand and hero layering: `/Users/admin/Desktop/Portfolio/qa-caimiao-sky.png`
- Ocean cloud translucency and fixed flyer: `/Users/admin/Desktop/Portfolio/qa-caimiao-ocean.png`

Focused evidence was required because the logo extraction, airflow alpha, cloud alpha, ocean boundary, and fixed-subject behavior are not readable at full-page scale.

## Required fidelity surfaces

- Fonts and typography: Existing portfolio navigation and display typography remain unchanged. Placeholder case copy retains stable hierarchy and does not collide with the centered path.
- Spacing and layout rhythm: The logo, character, river, boat, flyer, and two copy columns remain separated at the checked desktop viewport. The river and ocean share one visual centerline.
- Colors and visual tokens: Activity orange continues into the transition stage, expands through white, reveals the supplied blue sky, blends to pale yellow, then moves into the supplied blue ocean and back to white.
- Image quality and asset fidelity: Supplied imagery is used directly. Airflow and clouds were re-keyed with soft alpha instead of opaque color blocks. The supplied logo is extracted to a transparent asset and presented through an SVG container.
- Copy and content: User-requested placeholder copy remains placeholder copy; no unrequested content was introduced.
- Accessibility and motion: Decorative images are hidden from assistive technology, the brand object has an accessible label, and the journey has a reduced-motion static fallback.

## Comparison history

### Iteration 1

- [P2] The first extracted logo was invisible when an SVG image loaded an external raster subresource.
- [P2] The first flight-cloud treatment produced a large rectangular-looking mass, and scaling the ocean viewport revealed a pale-yellow frame during the high-altitude phase.
- Fixes: moved the logo to an SVG object backed by a transparent extracted source, replaced the flight layer with the higher-detail wispy cloud asset, reduced cloud opacity, kept the ocean viewport full-frame, and applied the zoom-out to the ocean texture and flyer instead.

### Iteration 2

- Post-fix evidence: `/Users/admin/Desktop/Portfolio/qa-caimiao-sky.png`, `/Users/admin/Desktop/Portfolio/qa-caimiao-ocean.png`, and `/Users/admin/Desktop/Portfolio/qa-caimiao-exit.png`.
- Result: the logo renders without a box, airflow remains thin and translucent, clouds retain irregular soft edges, the ocean stays edge-to-edge, and the white exit has no visible section seam.

### Iteration 3

- [P1] The foreground cloud image ended on a hard horizontal edge and exposed the sky scene below it.
- [P1] The sky image inherited the global image maximum width, leaving an isolated cyan strip at the right edge on a 2048 px viewport.
- [P1] Activity ended as a hard-cut dark/orange panel and the first Caimiao state held a visually empty white frame for too long.
- [P2] The first character cutout retained uneven dark surface blotches, and the sky smoke layer did not match the top hero's fluid field language.
- Fixes: combined the cloud bank and its continuation into one moving transition layer; sampled the cloud base color into an overlapping blurred solid-color tail that resolves into pale yellow; allowed the overscanned sky image to exceed the global image width; tightened the Activity-to-sky timing and replaced the flat hold with an orange-to-white radial mist reveal; cleaned the supplied character while preserving silhouette and pose; and added a second lightweight instance of the top hero's WebGL fluid/halftone field behind the character.
- Post-fix evidence: `/Users/admin/Desktop/Portfolio/qa-activity-boundary.png`, `/Users/admin/Desktop/Portfolio/qa-activity-transition.png`, `/Users/admin/Desktop/Portfolio/qa-cloud-transition.png`, and `/Users/admin/Desktop/Portfolio/qa-caimiao-sky.png`.
- Result: no cloud/sky seam, no isolated right strip, no blank-screen pause between Activity and the sky, clean character materials, and consistent fluid motion language.

### Iteration 4

- [P1] The fixed global gradual-blur component remained active over Activity and created a 12 rem blurred obstruction across the waterfall.
- [P1] The Caimiao entry still began with a full-viewport orange hold, which read as an empty screen between Activity and the sky.
- [P1] River, boat, ocean, and flyer shared an overlapping handoff interval; the river layer also sat above the ocean layer.
- [P2] The river used a hard `clip-path` reveal, producing a visible horizontal edge.
- [P2] The flying-cloud element referenced a wide exit-cloud asset instead of the supplied vertical side-cloud composition.
- Fixes: disabled the global blur only while Activity is in view; replaced the full orange hold with a short top curtain over an already-visible sky; replaced the river clip reveal with a feathered alpha and vertical-opacity reveal; made the boat and river fully disappear before the curved ocean rise begins; delayed the flyer until the ocean is established; and rebuilt the supplied vertical cloud source into a transparent, textured side-cloud asset.
- Post-fix evidence: `/Users/admin/Desktop/Portfolio/qa-activity-after.png`, `/Users/admin/Desktop/Portfolio/qa-entry-after.png`, `/Users/admin/Desktop/Portfolio/qa-river-ocean-after.png`, `/Users/admin/Desktop/Portfolio/qa-flight-clouds-after.png`, and `/Users/admin/Desktop/Portfolio/qa-comparison.png`.
- Result: Activity has no blurred obstruction, the empty orange screen is gone, the river has no horizontal reveal edge, boat/river and ocean never appear together, and the moving flight clouds remain visible at both sides of the centered flyer.

## Functional and runtime checks

- JavaScript syntax check passed for the inline application script.
- All journey assets exist and returned nonzero dimensions.
- The latest browser health pass reported zero broken images, duplicate IDs, console warnings, or console errors.
- Browser check found no failed loaded journey assets; offscreen Activity images remain intentionally lazy.
- Scroll states exercised: entry bloom, sky parallax, cloud cover, river reveal, boat arrival, all three case beats, drone pull-up, flyer handoff, ocean flight, cloud cover, and white exit.
- The 2048 px regression viewport has no positive horizontal overflow; the sky asset overscans both edges.
- Core case links remain present and keyboard-reachable.
- No uncaught runtime failure was observed while exercising every scroll stage.
- Mobile rules retain the same layer order with smaller logo, character, path, and copy sizes; the supplied visual target is desktop, so no pixel-level mobile comparison was required.

## Findings

No actionable P0, P1, or P2 mismatches remain in the checked states.

## Follow-up polish

- P3: Replace placeholder case copy when final project text is available.

final result: passed
