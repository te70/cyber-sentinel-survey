import { Link, useLocation } from "@tanstack/react-router";
import { Home, ClipboardList, Wrench, BarChart3 } from "lucide-react";

const TABS = [
  { label: "Home",    icon: Home,          href: "/surveys/dashboard" },
  { label: "Survey",  icon: ClipboardList, href: "/surveys/eligibility" },
  { label: "Tools",   icon: Wrench,        href: "/tools" },
  { label: "Report",  icon: BarChart3,     href: "/surveys/report" },
] as const;

export function SurveysBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-center justify-around border-t border-[var(--ts-border)] bg-white sm:hidden"
    >
      {TABS.map(({ label, icon: Icon, href }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            to={href as never}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={[
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-[var(--ts-teal)]" : "text-[var(--ts-text-secondary)]",
            ].join(" ")}
            style={{ fontFamily: "var(--ts-font-body)" }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
