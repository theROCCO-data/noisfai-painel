import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex w-full items-center justify-center py-24">
      <Loader2 size={22} className="animate-spin text-[var(--color-accent)]" />
    </div>
  );
}
