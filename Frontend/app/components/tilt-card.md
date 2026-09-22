# TiltCard integration

`TiltCard` wraps existing children and leaves their props, links, buttons, and handlers on the original card. The home page wraps each job `<article>` inside the `job-grid` map:

```tsx
<TiltCard enableTilt={tiltEnabled} maxTilt={12} glare={false} className="h-full">
  <article className="job-card h-full">…existing job card content…</article>
</TiltCard>
```

The wrapper reads its bounds once on mouse enter, maps cursor position to ±`maxTilt` degrees, and writes only transforms in `requestAnimationFrame`. It eases back to zero on mouse leave. Touch and reduced-motion devices stay flat. `glare` adds an optional moving shine; leave it off in dense lists for lower paint cost.

## Local check and gradual rollout

1. Run the backend migration (`alembic upgrade head`) and start both apps as described in their READMEs.
2. Open the home page on a desktop browser. Move across a job card, use its links and bookmark, and switch between grid and list. Verify the card returns flat on exit.
3. Set `TILT_CARDS_ENABLED=false` in the frontend server environment and restart the frontend process. Refresh the page; cards should stop tilting. Restore the variable to enable it again. This runtime endpoint provides a quick server-side kill switch without reverting code. Your hosting platform may restart its process when an environment variable changes.
4. For a staged rollout, pass `enableTilt={flagForCurrentUser}` from an existing feature flag service instead of the page-wide flag. The component needs no other changes.
5. Check a touch device and a desktop browser with reduced motion enabled. Both should remain flat.

## Framer Motion alternative

The dependency is already present in this app. Here is a compact alternative wrapper:

```tsx
"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";

export function MotionTiltCard({ children, enableTilt = true, maxTilt = 12 }: {
  children: ReactNode; enableTilt?: boolean; maxTilt?: number;
}) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 180, damping: 22 });
  const rotateY = useSpring(rawY, { stiffness: 180, damping: 22 });
  return <div className="[perspective:1000px]" onMouseMove={event => {
    if (!enableTilt || !matchMedia("(hover:hover) and (pointer:fine)").matches ||
        matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set((0.5 - (event.clientY - rect.top) / rect.height) * 2 * maxTilt);
    rawY.set(((event.clientX - rect.left) / rect.width - 0.5) * 2 * maxTilt);
  }} onMouseLeave={() => { rawX.set(0); rawY.set(0); }}>
    <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>{children}</motion.div>
  </div>;
}
```

Framer Motion offers spring tuning and declarative animation. The shipped version avoids additional runtime work and keeps layout reads out of the move handler.
