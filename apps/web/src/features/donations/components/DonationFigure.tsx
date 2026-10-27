import React from "react";

export function DonationFigure({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none transition-all duration-500 select-none ${className}`}
    >
      <svg viewBox="0 0 540 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
        <style>{`
          @keyframes pulse-azure {
            0%, 100% { filter: drop-shadow(0 0 4px var(--azure-text)); }
            50% { filter: drop-shadow(0 0 12px var(--azure)); }
          }
          .node-azure-active {
            animation: pulse-azure 2.8s ease-in-out infinite;
          }
        `}</style>
        <defs>
          {/* Cyan/Azure Glow Filter */}
          <filter id="azure-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="var(--azure-text)" floodOpacity="0.8" />
          </filter>
          <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="var(--canvas)" floodOpacity="0.5" />
          </filter>

          {/* Surface & Cylinder Gradients using design tokens */}
          <linearGradient
            id="board-surface"
            x1="100"
            y1="50"
            x2="420"
            y2="300"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--surface)" />
            <stop offset="100%" stopColor="var(--canvas)" />
          </linearGradient>
          <linearGradient id="board-rim" x1="30" y1="160" x2="400" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--surface-elevated)" />
            <stop offset="100%" stopColor="var(--canvas)" />
          </linearGradient>
          <linearGradient id="cyl-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--surface-elevated)" />
            <stop offset="100%" stopColor="var(--surface)" />
          </linearGradient>
          <linearGradient id="cyl-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--hairline)" />
            <stop offset="100%" stopColor="var(--surface-elevated)" />
          </linearGradient>
          <linearGradient id="azure-cyl-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--azure)" />
            <stop offset="100%" stopColor="var(--azure-text)" />
          </linearGradient>
          <linearGradient id="azure-cyl-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--azure-text)" />
            <stop offset="100%" stopColor="var(--azure)" />
          </linearGradient>
        </defs>

        {/* 1. BASE ISOMETRIC BOARD SLAB */}
        <g className="board-slab">
          {/* 3D Extrusion Rim Depth (14px) */}
          <path
            d="M 40 162 L 40 176 Q 40 192 60 202 L 345 330 Q 365 338 385 328 L 515 250 Q 530 240 530 226 L 530 212 L 515 226 Q 500 236 385 314 L 60 188 Q 40 178 40 162 Z"
            fill="url(#board-rim)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          {/* Top Surface Face with Rounded Corners */}
          <path
            d="M 60 188 Q 38 176 42 158 L 180 54 Q 198 42 218 52 L 512 210 Q 532 220 522 236 L 385 314 Q 365 324 345 314 Z"
            fill="url(#board-surface)"
            stroke="var(--hairline)"
            strokeWidth="1.4"
          />
        </g>

        {/* 2. HAIRLINE CIRCUIT TRACES */}
        <g className="hairline-traces" stroke="var(--hairline-grid)" strokeWidth="1.2" fill="none">
          {/* Top Parallel Bus Traces */}
          <path d="M 174 67 L 484 233" />
          <path d="M 168 72 L 478 238" />

          {/* Branch Traces from Knob 2 curving down */}
          <path d="M 228 97 Q 190 125 178 152" />
          <path d="M 222 102 Q 184 130 172 157" />

          {/* Branch Traces from Knob 3 curving down */}
          <path d="M 270 118 Q 225 148 218 180" />

          {/* Interconnect Traces connecting lower cluster & Azure Node */}
          <path d="M 178 196 Q 190 225 218 225 Q 248 225 268 240 Q 300 262 335 270 L 415 242 Q 445 232 462 232" />
          <path d="M 218 180 Q 242 186 268 210 Q 290 230 335 250" />
        </g>

        {/* 3. TOP ROW OF 8 HARDWARE KNOBS */}
        {/* Knob 0 (Top-Left) */}
        <g className="knob-0">
          <ellipse
            cx="185"
            cy="68"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 171 55 L 171 68 A 14 7 0 0 0 199 68 L 199 55 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="185"
            cy="55"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 176 53 A 14 7 0 0 1 194 53" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* Knob 1 */}
        <g className="knob-1">
          <ellipse
            cx="227"
            cy="89"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 213 76 L 213 89 A 14 7 0 0 0 241 89 L 241 76 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="227"
            cy="76"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 218 74 A 14 7 0 0 1 236 74" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* Knob 2 */}
        <g className="knob-2">
          <ellipse
            cx="270"
            cy="110"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 256 97 L 256 110 A 14 7 0 0 0 284 110 L 284 97 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="270"
            cy="97"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 261 95 A 14 7 0 0 1 279 95" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* Knob 3 */}
        <g className="knob-3">
          <ellipse
            cx="312"
            cy="131"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 298 118 L 298 131 A 14 7 0 0 0 326 131 L 326 118 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="312"
            cy="118"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 303 116 A 14 7 0 0 1 321 116" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* Knob 4 */}
        <g className="knob-4">
          <ellipse
            cx="355"
            cy="153"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 341 140 L 341 153 A 14 7 0 0 0 369 153 L 369 140 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="355"
            cy="140"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 346 138 A 14 7 0 0 1 364 138" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* Knob 5 */}
        <g className="knob-5">
          <ellipse
            cx="397"
            cy="174"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 383 161 L 383 174 A 14 7 0 0 0 411 174 L 411 161 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="397"
            cy="161"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 388 159 A 14 7 0 0 1 406 159" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* Knob 6 */}
        <g className="knob-6">
          <ellipse
            cx="440"
            cy="195"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 426 182 L 426 195 A 14 7 0 0 0 454 195 L 454 182 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="440"
            cy="182"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 431 180 A 14 7 0 0 1 449 180" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* Knob 7 (Bottom-Right) */}
        <g className="knob-7">
          <ellipse
            cx="482"
            cy="216"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 468 203 L 468 216 A 14 7 0 0 0 496 216 L 496 203 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="482"
            cy="203"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
          <path d="M 473 201 A 14 7 0 0 1 491 201" stroke="var(--text-muted)" strokeWidth="0.8" fill="none" />
        </g>

        {/* 4. LOWER CLUSTER: FLOATING ELEVATED NODES WITH FOOTPRINTS */}
        {/* Node L1: Left Upper */}
        <g className="node-l1">
          <ellipse
            cx="172"
            cy="162"
            rx="17"
            ry="8.5"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            strokeDasharray="2,2"
            fill="var(--canvas)"
          />
          <line
            x1="158"
            y1="144"
            x2="158"
            y2="162"
            stroke="var(--hairline-grid)"
            strokeWidth="0.9"
            strokeDasharray="2,2"
          />
          <line
            x1="186"
            y1="144"
            x2="186"
            y2="162"
            stroke="var(--hairline-grid)"
            strokeWidth="0.9"
            strokeDasharray="2,2"
          />
          <path
            d="M 158 132 L 158 144 A 14 7 0 0 0 186 144 L 186 132 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
            filter="url(#node-shadow)"
          />
          <ellipse
            cx="172"
            cy="132"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
        </g>

        {/* Node L2: Left Lower */}
        <g className="node-l2">
          <ellipse
            cx="172"
            cy="206"
            rx="17"
            ry="8.5"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            strokeDasharray="2,2"
            fill="var(--canvas)"
          />
          <line
            x1="158"
            y1="188"
            x2="158"
            y2="206"
            stroke="var(--hairline-grid)"
            strokeWidth="0.9"
            strokeDasharray="2,2"
          />
          <line
            x1="186"
            y1="188"
            x2="186"
            y2="206"
            stroke="var(--hairline-grid)"
            strokeWidth="0.9"
            strokeDasharray="2,2"
          />
          <path
            d="M 158 176 L 158 188 A 14 7 0 0 0 186 188 L 186 176 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
            filter="url(#node-shadow)"
          />
          <ellipse
            cx="172"
            cy="176"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
        </g>

        {/* Node M1: Center-Left */}
        <g className="node-m1">
          <ellipse
            cx="218"
            cy="186"
            rx="17"
            ry="8.5"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            strokeDasharray="2,2"
            fill="var(--canvas)"
          />
          <line
            x1="204"
            y1="168"
            x2="204"
            y2="186"
            stroke="var(--hairline-grid)"
            strokeWidth="0.9"
            strokeDasharray="2,2"
          />
          <line
            x1="232"
            y1="168"
            x2="232"
            y2="186"
            stroke="var(--hairline-grid)"
            strokeWidth="0.9"
            strokeDasharray="2,2"
          />
          <path
            d="M 204 156 L 204 168 A 14 7 0 0 0 232 168 L 232 156 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
            filter="url(#node-shadow)"
          />
          <ellipse
            cx="218"
            cy="156"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
        </g>

        {/* NODE AZURE: THE ACTIVE HIGHLIGHTED NODE */}
        <g className="node-azure node-azure-active">
          <ellipse
            cx="268"
            cy="196"
            rx="18"
            ry="9"
            stroke="var(--azure-text)"
            strokeOpacity="0.5"
            strokeDasharray="3,2"
            strokeWidth="1.2"
            fill="var(--canvas)"
          />
          <line
            x1="268"
            y1="172"
            x2="268"
            y2="196"
            stroke="var(--azure-text)"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <line
            x1="254"
            y1="172"
            x2="254"
            y2="196"
            stroke="var(--azure-text)"
            strokeOpacity="0.8"
            strokeWidth="1.2"
            strokeDasharray="2.5,2"
          />
          <line
            x1="282"
            y1="172"
            x2="282"
            y2="196"
            stroke="var(--azure-text)"
            strokeOpacity="0.8"
            strokeWidth="1.2"
            strokeDasharray="2.5,2"
          />
          <path
            d="M 254 158 L 254 172 A 14 7 0 0 0 282 172 L 282 158 Z"
            fill="url(#azure-cyl-body)"
            stroke="var(--azure-text)"
            strokeWidth="1.5"
            filter="url(#azure-glow)"
          />
          <ellipse
            cx="268"
            cy="158"
            rx="14"
            ry="7"
            fill="url(#azure-cyl-top)"
            stroke="var(--azure)"
            strokeWidth="1.5"
          />
          <ellipse
            cx="268"
            cy="158"
            rx="8"
            ry="4"
            stroke="var(--azure-text)"
            strokeOpacity="0.6"
            strokeWidth="1"
            fill="none"
          />
        </g>

        {/* Node M2: Node below Azure */}
        <g className="node-m2">
          <ellipse
            cx="270"
            cy="242"
            rx="20"
            ry="10"
            stroke="var(--hairline-grid)"
            strokeWidth="1"
            fill="var(--canvas)"
          />
          <path
            d="M 256 229 L 256 242 A 14 7 0 0 0 284 242 L 284 229 Z"
            fill="url(#cyl-body)"
            stroke="var(--hairline)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="270"
            cy="229"
            rx="14"
            ry="7"
            fill="url(#cyl-top)"
            stroke="var(--hairline-grid)"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
}
