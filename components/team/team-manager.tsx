"use client";

import { useState, useTransition } from "react";
import { inviteTeamMember, updateMemberRole, removeMember } from "@/app/actions/team-actions";
import { approveAccessRequest, rejectAccessRequest } from "@/app/actions/access-request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/types";

type InviteRole = "admin" | "technician" | "viewer";

const ROLES: { value: InviteRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "technician", label: "Technician" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-accent/10 text-accent",
  admin: "bg-blue-50 text-blue-700",
  technician: "bg-emerald-50 text-emerald-700",
  viewer: "bg-muted text-muted-foreground",
};

interface Props {
  members: Pick<Profile, "id" | "email" | "full_name" | "role" | "is_active">[];
  requests: Array<{
    id: string;
    email: string;
    full_name: string | null;
    message: string | null;
    requested_role: InviteRole;
    requested_at: string;
  }>;
  currentUserId: string;
  canManage: boolean;
}

export function TeamManager({ members, requests, currentUserId, canManage }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("technician");
  const [requestRoles, setRequestRoles] = useState<Record<string, InviteRole>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInvite = () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await inviteTeamMember(email.trim(), role);
        setSuccess(`Invite sent to ${email.trim()}`);
        setEmail("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send invite");
      }
    });
  };

  const handleRoleChange = (memberId: string, newRole: InviteRole) => {
    startTransition(async () => {
      try {
        await updateMemberRole(memberId, newRole);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update role");
      }
    });
  };

  const handleRemove = (memberId: string) => {
    startTransition(async () => {
      try {
        await removeMember(memberId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove member");
      }
    });
  };

  const handleApproveRequest = (requestId: string, defaultRole: InviteRole) => {
    const selectedRole = requestRoles[requestId] ?? defaultRole;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await approveAccessRequest(requestId, selectedRole);
        setSuccess("Access request approved and invite sent");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to approve request");
      }
    });
  };

  const handleRejectRequest = (requestId: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await rejectAccessRequest(requestId);
        setSuccess("Access request rejected");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reject request");
      }
    });
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Access requests</h3>
          {requests.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending access requests.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.full_name ?? r.email}
                    </p>
                    {r.full_name && (
                      <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                    )}
                    {r.message && <p className="mt-1 text-xs text-muted-foreground">{r.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={requestRoles[r.id] ?? r.requested_role}
                      onChange={(e) =>
                        setRequestRoles((prev) => ({
                          ...prev,
                          [r.id]: e.target.value as InviteRole,
                        }))
                      }
                      className="h-8 rounded border border-border bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      aria-label="Role to grant"
                    >
                      {ROLES.map((roleOption) => (
                        <option key={roleOption.value} value={roleOption.value}>
                          {roleOption.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(r.id, r.requested_role)}
                      loading={isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(r.id)}
                      disabled={isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Approve sends an invite email and provisions the user in your workspace.
          </p>
        </div>
      )}

      {/* Member list */}
      <ul className="divide-y divide-border rounded-lg border border-border bg-white">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
              {(m.full_name ?? m.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {m.full_name ?? m.email}
              </p>
              {m.full_name && <p className="truncate text-xs text-muted-foreground">{m.email}</p>}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[m.role] ?? ROLE_BADGE.viewer}`}
            >
              {m.role}
            </span>
            {canManage && m.id !== currentUserId && m.role !== "owner" && (
              <div className="flex shrink-0 items-center gap-1">
                <select
                  aria-label="Change role"
                  value={m.role as InviteRole}
                  onChange={(e) => handleRoleChange(m.id, e.target.value as InviteRole)}
                  disabled={isPending}
                  className="h-7 rounded border border-border bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemove(m.id)}
                  disabled={isPending}
                  className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Invite form */}
      {canManage && (
        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Invite team member</h3>
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          {success && <p className="mb-3 text-sm text-success">{success}</p>}
          <div className="flex gap-2">
            <Input
              placeholder="colleague@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <select
              aria-label="Role for new member"
              value={role}
              onChange={(e) => setRole(e.target.value as InviteRole)}
              className="h-10 rounded border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button onClick={handleInvite} loading={isPending} size="sm">
              Send invite
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            They&apos;ll receive an email to set up their account and join your team.
          </p>
        </div>
      )}
    </div>
  );
}
