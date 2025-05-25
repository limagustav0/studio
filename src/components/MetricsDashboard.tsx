import type { Metrics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Award, Building2, Info, ListTree, Tags, UsersRound, Globe2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricsDashboardProps {
  metrics: Metrics | null;
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics) {
    return (
       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(7)].map(i => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-1/3 mb-1" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Preço Médio",
      value: `R$ ${metrics.averagePrice.toFixed(2)}`,
      description: "Média de todos os produtos listados",
      Icon: DollarSign
    },
    {
      title: "Produto Mais Bem Avaliado",
      value: metrics.topRatedProduct ? metrics.topRatedProduct.descricao : "N/A",
      description: metrics.topRatedProduct ? `Avaliação: ${metrics.topRatedProduct.avaliacao.toFixed(1)} estrelas` : "Sem dados de avaliação",
      Icon: Award,
      truncateValue: true
    },
    {
      title: "Loja Mais Frequente",
      value: metrics.mostFrequentStore ? metrics.mostFrequentStore.store : "N/A",
      description: metrics.mostFrequentStore ? `${metrics.mostFrequentStore.count} listagens` : "Sem dados de loja",
      Icon: Building2,
      truncateValue: true
    },
    {
      title: "Total de Registros de Preços",
      value: metrics.totalDataPoints.toLocaleString(),
      description: "Total de entradas de dados de produtos",
      Icon: ListTree
    },
    {
      title: "SKUs Únicos Monitorados",
      value: metrics.uniqueSKUs.toLocaleString(),
      description: "Número de produtos distintos por SKU",
      Icon: Tags
    },
    {
      title: "Lojas (Vendedores) Únicas",
      value: metrics.uniqueSellers.toLocaleString(),
      description: "Número de vendedores distintos",
      Icon: UsersRound
    },
    {
      title: "Marketplaces Únicos",
      value: metrics.uniqueMarketplaces.toLocaleString(),
      description: "Número de marketplaces distintos",
      Icon: Globe2
    }
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {metricCards.map(card => (
        <Card key={card.title} className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.truncateValue ? 'truncate' : ''}`} title={card.truncateValue ? card.value : undefined}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
