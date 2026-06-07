"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { submitAccessRequest } from "@/app/actions/access-request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestName, setRequestName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleRequestAccess = async () => {
    setRequestLoading(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      await submitAccessRequest({
        workspaceSlug,
        email: requestEmail,
        fullName: requestName,
        message: requestMessage,
      });
      setRequestSuccess("Request sent. A workspace manager will review it soon.");
      setRequestEmail("");
      setRequestName("");
      setRequestMessage("");
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : "Failed to submit request");
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <span className="mb-3 block text-xl font-bold tracking-tight text-foreground">
          SnapDocket
        </span>
        <CardTitle className="text-base font-medium text-muted-foreground">
          Sign in to your account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            New to SnapDocket?{" "}
            <Link href="/register" className="text-accent underline-offset-2 hover:underline">
              Create account
            </Link>
          </p>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowRequest((v) => !v)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              {showRequest ? "Hide access request" : "Request access"}
            </button>
          </div>

          {showRequest && (
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account yet? Submit a request to your workspace manager.
              </p>
              <div className="space-y-2">
                <Input
                  label="Workspace slug"
                  required
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  placeholder="e.g. acme-trades"
                />
                <Input
                  label="Your email"
                  type="email"
                  required
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Input
                  label="Full name (optional)"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                />
                <Input
                  label="Message (optional)"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="I’m joining the field team"
                />

                {requestError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {requestError}
                  </p>
                )}
                {requestSuccess && (
                  <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
                    {requestSuccess}
                  </p>
                )}

                <Button
                  type="button"
                  size="sm"
                  loading={requestLoading}
                  onClick={handleRequestAccess}
                  className="w-full"
                >
                  Send access request
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
