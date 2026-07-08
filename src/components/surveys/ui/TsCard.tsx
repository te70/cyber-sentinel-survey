import { type ReactNode } from "react";

interface TsCardProps {
  children: ReactNode;
  className?: string;
}

export function TsCard({ children, className = "" }: TsCardProps) {
  return (
    <div
      className={`bg-[var(--ts-card)] border border-[var(--ts-border)] rounded-xl p-5 sm:p-6 shadow-[var(--ts-shadow-sm)] ${className}`}
    >
      {children}
    </div>
  );
}
