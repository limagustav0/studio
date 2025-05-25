import type { Metrics, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Award, Building2, Info } from 'lucide-react';

interface MetricsDashboardProps {
  metrics: Metrics | null;
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics) {
    return (
       <div className="grid gap-6 md:grid-cols-3 mb-8">
        {[1,2,3].map(i => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carregando...</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Aguarde...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Preço Médio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {metrics.averagePrice.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Média de todos os produtos listados</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Produto Mais Bem Avaliado</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {metrics.topRatedProduct ? (
            <>
              <div className="text-xl font-bold truncate" title={metrics.topRatedProduct.descricao}>
                {metrics.topRatedProduct.descricao}
              </div>
              <p className="text-xs text-muted-foreground">Avaliação: {metrics.topRatedProduct.avaliacao.toFixed(1)} estrelas</p>
            </>
          ) : (
            <div className="text-2xl font-bold">N/A</div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Loja Mais Frequente</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {metrics.mostFrequentStore ? (
            <>
              <div className="text-2xl font-bold truncate" title={metrics.mostFrequentStore.store}>
                {metrics.mostFrequentStore.store}
              </div>
              <p className="text-xs text-muted-foreground">{metrics.mostFrequentStore.count} listagens</p>
            </>
          ) : (
            <div className="text-2xl font-bold">N/A</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
