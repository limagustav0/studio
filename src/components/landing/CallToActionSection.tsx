
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkle } from 'lucide-react';

export function CallToActionSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-card to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Pronto para Revolucionar sua Estratégia de Preços no Setor de <span className="text-primary">Cosméticos</span>?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Comece a monitorar, analisar e otimizar os preços dos seus produtos de beleza hoje mesmo. Descubra como nossa ferramenta pode impulsionar seu e-commerce de cosméticos.
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
