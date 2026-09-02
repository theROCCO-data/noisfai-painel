import { RedefinirSenhaForm } from "@/components/auth/redefinir-senha-form";
import { AuthHero } from "@/components/auth/auth-hero";

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--color-bg)] lg:flex-row">
      <AuthHero />

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          <RedefinirSenhaForm />
        </div>
      </div>
    </div>
  );
}
