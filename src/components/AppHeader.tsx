
import { BriefcaseBusiness } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <BriefcaseBusiness className="h-8 w-8 text-primary" />
        <span className="text-xl font-semibold text-foreground whitespace-nowrap">
          Painel de Monitoramento de Preços
        </span>
      </div>
    </header>
  );
}
