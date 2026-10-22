// 03-DESIGN §9.1. Durations in seconds for Motion; CSS uses the --dur-* variables.
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const dur = { press: 0.12, hover: 0.18, enter: 0.24, modal: 0.32, reveal: 0.6 } as const;

export const spring = {
  snappy: { type: "spring", stiffness: 520, damping: 36, mass: 0.8 },
  modal: { type: "spring", stiffness: 380, damping: 34 },
  gentle: { type: "spring", stiffness: 170, damping: 26 },
  number: { type: "spring", stiffness: 90, damping: 20 },
} as const;
