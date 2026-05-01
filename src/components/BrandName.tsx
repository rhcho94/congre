import type { CSSProperties } from "react";

interface BrandNameProps {
  withMadeBy?: boolean;
  className?: string;
  style?: CSSProperties;
}

const brandStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  color: "var(--accent)",
  fontWeight: 500,
};

const madeByStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  color: "var(--muted)",
  fontWeight: 400,
};

export function BrandName({ withMadeBy = false, className, style }: BrandNameProps) {
  if (withMadeBy) {
    return (
      <span className={className} style={style}>
        <span style={madeByStyle}>made by </span>
        <span style={brandStyle}>Congre</span>
      </span>
    );
  }
  return (
    <span className={className} style={{ ...brandStyle, ...style }}>
      Congre
    </span>
  );
}
