# Landing Page — Lessons Learnt

Hard-won lessons from building the Guardian landing page. Refer to this before building new sections, animations, or pages.

---

## Visual Design

### Font sizes: never go below `text-xs` (12px)

Anything smaller than `text-xs` is unreadable on most screens. We repeatedly used `text-[8px]`, `text-[9px]`, `text-[10px]` for labels and pills, and every time it needed to be bumped up.

**Rule:** `text-xs` is the floor for any text a user should read. `text-[10px]` is acceptable ONLY for decorative metadata that doesn't need to be read (e.g. "live simulation" label on a terminal chrome).

### Opacity: minimum 0.5 for readable text, 0.7 for important text

We consistently made text too transparent — `/30`, `/40` opacity on colors against a dark background. It looks subtle in Figma-brain but is invisible on actual screens.

**Rule:**
- Decorative/ambient text: minimum `/50`
- Body text: minimum `/60`
- Labels and headings: minimum `/70`
- Never animate opacity below `0.3` unless the element is intentionally invisible

### Animations that live inside app-chrome containers vs. raw

Not everything needs a `rounded-xl border bg-[#0a0020]` terminal/app container. Use containers for:
- Code editors (stage 1 — needs the editor chrome to read as "code")
- Terminal outputs (threat feeds, audit logs)
- Agent loop displays (stage 3 — needs the agent identity header)

Do NOT use containers for:
- Abstract visual metaphors (stage 4 — the risk scale is a concept, not a UI)
- Architecture diagrams (they're diagrams, not apps)
- Anything where the container adds visual noise without adding meaning

### The hero animation must tell the whole story

The hero's right-side visual is the most important animation on the page. It should communicate the core product thesis at a glance. A terminal feed of events is interesting but doesn't explain what the product IS. An architecture diagram that transitions from "before" to "after" does.

---

## Layout

### Sticky animations need vertical offset

When using `sticky top-32` for animations alongside scrolling text, add `pt-16` (or similar) so the animation aligns with the heading/content start, not the top of the section. Without this, the animation floats too high relative to the text.

### Grid column ratios for text + animation

- **Two-column (text + animation):** `7 | 5` works well. `6 | 4` with a separate number column (`2 | 6 | 4`) creates alignment issues — the number column pushes everything right and the animation column is too narrow.
- **Inline numbers:** Put the stage number inline with the eyebrow (same row, `flex items-baseline gap-5`) rather than in a separate grid column. This is cleaner and avoids the 3-column alignment problem.

### `items-start` on grid containers

Always use `lg:items-start` on grid containers where columns have different content heights. Without it, shorter columns vertically center, which looks broken when one column is a sticky animation and the other is long-form text.

---

## Animations

### DOM growth: cap rolling lists

Any animation that appends items to a list (threat feed, audit log) MUST hard-cap the array length. Use `.slice(0, MAX_VISIBLE)` and a `useRef` for the index counter — NOT nested `setState` calls which cause batching issues.

**Pattern:**
```tsx
const idxRef = useRef(0);
useEffect(() => {
  function add() {
    const next = idxRef.current % ITEMS.length;
    idxRef.current += 1;
    setItems((prev) => [newItem, ...prev].slice(0, MAX));
  }
  add();
  const timer = setInterval(add, 2800);
  return () => clearInterval(timer);
}, []);
```

### Stage-cycling animations: use `useCallback` carefully

When using `setInterval` + `useCallback` for auto-cycling (before/after stages, scenario walkthroughs), the `useCallback` dependency on the current state causes the interval to reset on every state change. This is usually fine for 2-stage toggles but can cause timing drift with many stages.

### Intersection observer: fire once

Always disconnect the observer after first intersection for scroll-triggered animations. Otherwise the animation restarts every time the element scrolls in/out of view.

```tsx
const obs = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    setInView(true);
    obs.disconnect(); // ← critical
  }
}, { threshold: 0.3 });
```

---

## Architecture / Conceptual

### Guardian Agents IS the agent, not a sidecar

Guardian Agents is a hardened fork of FastAgent — it IS the agent runtime, not a separate service watching the agent. The agent container in the architecture diagram IS Guardian Agents. This distinction matters for every visual and every piece of copy. Don't draw them as separate boxes.

### Two products = two colors

- **Guardian Agents** (the runtime): purple `#7822FF`
- **Guardian Tool Calls** (the MCP server): cyan `#2DFFFF`

Every pill, badge, border, and label should use the correct product color. Don't mix them.

### The audience is CISOs, not just developers

The landing page and story page are for decision-makers. Avoid:
- Code-heavy sections without plain-English context
- Jargon without explanation (MCP, Zod, gRPC on first mention)
- Technical accuracy at the expense of clarity

The CISO Q&A cards pattern works well: "Can an agent do X?" → "No, because Y." Direct, concrete, non-technical.

---

## Tech Stack Reminders

- **Next.js 16** with Turbopack — `bun run build` for verification
- **Framer Motion v12** — use `staggerContainer` + `fadeInUp` from `@/lib/animations` for consistency
- **Tailwind v4** — brand tokens defined in `globals.css` as CSS custom properties, referenced via `brand-*` classes
- **No emojis in production copy** — emojis are acceptable in animation data (knowledge source icons) but not in headings, body text, or CTAs
- All pages must share the same `Header` and `Footer` components
- Nav links from the story page need `/#` prefix to link back to homepage sections
