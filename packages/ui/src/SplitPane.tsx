import type { ReactNode } from "react";

interface SplitPaneProps {
  primary: ReactNode;
  secondary: ReactNode;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export function SplitPane({
  primary,
  secondary,
  className = "",
  primaryClassName = "",
  secondaryClassName = "",
}: SplitPaneProps) {
  return (
    <div className={`grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] ${className}`}>
      <div className={primaryClassName}>{primary}</div>
      <div className={secondaryClassName}>{secondary}</div>
    </div>
  );
}
