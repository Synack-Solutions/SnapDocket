import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "muted";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-yellow-500/10 text-yellow-700",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

// Maps domain statuses to badge variants
export function statusToBadgeVariant(status: string): NonNullable<BadgeProps["variant"]> {
  const map: Record<string, NonNullable<BadgeProps["variant"]>> = {
    active: "success",
    completed: "success",
    paid: "success",
    draft: "muted",
    pending: "warning",
    scheduled: "default",
    in_progress: "default",
    sent: "default",
    viewed: "default",
    partial: "warning",
    overdue: "destructive",
    cancelled: "destructive",
    void: "destructive",
    suspended: "destructive",
    inactive: "muted",
    failed: "destructive",
    refunded: "warning",
  };
  return map[status] ?? "muted";
}
