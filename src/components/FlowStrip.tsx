import { Fragment, type CSSProperties } from "react";

type StepKey = "name" | "camera" | "upload" | "link";

const STEPS: ReadonlyArray<{ key: StepKey; label: string }> = [
  { key: "name", label: "이름·번호" },
  { key: "camera", label: "촬영" },
  { key: "upload", label: "올리기" },
  { key: "link", label: "링크 받기" },
];

const iconWrapStyle: CSSProperties = { color: "var(--accent)" };
const labelStyle: CSSProperties = { color: "var(--text)", letterSpacing: "-0.01em" };
const arrowStyle: CSSProperties = { color: "var(--accent)", opacity: 0.55 };

function Icon({ name }: { name: StepKey }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-full h-full block",
  };

  if (name === "name") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.1" />
        <path d="M3.4 19c0-3.1 2.5-5.4 5.6-5.4" />
        <rect x="13.3" y="13.6" width="7.6" height="5.2" rx="1.2" />
        <path d="M15.4 16.2h3.4" />
      </svg>
    );
  }

  if (name === "camera") {
    return (
      <svg {...common}>
        <path d="M3 8.5a2 2 0 0 1 2-2h2l1.3-1.8h7.4L19 6.5h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <circle cx="12" cy="12.8" r="3.4" />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg {...common}>
        <path d="M12 15.5V4.5" />
        <path d="M7.5 9 12 4.5 16.5 9" />
        <path d="M4.5 14.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3.5 7a2.2 2.2 0 0 1 2.2-2.2h12.6A2.2 2.2 0 0 1 20.5 7v6.4a2.2 2.2 0 0 1-2.2 2.2H9.2l-4 3.1a.55.55 0 0 1-.9-.44v-2.67H5.7" />
      <rect x="8.1" y="8.4" width="4.3" height="3.1" rx="1.55" transform="rotate(-38 10.25 9.95)" />
      <rect x="11.6" y="8.5" width="4.3" height="3.1" rx="1.55" transform="rotate(-38 13.75 10.05)" />
    </svg>
  );
}

function Arrow() {
  return (
    <span
      className="flex-1 h-[26px] flex items-center justify-center min-w-[14px]"
      style={arrowStyle}
    >
      <svg
        viewBox="0 0 40 9"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        preserveAspectRatio="none"
        className="w-full h-[9px] block"
      >
        <line x1="1" y1="4.5" x2="34" y2="4.5" />
        <path d="M30 1.5 34.5 4.5 30 7.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

export default function FlowStrip() {
  return (
    <div className="w-full flex items-start justify-between">
      {STEPS.map((s, i) => (
        <Fragment key={s.key}>
          <div className="flex flex-col items-center gap-2 shrink-0 w-14">
            <span className="w-[26px] h-[26px] block" style={iconWrapStyle}>
              <Icon name={s.key} />
            </span>
            <span
              className="text-xs font-medium leading-tight whitespace-nowrap"
              style={labelStyle}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <Arrow />}
        </Fragment>
      ))}
    </div>
  );
}
