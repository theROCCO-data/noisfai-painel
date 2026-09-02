"use client";

import { signOut } from "@/lib/auth-actions";

export function SairButton() {
  return (
    <button
      onClick={() => signOut()}
      className="flex h-9 w-fit items-center rounded-[999px] border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-5 text-[13px] font-medium text-[var(--color-status-red)]"
    >
      Sair da conta
    </button>
  );
}
