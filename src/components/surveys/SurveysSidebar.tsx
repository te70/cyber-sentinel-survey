import { Link, useLocation } from "@tanstack/react-router";
import { Home, ClipboardList, Wrench, BarChart3, LogOut } from "lucide-react";

const NAV_LINKS = [
  { label: "Home",     icon: Home,          href: "/surveys/dashboard" },
  { label: "Survey",   icon: ClipboardList, href: "/surveys/eligibility" },
  { label: "Tools",    icon: Wrench,        href: "/tools" },
  { label: "Report",   icon: BarChart3,     href: "/surveys/report" },
] as const;

interface SurveysSidebarProps {
  businessName?: string;
  onLogout?: () => void;
}

export function SurveysSidebar({ businessName = "My Business", onLogout }: SurveysSidebarProps) {
  const { pathname } = useLocation();

  return (
    <aside
      className="hidden sm:fixed sm:left-0 sm:top-0 sm:flex sm:h-screen sm:w-60 sm:flex-col"
      style={{ backgroundColor: "var(--ts-navy)" }}
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="flex items-baseline gap-1 px-6 py-6">
        <span
          className="text-lg font-bold text-white"
          style={{ fontFamily: "var(--ts-font-display)" }}
        >
          TetraSec
        </span>
        <span
          className="text-lg font-bold"
          style={{ fontFamily: "var(--ts-font-display)", color: "var(--ts-teal)" }}
        >
          Surveys
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3">
        {NAV_LINKS.map(({ label, icon: Icon, href }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              to={href as never}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border-l-[3px] border-[var(--ts-teal)] pl-[9px] text-white"
                  : "border-l-[3px] border-transparent text-white/70 hover:text-white",
              ].join(" ")}
              style={{
                fontFamily: "var(--ts-font-body)",
                backgroundColor: active ? "rgba(0, 191, 166, 0.10)" : undefined,
              }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-6 py-4">
        <p className="truncate text-xs text-white/70" style={{ fontFamily: "var(--ts-font-body)" }}>
          {businessName}
        </p>
        <button
          onClick={onLogout}
          className="mt-2 flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-white"
          style={{ fontFamily: "var(--ts-font-body)" }}
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
