
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CallToActionSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-card to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Pronto para Transformar sua Estratégia de Preços?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Comece a monitorar, analisar e otimizar seus preços hoje mesmo. Acesse o dashboard e veja a diferença.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild className="shadow-lg hover:shadow-primary/50 transition-shadow">
            <Link href="/">
              Acessar o Dashboard Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
