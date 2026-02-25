interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      aria-label="Loading"
      role="status"
      className={`inline-block animate-spin rounded-full border-slate-300 border-t-slate-700 ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
