import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SmePageHeader } from "@/components/alita/SmePageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSme } from "@/lib/alita/alita.functions";
import { deleteSmeAccount, getConsentStatus, revokeConsent } from "@/lib/alita/consent.functions";

export const Route = createFileRoute("/alita/settings/$smeId")({
  component: SettingsScreen,
});

interface ConsentRecordView {
  version: string;
  grantedAt: string;
  revokedAt: string | null;
}

function ConsentRow({ label, record }: { label: string; record: ConsentRecordView | null }) {
  if (!record) {
    return (
      <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Not recorded</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          v{record.version} · {record.revokedAt ? "Revoked" : "Active"} · granted{" "}
          {new Date(record.grantedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function SettingsScreen() {
  const { smeId } = Route.useParams();
  const navigate = useNavigate();
  const [sme, setSme] = useState<{ name: string; tier: "A" | "B" | "C" } | null>(null);
  const [privacyNotice, setPrivacyNotice] = useState<ConsentRecordView | null>(null);
  const [researchParticipation, setResearchParticipation] = useState<ConsentRecordView | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function load() {
    setLoadError(false);
    Promise.all([getConsentStatus({ data: { smeId } }), getSme({ data: { smeId } })])
      .then(([status, { sme: smeRow }]) => {
        setPrivacyNotice(status.privacyNotice as ConsentRecordView | null);
        setResearchParticipation(status.researchParticipation as ConsentRecordView | null);
        setSme({ name: smeRow.name, tier: smeRow.tier });
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }

  useEffect(load, [smeId]);

  async function handleRevoke() {
    setBusy(true);
    setError(null);
    const res = await revokeConsent({ data: { smeId, consentType: "research_participation" } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn't revoke consent.");
      return;
    }
    const status = await getConsentStatus({ data: { smeId } });
    setResearchParticipation(status.researchParticipation as ConsentRecordView | null);
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteSmeAccount({ data: { smeId } });
      navigate({ to: "/" });
    } catch {
      setError("Couldn't delete your account. Please try again.");
      setBusy(false);
    }
  }

  const researchActive = researchParticipation && !researchParticipation.revokedAt;

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn't load your settings. Please check your connection and try again.
          </p>
          <Button className="mt-4 w-full" onClick={load}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-lg">
        {sme && <SmePageHeader smeId={smeId} name={sme.name} tier={sme.tier} />}

        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your privacy and research consent.
        </p>

        {!loaded ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <Card className="mt-6 p-5">
              <h2 className="text-sm font-semibold text-foreground">Your consent</h2>
              <div className="mt-2">
                <ConsentRow label="Privacy notice" record={privacyNotice} />
                <ConsentRow label="Research participation" record={researchParticipation} />
              </div>
            </Card>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <Card className="mt-4 p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Revoke research participation
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Stops any future use of your data in the research. Your account and assessments keep
                working as normal — this only affects research use.
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={handleRevoke}
                disabled={busy || !researchActive}
              >
                {researchActive ? "Revoke research participation" : "Already revoked"}
              </Button>
            </Card>

            <Card className="mt-4 border-destructive/40 p-5">
              <h2 className="text-sm font-semibold text-destructive">Delete my account and data</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Permanently deletes your business profile, assessments, targets, and training
                records. This is different from revoking research participation and cannot be
                undone.
              </p>
              {!confirmingDelete ? (
                <Button
                  className="mt-3"
                  variant="destructive"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete my account and data
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Are you sure? This can't be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDelete} disabled={busy}>
                      {busy ? "Deleting…" : "Yes, delete everything"}
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmingDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
