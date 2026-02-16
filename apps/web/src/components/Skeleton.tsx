"use client";

interface SkeletonProps {
  variant?: "line" | "circle" | "rectangle";
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ variant = "line", width, height, className = "" }: SkeletonProps) {
  const base = "animate-pulse bg-gray-200";

  const variantClasses: Record<string, string> = {
    line: `${base} rounded ${width || "w-full"} ${height || "h-4"}`,
    circle: `${base} rounded-full ${width || "w-10"} ${height || "h-10"}`,
    rectangle: `${base} rounded-lg ${width || "w-full"} ${height || "h-24"}`,
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
}
