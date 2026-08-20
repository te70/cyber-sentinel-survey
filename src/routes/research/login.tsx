import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlitaMark } from "@/components/alita/Logo";
import { PATTERN_IDS } from "@/components/alita/patterns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { researcherLogin } from "@/lib/researcher-auth.functions";

export const Route = createFileRoute("/research/login")({
  component: ResearcherLogin,
});

function ResearcherLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await researcherLogin({ data: { username, password } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({ to: "/research/dashboard" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-5">
      <Card className="grid w-full max-w-2xl overflow-hidden p-0 sm:grid-cols-2">
        <div className="hidden sm:block">
          <svg width="100%" height="100%" aria-hidden="true">
            <rect width="100%" height="100%" fill={`url(#${PATTERN_IDS.rings})`} />
          </svg>
        </div>
        <div className="p-6">
          <AlitaMark size={32} className="mb-3" />
          <h1 className="text-lg font-bold text-foreground">Researcher login</h1>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
