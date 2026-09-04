"use client";

import { useState } from "react";

export function Toggle({
  name,
  defaultChecked,
  label,
  onChange,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked ?? false);

  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="hidden" name={name} value={checked ? "on" : ""} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          setChecked((c) => {
            onChange?.(!c);
            return !c;
          })
        }
        className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors"
        style={{
          backgroundImage: checked
            ? "linear-gradient(135deg, #a855f7 14%, #7c3aed 86%)"
            : undefined,
          backgroundColor: checked ? undefined : "#241f3d",
        }}
      >
        <span
          className="absolute top-[2px] size-[18px] rounded-full bg-white transition-all"
          style={{ left: checked ? "18px" : "2px" }}
        />
      </button>
      <span className="text-[13px] text-[var(--color-text-primary)]">{label}</span>
    </label>
  );
}
