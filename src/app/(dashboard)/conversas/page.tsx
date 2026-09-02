import { MessageCircle } from "lucide-react";

export default function ConversasIndexPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <MessageCircle size={28} className="text-[var(--color-text-muted)]" />
      <p className="text-[14px] text-[var(--color-text-muted)]">Selecione uma conversa na lista ao lado.</p>
    </div>
  );
}
