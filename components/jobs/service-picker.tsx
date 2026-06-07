"use client";

import { cn } from "@/lib/utils";

export interface ServiceOption {
  id: string;
  label: string;
  description?: string;
  unitPrice: number;
  /** "core" shows first; "addon" shows in a secondary section */
  category: "core" | "addon";
  subtasks?: string[];
}

interface ServicePickerProps {
  services: ServiceOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ServicePicker({ services, selected, onChange }: ServicePickerProps) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const core = services.filter((s) => s.category === "core");
  const addons = services.filter((s) => s.category === "addon");

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Core Services</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {core.map((s) => (
            <ServiceTile
              key={s.id}
              service={s}
              selected={selected.includes(s.id)}
              onToggle={() => toggle(s.id)}
            />
          ))}
        </div>
      </fieldset>

      {addons.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-muted-foreground">Add-ons</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {addons.map((s) => (
              <ServiceTile
                key={s.id}
                service={s}
                selected={selected.includes(s.id)}
                onToggle={() => toggle(s.id)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-destructive">Select at least one service</p>
      )}
    </div>
  );
}

function ServiceTile({
  service,
  selected,
  onToggle,
}: {
  service: ServiceOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected ? ("true" as const) : ("false" as const)}
      onClick={onToggle}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "min-h-[64px] active:scale-95",
        selected
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border bg-background hover:bg-muted"
      )}
    >
      <span className="leading-tight">{service.label}</span>
      <span className={cn("text-xs", selected ? "text-primary/80" : "text-muted-foreground")}>
        ${service.unitPrice.toFixed(2)}
      </span>
    </button>
  );
}
