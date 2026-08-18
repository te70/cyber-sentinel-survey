import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Compass, ArrowLeft } from "lucide-react";

interface ToolShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolShell({ title, description, children }: ToolShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Compass className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-semibold text-foreground">Alita</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <span className="mb-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Free tool
          </span>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>

      <footer className="mt-16 border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        Alita · a USIU-A research tool · Nairobi, Kenya
      </footer>
    </div>
  );
}
