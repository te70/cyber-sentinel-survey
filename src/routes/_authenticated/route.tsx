import { createFileRoute, Outlet } from "@tanstack/react-router";

// Auth bypass: Supabase login skipped until service role key is configured.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    return { user: { id: "bypass", email: "admin@local" } };
  },
  component: () => <Outlet />,
});
