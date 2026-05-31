import { useEffect, useState } from "react";

export function CreditScoreGauge() {
  const [score, setScore] = useState(300);
  const targetScore = 782;

  useEffect(() => {
    const duration = 2000;
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
  const angle = -140 + pct * 280;
  const r = 80;
  const cx = 100, cy = 100;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number, radius: number) => {
    const s = { x: cx + radius * Math.cos(toRad(startDeg)), y: cy + radius * Math.sin(toRad(startDeg)) };
    const e = { x: cx + radius * Math.cos(toRad(endDeg)), y: cy + radius * Math.sin(toRad(endDeg)) };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const needleX = cx + (r - 10) * Math.cos(toRad(angle));
  const needleY = cy + (r - 10) * Math.sin(toRad(angle));

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

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="200" height="130" viewBox="0 0 200 130">
        {/* Background arc */}
        <path d={arcPath(-140, 140, r)} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
        {/* Colored arc segments */}
        <path d={arcPath(-140, -84, r)} fill="none" stroke="#ef4444" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(-84, -28, r)} fill="none" stroke="#f97316" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(-28, 28, r)} fill="none" stroke="#eab308" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(28, 140, r)} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        {/* Progress arc */}
        <path d={arcPath(-140, angle, r)} fill="none" stroke={getColor(score)} strokeWidth="14" strokeLinecap="round" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#2C3E50" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#2C3E50" />
        {/* Score text */}
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="22" fontWeight="700" fill="#2C3E50">{score}</text>
        <text x={cx} y={cy + 38} textAnchor="middle" fontSize="9" fill="#64748b">CREDIT SCORE</text>
        {/* Labels */}
        <text x="28" y="120" textAnchor="middle" fontSize="8" fill="#94a3b8">300</text>
        <text x="172" y="120" textAnchor="middle" fontSize="8" fill="#94a3b8">900</text>
      </svg>
      <span className="text-sm font-semibold" style={{ color: getColor(score) }}>{getLabel(score)}</span>
      <span className="text-xs text-muted-foreground">After CIR Assistance</span>
    </div>
  );
}
