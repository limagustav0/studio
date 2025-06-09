
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Radar, Trophy, Users, Package, BellRing, BarChartHorizontalBig } from 'lucide-react';

const features = [
  {
    icon: <Radar className="h-8 w-8 text-primary mb-4" />,
    title: 'Monitoramento Abrangente',
    description: 'Acompanhe os preços dos seus produtos e concorrentes em múltiplos marketplaces, 24/7.',
  },
  {
    icon: <Trophy className="h-8 w-8 text-primary mb-4" />,
    title: 'Análise de Buy Box',
    description: 'Identifique quem está ganhando a Buy Box e ajuste seus preços para aumentar suas chances de venda.',
  },
  {
    icon: <BarChartHorizontalBig className="h-8 w-8 text-primary mb-4" />,
    title: 'Inteligência Competitiva',
    description: 'Entenda as estratégias de precificação dos seus concorrentes e descubra oportunidades de mercado.',
  },
  {
    icon: <Package className="h-8 w-8 text-primary mb-4" />,
    title: 'Visão Consolidada de SKUs',
    description: 'Gerencie e compare seus SKUs internos com os dos marketplaces de forma centralizada e eficiente.',
  },
  {
    icon: <BellRing className="h-8 w-8 text-primary mb-4" />,
    title: 'Detecção de Mudanças',
    description: 'Visualize quais vendedores estão alterando preços e com que frequência, para reações mais ágeis.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary mb-4" />,
    title: 'Análise Detalhada por Vendedor',
    description: 'Mergulhe no desempenho de vendedores específicos, comparando preços e estratégias.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Tudo que você precisa para <span className="text-primary">precificar com inteligência</span>.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Nossa plataforma é equipada com ferramentas poderosas para transformar dados de mercado em decisões lucrativas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
              <CardHeader className="items-center text-center">
                {feature.icon}
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center flex-grow">
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
