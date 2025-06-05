
import type { SellerAnalysisMetrics, ProductLosingBuyboxInfo, ProductWinningBuyboxInfo } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, ListChecks, PackageSearch, AlertTriangle, Info, CheckCircle2, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import { format as formatDate, parseISO, compareDesc } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SellerPerformanceDashboardProps {
  performanceMetricsList: SellerAnalysisMetrics[];
  isLoading: boolean;
  selectedSellersCount: number;
  selectedSellerNames: string[];
}

export function SellerPerformanceDashboard({ performanceMetricsList, isLoading, selectedSellersCount, selectedSellerNames }: SellerPerformanceDashboardProps) {
  const formatLastUpdateTime = (isoDateString: string | null) => {
    if (!isoDateString) return 'N/A';
    try {
      return formatDate(parseISO(isoDateString), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch (e) {
      console.warn("Failed to format last update time:", e);
      return 'Data inválida';
    }
  };

  const formatTableCellDateTime = (isoDateString: string | null | undefined) => {
    if (!isoDateString) return 'N/A';
    try {
      return formatDate(parseISO(isoDateString), "dd/MM/yy HH:mm", { locale: ptBR });
    } catch (e) {
      console.warn("Failed to format table cell date time:", e);
      return 'Inválida';
    }
  };

  const formatDifference = (diff: number | null | undefined) => {
    if (diff === null || diff === undefined) {
      return <span className="text-muted-foreground">Único vendedor ou sem concorrente direto</span>;
    }
    if (diff === 0) {
      return <span className="text-yellow-600">Empatado</span>;
    }
    if (diff > 0) {
      return <span className="text-green-600">Ganhando por R$ {diff.toFixed(2)}</span>;
    }
    return <span className="text-red-600">Perdendo por R$ {Math.abs(diff).toFixed(2)}</span>;
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <Skeleton className="h-7 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={`skel-metric-${i}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/3 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-40 w-full" />
          </div>
           <div>
            <Skeleton className="h-6 w-1/2 mb-4 mt-6" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedSellersCount === 0) {
     return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise de Desempenho Consolidada</CardTitle>
          <CardDescription>Selecione um ou mais vendedores na seção acima para visualizar a análise detalhada.</CardDescription>
        </CardHeader>
         <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Info className="h-12 w-12 mb-4"/>
                <p className="text-center">Nenhum vendedor selecionado.</p>
            </div>
        </CardContent>
      </Card>
    );
  }

  if (performanceMetricsList.length === 0 && selectedSellersCount > 0) {
     return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise de Desempenho Consolidada</CardTitle>
          <CardDescription>Não foi possível carregar os dados de desempenho para o(s) vendedor(es) selecionado(s) ou não há dados disponíveis.</CardDescription>
        </CardHeader>
         <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4 text-destructive"/>
                <p className="text-center">Sem dados para exibir para o(s) vendedor(es) selecionado(s): {selectedSellerNames.join(', ')}.</p>
            </div>
        </CardContent>
      </Card>
    );
  }

  // Consolidate metrics
  let consolidatedTotalProductsListed = 0;
  const winningSkus = new Set<string>();
  const losingSkus = new Set<string>();
  let latestLastUpdateTime: string | null = null;

  const allLosingProducts: (ProductLosingBuyboxInfo & { sellerName: string })[] = [];
  const allWinningProducts: (ProductWinningBuyboxInfo & { sellerName: string })[] = [];

  performanceMetricsList.forEach(metrics => {
    consolidatedTotalProductsListed += metrics.totalProductsListed;
    metrics.productsWinningBuybox.forEach(p => winningSkus.add(p.sku));
    metrics.productsLosingBuybox.forEach(p => losingSkus.add(p.sku));

    if (metrics.lastUpdateTime) {
      if (!latestLastUpdateTime || compareDesc(parseISO(metrics.lastUpdateTime), parseISO(latestLastUpdateTime)) < 0) {
        latestLastUpdateTime = metrics.lastUpdateTime;
      }
    }

    metrics.productsLosingBuybox.forEach(p => {
      allLosingProducts.push({ ...p, sellerName: metrics.sellerName });
    });
    metrics.productsWinningBuybox.forEach(p => {
      allWinningProducts.push({ ...p, sellerName: metrics.sellerName });
    });
  });

  const consolidatedBuyboxesWon = winningSkus.size;
  const consolidatedBuyboxesLost = losingSkus.size;
  
  allLosingProducts.sort((a,b) => b.priceDifference - a.priceDifference || a.descricao.localeCompare(b.descricao));
  allWinningProducts.sort((a,b) => (a.priceDifferenceToNext ?? Infinity) - (b.priceDifferenceToNext ?? Infinity) || a.descricao.localeCompare(b.descricao));


  if (performanceMetricsList.every(m => m.totalProductsListed === 0)) {
      return (
        <Card className="shadow-lg w-full">
            <CardHeader>
            <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise Consolidada: {selectedSellerNames.join(', ')}</CardTitle>
            <CardDescription>Nenhum dos vendedores selecionados possui produtos listados nos dados atuais (considerando o filtro de marketplace).</CardDescription>
            {latestLastUpdateTime && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <Clock className="mr-1.5 h-3 w-3" />
                Dados atualizados em: {formatLastUpdateTime(latestLastUpdateTime)}
                </p>
            )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Info className="h-12 w-12 mb-4"/>
                    <p className="text-center">Sem produtos listados para os vendedores selecionados.</p>
                </div>
            </CardContent>
        </Card>
        );
  }


  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Análise Consolidada: {selectedSellerNames.join(', ')}
        </CardTitle>
        <CardDescription>Métricas combinadas e detalhamento de produtos para os vendedores selecionados.</CardDescription>
        {latestLastUpdateTime && (
          <p className="text-xs text-muted-foreground pt-1 flex items-center">
            <Clock className="mr-1.5 h-3 w-3" />
            Dados (mais recentes entre os selecionados) atualizados em: {formatLastUpdateTime(latestLastUpdateTime)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos Listados</CardTitle>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consolidatedTotalProductsListed}</div>
              <p className="text-xs text-muted-foreground">Soma de produtos ofertados pelos vendedores selecionados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Buyboxes Ganhos (SKUs Únicos)</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consolidatedBuyboxesWon}</div>
              <p className="text-xs text-muted-foreground">SKUs onde pelo menos um vendedor selecionado tem o menor preço</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Buyboxes Perdidos (SKUs Únicos)</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consolidatedBuyboxesLost}</div>
              <p className="text-xs text-muted-foreground">SKUs onde um vendedor selecionado perde para outro (fora do grupo ou dentro)</p>
            </CardContent>
          </Card>
        </div>

        {allLosingProducts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
              Produtos Perdendo Buybox (Considerando Vendedores Selecionados)
            </h3>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] hidden sm:table-cell">Imagem</TableHead>
                    <TableHead>Produto (SKU)</TableHead>
                    <TableHead>Vendedor (Marketplace)</TableHead>
                    <TableHead className="text-right">Preços</TableHead>
                    <TableHead>Vencedor (Diferença)</TableHead>
                    <TableHead className="text-right">Ultima raspagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLosingProducts.map((item, idx) => (
                    <TableRow key={`losing-${item.sku}-${item.sellerName}-${item.marketplace}-${idx}`}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          src={item.imagem || "https://placehold.co/50x50.png"}
                          alt={item.descricao}
                          width={50}
                          height={50}
                          className="rounded"
                          data-ai-hint="product item small"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium max-w-xs truncate" title={item.descricao}>{item.descricao}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium max-w-xs truncate" title={item.sellerName}>{item.sellerName}</div>
                        <div className="text-xs text-muted-foreground max-w-xs truncate" title={item.marketplace}>{item.marketplace}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <span className="text-xs text-muted-foreground mr-1">Seu:</span>
                          <span className="text-blue-600">R$ {item.sellerPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground mr-1">Vencedor:</span>
                          <span className="font-semibold text-green-600">R$ {item.winningPrice.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="max-w-[150px] truncate" title={item.winningSeller}>{item.winningSeller}</div>
                         <div className="text-xs text-red-600">Perdendo por R$ {item.priceDifference.toFixed(2)}</div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatTableCellDateTime(item.data_hora)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {allLosingProducts.length === 0 && consolidatedBuyboxesLost > 0 && (
             <p className="text-sm text-muted-foreground mt-4">Informações detalhadas sobre produtos perdendo buybox não disponíveis ou erro no cálculo.</p>
        )}
         {consolidatedBuyboxesLost === 0 && consolidatedTotalProductsListed > 0 && (
             <p className="text-sm text-green-600 font-medium mt-4">Ótimo! Nenhum dos vendedores selecionados está perdendo buyboxes para os produtos que listam.</p>
        )}


        <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
              Produtos Ganhando Buybox (Considerando Vendedores Selecionados)
            </h3>
            {allWinningProducts.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] hidden sm:table-cell">Imagem</TableHead>
                      <TableHead>Produto (SKU)</TableHead>
                      <TableHead>Vendedor (Marketplace)</TableHead>
                      <TableHead className="text-right">Seu Preço</TableHead>
                      <TableHead className="text-right">Preço Concorrente Mais Próximo</TableHead>
                      <TableHead>Concorrente</TableHead>
                      <TableHead className="text-right">Diferença p/ Próximo</TableHead>
                      <TableHead className="text-right">Ultima raspagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allWinningProducts.map((item, idx) => (
                      <TableRow key={`winning-${item.sku}-${item.sellerName}-${item.marketplace}-${idx}`}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            src={item.imagem || "https://placehold.co/50x50.png"}
                            alt={item.descricao}
                            width={50}
                            height={50}
                            className="rounded"
                            data-ai-hint="product item small"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium max-w-xs truncate" title={item.descricao}>{item.descricao}</div>
                          <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium max-w-xs truncate" title={item.sellerName}>{item.sellerName}</div>
                          <div className="text-xs text-muted-foreground max-w-xs truncate" title={item.marketplace}>{item.marketplace}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">R$ {item.sellerPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            {(item.priceDifferenceToNext !== null && item.priceDifferenceToNext !== undefined && item.nextCompetitorSellerName) ? `R$ ${(item.sellerPrice + item.priceDifferenceToNext).toFixed(2)}` : 'N/A'}
                        </TableCell>
                         <TableCell className="max-w-[120px] truncate" title={item.nextCompetitorSellerName || undefined}>
                            {item.priceDifferenceToNext !== null && item.priceDifferenceToNext !== undefined 
                                ? item.nextCompetitorSellerName || 'N/A'
                                : 'Sem concorrente direto'}
                        </TableCell>
                        <TableCell className="text-right">{formatDifference(item.priceDifferenceToNext)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{formatTableCellDateTime(item.data_hora)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : consolidatedBuyboxesWon > 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                Pelo menos um vendedor selecionado está ganhando {consolidatedBuyboxesWon} buybox(es), mas os detalhes dos produtos não estão disponíveis (possivelmente ganhos sem concorrência direta ou erro no processamento).
              </p>
            ) : (
              <p className="text-sm text-red-600 font-medium mt-2">
                Nenhum dos vendedores selecionados está ganhando buyboxes atualmente.
              </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

