
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BriefcaseBusiness } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/landing" className="flex items-center gap-2">
          <BriefcaseBusiness className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary">PriceWise Monitor</span>
        </Link>
        <nav className="space-x-4">
          <Button variant="ghost" asChild>
            <Link href="#features">Funcionalidades</Link>
          </Button>
          <Button asChild>
            <Link href="/">Acessar Dashboard</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
