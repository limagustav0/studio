
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Zap, BarChartBig } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-background to-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium tracking-wide text-primary bg-primary/10 rounded-full">
            <Zap className="w-4 h-4 mr-2" />
            Inteligência de Preços em Tempo Real
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Domine a Precificação do seu E-commerce e <span className="text-primary">Venda Mais!</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground">
            Nossa plataforma de monitoramento de preços oferece a visibilidade que você precisa para otimizar suas estratégias, superar a concorrência e ganhar a Buy Box.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="shadow-lg hover:shadow-primary/50 transition-shadow">
              <Link href="/">
                <BarChartBig className="mr-2 h-5 w-5" />
                Acessar o Dashboard
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Conheça as Funcionalidades</Link>
            </Button>
          </div>
        </div>
        <div className="mt-16 max-w-4xl mx-auto">
          <Image
            src="https://placehold.co/1200x600.png"
            alt="Dashboard de Monitoramento de Preços"
            width={1200}
            height={600}
            className="rounded-xl shadow-2xl border border-border"
            data-ai-hint="dashboard analytics"
          />
        </div>
      </div>
    </section>
  );
}
