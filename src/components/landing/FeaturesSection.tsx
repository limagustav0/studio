
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Radar, Trophy, Users, Package, BellRing, BarChartHorizontalBig, Sparkles, Palette } from 'lucide-react';

const features = [
  {
    icon: <Radar className="h-8 w-8 text-primary mb-4" />,
    title: 'Monitoramento Especializado em Beleza',
    description: 'Acompanhe os preços dos seus produtos de beleza e de marcas concorrentes em múltiplos marketplaces, 24/7.',
  },
  {
    icon: <Trophy className="h-8 w-8 text-primary mb-4" />,
    title: 'Análise de Buy Box para Cosméticos',
    description: 'Descubra quem domina a Buy Box para seus cosméticos e ajuste seus preços para impulsionar as vendas dos seus itens de beleza.',
  },
  {
    icon: <BarChartHorizontalBig className="h-8 w-8 text-primary mb-4" />,
    title: 'Inteligência Competitiva no Setor de Beleza',
    description: 'Analise as táticas de precificação de outras marcas de cosméticos e encontre nichos e oportunidades no mercado.',
  },
  {
    icon: <Package className="h-8 w-8 text-primary mb-4" />,
    title: 'Visão Consolidada de SKUs de Cosméticos',
    description: 'Centralize a gestão dos seus SKUs de maquiagem, skincare e outros produtos de beleza, comparando seus códigos internos com os dos marketplaces.',
  },
  {
    icon: <BellRing className="h-8 w-8 text-primary mb-4" />,
    title: 'Detecção de Tendências de Preço em Beleza',
    description: 'Acompanhe quais lojas e marcas de cosméticos estão ajustando preços e com que frequência, permitindo reações rápidas e estratégicas.',
  },
  {
    icon: <Palette className="h-8 w-8 text-primary mb-4" />,
    title: 'Análise Detalhada por Marca e Vendedor',
    description: 'Avalie o desempenho de vendedores e marcas de cosméticos específicas, comparando suas faixas de preço e estratégias de venda no setor.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Ferramentas poderosas para sua <span className="text-primary">loja de cosméticos online</span>.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Nossa plataforma transforma dados do mercado de beleza em decisões de precificação lucrativas e estratégicas.
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
