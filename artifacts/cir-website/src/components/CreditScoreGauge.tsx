import { useEffect, useState } from "react";

export function CreditScoreGauge() {
  const [score, setScore] = useState(300);
  const targetScore = 782;

  useEffect(() => {
    const duration = 2200;
    const start = Date.now();
    const startScore = 300;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(startScore + (targetScore - startScore) * eased));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  const min = 300, max = 900;
  const pct = (score - min) / (max - min);

  // Arc spans from -210° to 30° (240° total), centred at top
  const START_DEG = -210;
  const END_DEG   =  30;
  const SPAN      = END_DEG - START_DEG; // 240

  const r  = 78;
  const cx = 110, cy = 115;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const pt = (deg: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(deg)),
    y: cy + radius * Math.sin(toRad(deg)),
  });

  const arcPath = (a: number, b: number, radius: number) => {
    const s = pt(a, radius);
    const e = pt(b, radius);
    const large = b - a > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Current needle angle
  const needleAngle = START_DEG + pct * SPAN;

  // Needle: starts a bit past center (so it never sits on the score text)
  // tip is on the arc track, tail is a small stub on the opposite side
  const TIP_R  = r - 6;
  const TAIL_R = 14;
  const tip  = pt(needleAngle, TIP_R);
  const tail = pt(needleAngle + 180, TAIL_R);

  const getColor = (s: number) => {
    if (s < 550) return "#ef4444";
    if (s < 650) return "#f97316";
    if (s < 750) return "#eab308";
    return "#22c55e";
  };

  const getLabel = (s: number) => {
    if (s < 550) return "Poor";
    if (s < 650) return "Fair";
    if (s < 750) return "Good";
    return "Excellent";
  };

  const color = getColor(score);

  // Segment boundaries
  const seg = (frac: number) => START_DEG + frac * SPAN;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="220" height="145" viewBox="0 0 220 145">
        {/* Background track */}
        <path d={arcPath(START_DEG, END_DEG, r)} fill="none" stroke="#e2e8f0" strokeWidth="15" strokeLinecap="round" />

        {/* Coloured zone segments (faint) */}
        <path d={arcPath(seg(0),    seg(0.25), r)} fill="none" stroke="#ef4444" strokeWidth="15" strokeLinecap="round" opacity="0.25" />
        <path d={arcPath(seg(0.25), seg(0.50), r)} fill="none" stroke="#f97316" strokeWidth="15" strokeLinecap="round" opacity="0.25" />
        <path d={arcPath(seg(0.50), seg(0.75), r)} fill="none" stroke="#eab308" strokeWidth="15" strokeLinecap="round" opacity="0.25" />
        <path d={arcPath(seg(0.75), seg(1),    r)} fill="none" stroke="#22c55e" strokeWidth="15" strokeLinecap="round" opacity="0.25" />

        {/* Progress arc */}
        <path d={arcPath(START_DEG, needleAngle, r)} fill="none" stroke={color} strokeWidth="15" strokeLinecap="round" />

        {/* Glow dot at tip */}
        <circle cx={tip.x} cy={tip.y} r="6" fill={color} opacity="0.35" />
        <circle cx={tip.x} cy={tip.y} r="3.5" fill={color} />

        {/* Needle line — tip to tail, does NOT pass through score area */}
        <line
          x1={tail.x} y1={tail.y}
          x2={tip.x}  y2={tip.y}
          stroke="#334155" strokeWidth="2.5" strokeLinecap="round"
        />

        {/* Pivot hub */}
        <circle cx={cx} cy={cy} r="7"  fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="4"  fill="#334155" />

        {/* Score — above pivot, clear of needle sweep */}
        <text
          x={cx} y={cy - 22}
          textAnchor="middle"
          fontSize="28"
          fontWeight="800"
          fill="#1e293b"
          fontFamily="system-ui, sans-serif"
        >
          {score}
        </text>
        <text
          x={cx} y={cy - 8}
          textAnchor="middle"
          fontSize="8.5"
          fill="#94a3b8"
          letterSpacing="1"
          fontFamily="system-ui, sans-serif"
        >
          CREDIT SCORE
        </text>

        {/* Range labels */}
        <text x="22"  y="138" textAnchor="middle" fontSize="8" fill="#94a3b8">300</text>
        <text x="198" y="138" textAnchor="middle" fontSize="8" fill="#94a3b8">900</text>
      </svg>

      {/* Status badge below gauge */}
      <span
        className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-sm font-semibold"
        style={{ background: `${color}18`, color }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
        {getLabel(score)}
      </span>
      <span className="text-xs text-muted-foreground">After CIR Assistance</span>
    </div>
  );
}
