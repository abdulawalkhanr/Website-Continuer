import { useEffect, useState } from "react";

const MIN_SCORE = 300;
const MAX_SCORE = 900;
const EXAMPLE_SCORE = 700;

const START_DEG = 180;
const END_DEG = 360;
const SPAN_DEG = END_DEG - START_DEG;
const CENTER_X = 120;
const CENTER_Y = 112;
const RADIUS = 82;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function pointAt(degrees: number, radius = RADIUS) {
  return {
    x: CENTER_X + radius * Math.cos(toRadians(degrees)),
    y: CENTER_Y + radius * Math.sin(toRadians(degrees)),
  };
}

function scoreToAngle(score: number) {
  const normalized = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
  return START_DEG + normalized * SPAN_DEG;
}

function arcPath(startScore: number, endScore: number) {
  const start = pointAt(scoreToAngle(startScore));
  const end = pointAt(scoreToAngle(endScore));
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

export function CreditScoreGauge() {
  const [score, setScore] = useState(MIN_SCORE);
  const marker = pointAt(scoreToAngle(score));

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setScore(EXAMPLE_SCORE);
      return;
    }

    const duration = 2200;
    const startTime = performance.now();
    let animationFrame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(MIN_SCORE + (EXAMPLE_SCORE - MIN_SCORE) * eased));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const range =
    score < 550
      ? { label: "Needs attention", color: "#ef4444", background: "#fef2f2" }
      : score < 650
        ? { label: "Fair range", color: "#f97316", background: "#fff7ed" }
        : { label: "Good range", color: "#ca8a04", background: "#fefce8" };

  return (
    <div
      className="flex w-full flex-col items-center"
      data-testid="illustration-credit-score"
      aria-label="Illustrative credit score range from 300 to 900, showing an example score of 700"
    >
      <svg
        viewBox="0 0 240 150"
        className="h-auto w-full max-w-[260px]"
        role="img"
        aria-labelledby="credit-gauge-title credit-gauge-description"
      >
        <title id="credit-gauge-title">Credit score range illustration</title>
        <desc id="credit-gauge-description">
          An example score of 700 positioned in the good range. This is not a bureau result.
        </desc>

        <path d={arcPath(300, 549)} fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" />
        <path d={arcPath(551, 649)} fill="none" stroke="#f97316" strokeWidth="16" strokeLinecap="butt" />
        <path d={arcPath(651, 749)} fill="none" stroke="#eab308" strokeWidth="16" strokeLinecap="butt" />
        <path d={arcPath(751, 900)} fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" />

        <circle cx={marker.x} cy={marker.y} r="9" fill="white" stroke="#1e293b" strokeWidth="3" />
        <circle cx={marker.x} cy={marker.y} r="3.5" fill="#1e293b" />

        <text x={CENTER_X} y="78" textAnchor="middle" fontSize="32" fontWeight="800" fill="#1e293b">
          {score}
        </text>
        <text x={CENTER_X} y="96" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b" letterSpacing="1.2">
          EXAMPLE SCORE
        </text>

        <text x="25" y="132" textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8">300</text>
        <text x="215" y="132" textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8">900</text>
      </svg>

      <div
        className="-mt-2 flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-300"
        style={{ color: range.color, backgroundColor: range.background }}
        aria-live="polite"
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: range.color }} aria-hidden="true" />
        {range.label}
      </div>
      <p className="mt-2 max-w-[280px] text-center text-xs leading-relaxed text-muted-foreground">
        Illustrative range example only — not an official bureau score or result.
      </p>
    </div>
  );
}