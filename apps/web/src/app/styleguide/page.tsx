import { Styleguide } from "./styleguide";

// Dev-only review surface for the design system (07 Phase 1). The web build script deletes
// out/styleguide after export, so production never serves it. (A `.dev.tsx` pageExtension hangs
// `next dev` compilation, so that route was rejected.)
export default function StyleguidePage() {
  return <Styleguide />;
}
