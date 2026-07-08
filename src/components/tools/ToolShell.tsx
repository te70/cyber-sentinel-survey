import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";

interface ToolShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolShell({ title, description, children }: ToolShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#1A2F42] text-white">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[#1A2F42]">TetraSec</span>
              <span className="text-sm font-semibold text-[#00C9C8]"> Solutions</span>
            </div>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1A2F42] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-[#00C9C8]/10 px-3 py-1 text-xs font-semibold text-[#00A8A7] mb-3">
            Free tool
          </span>
          <h1 className="text-2xl font-bold text-[#1A2F42] sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        {children}
      </div>

      <footer className="mt-16 border-t bg-white py-6 text-center text-xs text-slate-400">
        © 2026 TetraSec Solutions Ltd · Nairobi, Kenya ·{" "}
        <Link to="/" className="hover:text-[#1A2F42]">tetrasec.co.ke</Link>
      </footer>
    </div>
  );
}
