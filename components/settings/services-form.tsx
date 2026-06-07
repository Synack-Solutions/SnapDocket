"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertService, deleteService } from "@/app/actions/settings-actions";
import type { ServiceOption } from "@/components/jobs/service-picker";
import { cn } from "@/lib/utils";

interface Props {
  initial: ServiceOption[];
}

const EMPTY_FORM: Omit<ServiceOption, "id"> = {
  label: "",
  description: "",
  unitPrice: 0,
  category: "core",
  subtasks: [],
};

export function ServicesForm({ initial }: Props) {
  const [services, setServices] = useState<ServiceOption[]>(initial);
  const [editing, setEditing] = useState<ServiceOption | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const openEdit = (s: ServiceOption) => {
    setEditing(s);
    setForm({
      label: s.label,
      description: s.description ?? "",
      unitPrice: s.unitPrice,
      category: s.category,
      subtasks: s.subtasks ?? [],
    });
  };

  const handleSave = () => {
    if (!form.label.trim()) {
      setError("Label is required");
      return;
    }
    if (form.unitPrice < 0) {
      setError("Price must be 0 or more");
      return;
    }
    setError(null);

    const id = editing?.id ?? crypto.randomUUID();
    const service: ServiceOption = { id, ...form };

    startTransition(async () => {
      try {
        await upsertService(service);
        setServices((prev) => {
          const idx = prev.findIndex((s) => s.id === id);
          return idx >= 0 ? prev.map((s) => (s.id === id ? service : s)) : [...prev, service];
        });
        setEditing(null);
        setForm(EMPTY_FORM);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const handleDelete = (serviceId: string) => {
    startTransition(async () => {
      try {
        await deleteService(serviceId);
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        if (editing?.id === serviceId) {
          setEditing(null);
          setForm(EMPTY_FORM);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  const core = services.filter((s) => s.category === "core");
  const addons = services.filter((s) => s.category === "addon");
  const isEditorOpen = editing !== null || form.label !== "" || form.unitPrice !== 0;

  return (
    <div className="space-y-6">
      {/* Service list */}
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No services defined yet. Add your first service below.
        </p>
      ) : (
        <div className="space-y-4">
          {core.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Core Services
              </h3>
              <ServiceList
                items={core}
                onEdit={openEdit}
                onDelete={handleDelete}
                isPending={isPending}
              />
            </section>
          )}
          {addons.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add-ons
              </h3>
              <ServiceList
                items={addons}
                onEdit={openEdit}
                onDelete={handleDelete}
                isPending={isPending}
              />
            </section>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          {editing ? "Edit Service" : "Add Service"}
        </h3>
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Label"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Lawn Mowing"
            required
          />
          <Input
            label="Unit Price ($)"
            type="number"
            min={0}
            step={0.01}
            value={form.unitPrice}
            onFocus={(e) => {
              if (e.currentTarget.value === "0") e.currentTarget.select();
            }}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short description"
          />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="service-subtasks" className="text-sm font-medium text-foreground">
              Subtasks (optional)
            </label>
            <textarea
              id="service-subtasks"
              rows={4}
              value={(form.subtasks ?? []).join("\n")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  subtasks: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                }))
              }
              placeholder={
                "One subtask per line, e.g.\nShut off mains\nDrain tank\nInstall new unit"
              }
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="service-category" className="text-sm font-medium text-foreground">
              Category
            </label>
            <select
              id="service-category"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as "core" | "addon" }))
              }
              className="h-10 rounded border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="core">Core</option>
              <option value="addon">Add-on</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSave} loading={isPending} size="sm">
            {editing ? "Update" : "Add Service"}
          </Button>
          {(editing || isEditorOpen) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY_FORM);
                setError(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceList({
  items,
  onEdit,
  onDelete,
  isPending,
}: {
  items: ServiceOption[];
  onEdit: (s: ServiceOption) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-white">
      {items.map((s) => (
        <li key={s.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{s.label}</p>
            {s.description && (
              <p className="truncate text-xs text-muted-foreground">{s.description}</p>
            )}
            {(s.subtasks?.length ?? 0) > 0 && (
              <p className="truncate text-xs text-muted-foreground">
                {s.subtasks!.length} subtask{s.subtasks!.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm font-medium text-foreground">
            ${s.unitPrice.toFixed(2)}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              s.category === "core" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
            )}
          >
            {s.category}
          </span>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(s)}
              disabled={isPending}
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(s.id)}
              disabled={isPending}
              className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
