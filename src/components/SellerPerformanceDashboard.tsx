
import type { SellerAnalysisMetrics, ProductLosingBuyboxInfo, ProductWinningBuyboxInfo, BrandBuyboxWinSummary, MarketplaceBuyboxWinSummary, InternalSkuMapping } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, ListChecks, PackageSearch, AlertTriangle, Info, CheckCircle2, Clock, Users, Tags, Globe } from 'lucide-react';
import Image from 'next/image';
import { format as formatDate, parseISO, compareDesc } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { BrandBuyboxWinnersDisplay } from '@/components/BrandBuyboxWinnersDisplay';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as React from 'react';

interface SellerPerformanceDashboardProps {
  performanceMetricsList: SellerAnalysisMetrics[];
  isLoading: boolean;
  selectedSellersCount: number;
  selectedSellerNames: string[];
  internalSkusMap: Record<string, InternalSkuMapping>; // Pass this down
}

export function SellerPerformanceDashboard({ performanceMetricsList, isLoading, selectedSellersCount, selectedSellerNames, internalSkusMap }: SellerPerformanceDashboardProps) {
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
  
  const consolidatedMetrics = React.useMemo(() => {
    if (!performanceMetricsList || performanceMetricsList.length === 0) {
      return {
        totalProductsListed: 0,
        buyboxesWon: 0,
        buyboxesLost: 0,
        allLosingProducts: [],
        allWinningProducts: [],
        latestLastUpdateTime: null,
        consolidatedBrandWins: [],
        consolidatedMarketplaceWins: [],
      };
    }

    let totalProductsListed = 0;
    const winningSkusSellerMap = new Map<string, Set<string>>(); // sku -> Set<sellerName>
    const losingSkusSellerMap = new Map<string, Set<string>>();   // sku -> Set<sellerName>
    let latestLastUpdateTime: string | null = null;

    const tempAllLosingProducts: (ProductLosingBuyboxInfo & { sellerName: string })[] = [];
    const tempAllWinningProducts: (ProductWinningBuyboxInfo & { sellerName: string })[] = [];
    
    const brandWinsAggregator: Record<string, number> = {};
    const marketplaceWinsAggregator: Record<string, number> = {};

    performanceMetricsList.forEach(metrics => {
      totalProductsListed += metrics.totalProductsListed;
      
      metrics.productsWinningBuybox.forEach(p => {
        if (!winningSkusSellerMap.has(p.sku)) winningSkusSellerMap.set(p.sku, new Set());
        winningSkusSellerMap.get(p.sku)?.add(metrics.sellerName);
        tempAllWinningProducts.push({ ...p, sellerName: metrics.sellerName });
      });
      
      metrics.productsLosingBuybox.forEach(p => {
        if (!losingSkusSellerMap.has(p.sku)) losingSkusSellerMap.set(p.sku, new Set());
        losingSkusSellerMap.get(p.sku)?.add(metrics.sellerName);
        tempAllLosingProducts.push({ ...p, sellerName: metrics.sellerName });
      });

      if (metrics.lastUpdateTime && (!latestLastUpdateTime || compareDesc(parseISO(metrics.lastUpdateTime), parseISO(latestLastUpdateTime)) < 0)) {
        latestLastUpdateTime = metrics.lastUpdateTime;
      }

      metrics.brandBuyboxWins.forEach(bw => {
        brandWinsAggregator[bw.marca] = (brandWinsAggregator[bw.marca] || 0) + bw.wins;
      });
      metrics.marketplaceBuyboxWins.forEach(mw => {
        marketplaceWinsAggregator[mw.marketplace] = (marketplaceWinsAggregator[mw.marketplace] || 0) + mw.wins;
      });
    });
    
    // For buyboxes won/lost, we count unique SKUs across all selected sellers.
    // An SKU is won if AT LEAST ONE selected seller wins it.
    // An SKU is lost if ALL selected sellers who list it are losing it.
    let consolidatedBuyboxesWon = 0;
    winningSkusSellerMap.forEach((sellersWinningThisSku, sku) => {
        // If any of the selected sellers win this SKU, it's a win for the group
        if (selectedSellerNames.some(selectedSeller => sellersWinningThisSku.has(selectedSeller))) {
            consolidatedBuyboxesWon++;
        }
    });

    let consolidatedBuyboxesLost = 0;
    losingSkusSellerMap.forEach((sellersLosingThisSku, sku) => {
        // This SKU is lost for the group if all selected sellers who offer it are losing
        const selectedSellersOfferingSku = selectedSellerNames.filter(selectedSeller => {
             return performanceMetricsList.find(m => m.sellerName === selectedSeller)?.productsLosingBuybox.some(p => p.sku === sku) ||
                    performanceMetricsList.find(m => m.sellerName === selectedSeller)?.productsWinningBuybox.some(p => p.sku === sku);
        });
        if (selectedSellersOfferingSku.length > 0 && selectedSellersOfferingSku.every(seller => sellersLosingThisSku.has(seller))) {
            consolidatedBuyboxesLost++;
        }
    });


    const consolidatedBrandWins: BrandBuyboxWinSummary[] = Object.entries(brandWinsAggregator)
        .map(([marca, wins]) => ({ marca, wins }))
        .sort((a, b) => b.wins - a.wins || a.marca.localeCompare(b.marca));

    const consolidatedMarketplaceWins: MarketplaceBuyboxWinSummary[] = Object.entries(marketplaceWinsAggregator)
        .map(([marketplace, wins]) => ({ marketplace, wins }))
        .sort((a, b) => b.wins - a.wins || a.marketplace.localeCompare(b.marketplace));

    return {
      totalProductsListed,
      buyboxesWon: consolidatedBuyboxesWon,
      buyboxesLost: consolidatedBuyboxesLost,
      allLosingProducts: tempAllLosingProducts.sort((a,b) => b.priceDifference - a.priceDifference || a.descricao.localeCompare(b.descricao)),
      allWinningProducts: tempAllWinningProducts.sort((a,b) => (a.priceDifferenceToNext ?? Infinity) - (b.priceDifferenceToNext ?? Infinity) || a.descricao.localeCompare(b.descricao)),
      latestLastUpdateTime,
      consolidatedBrandWins,
      consolidatedMarketplaceWins,
    };

  }, [performanceMetricsList, selectedSellerNames]);


  if (isLoading) {
    return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <Skeleton className="h-7 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/3 mt-1 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={`skel-metric-${i}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-2/3" /><Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent><Skeleton className="h-8 w-1/3 mb-1" /><Skeleton className="h-4 w-full" /></CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-[400px] w-full" /> 
          <div><Skeleton className="h-6 w-1/2 mb-4" /><Skeleton className="h-40 w-full" /></div>
          <div><Skeleton className="h-6 w-1/2 mb-4 mt-6" /><Skeleton className="h-40 w-full" /></div>
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
                <Info className="h-12 w-12 mb-4"/><p className="text-center">Nenhum vendedor selecionado.</p>
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
           <p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3 w-3" />Dados (mais recentes) atualizados em: {consolidatedMetrics.latestLastUpdateTime ? formatLastUpdateTime(consolidatedMetrics.latestLastUpdateTime) : 'N/A'}</p>
          <CardDescription>Não foi possível carregar os dados de desempenho para o(s) vendedor(es) selecionado(s) ou não há dados disponíveis.</CardDescription>
        </CardHeader>
         <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4 text-destructive"/>
                <p className="text-center">Sem dados para exibir para: {selectedSellerNames.join(', ')}.</p>
            </div>
        </CardContent>
      </Card>
    );
  }
  
  if (performanceMetricsList.every(m => m.totalProductsListed === 0)) {
      return (
        <Card className="shadow-lg w-full">
            <CardHeader>
            <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise Consolidada: {selectedSellerNames.join(', ')}</CardTitle>
            {consolidatedMetrics.latestLastUpdateTime && (<p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3 w-3" />Dados (mais recentes) atualizados em: {formatLastUpdateTime(consolidatedMetrics.latestLastUpdateTime)}</p>)}
            <CardDescription>Nenhum produto listado para os vendedores selecionados (considerando filtros).</CardDescription>
            </CardHeader>
            <CardContent><div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><Info className="h-12 w-12 mb-4"/><p className="text-center">Sem produtos listados.</p></div></CardContent>
        </Card>
        );
  }

  const isChartDataLoading = isLoading || (performanceMetricsList.length > 0 && (consolidatedMetrics.consolidatedBrandWins.length === 0 && consolidatedMetrics.consolidatedMarketplaceWins.length === 0 && Object.keys(internalSkusMap).length === 0) && consolidatedMetrics.buyboxesWon > 0);


  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Análise Consolidada: {selectedSellerNames.join(', ')}</CardTitle>
        {consolidatedMetrics.latestLastUpdateTime && (<p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3 w-3" />Dados (mais recentes) atualizados em: {formatLastUpdateTime(consolidatedMetrics.latestLastUpdateTime)}</p>)}
        <CardDescription>Métricas combinadas e detalhamento de produtos para os vendedores selecionados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Produtos Listados</CardTitle><ListChecks className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{consolidatedMetrics.totalProductsListed}</div><p className="text-xs text-muted-foreground">Soma de produtos ofertados</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Buyboxes Ganhos (SKUs)</CardTitle><TrendingUp className="h-5 w-5 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{consolidatedMetrics.buyboxesWon}</div><p className="text-xs text-muted-foreground">SKUs únicos com menor preço</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Buyboxes Perdidos (SKUs)</CardTitle><TrendingDown className="h-5 w-5 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{consolidatedMetrics.buyboxesLost}</div><p className="text-xs text-muted-foreground">SKUs únicos onde perde para outro</p></CardContent></Card>
        </div>
        
        {(consolidatedMetrics.consolidatedBrandWins.length > 0 || consolidatedMetrics.consolidatedMarketplaceWins.length > 0 || isChartDataLoading) && (
             <BrandBuyboxWinnersDisplay 
                brandBuyboxWins={consolidatedMetrics.consolidatedBrandWins}
                marketplaceBuyboxWins={consolidatedMetrics.consolidatedMarketplaceWins}
                isLoading={isChartDataLoading}
                context="seller" 
             />
        )}
         {(!isLoading && consolidatedMetrics.buyboxesWon > 0 && consolidatedMetrics.consolidatedBrandWins.length === 0 && Object.keys(internalSkusMap).length === 0) &&
                <Card className="shadow-sm mt-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center"><Tags className="mr-2 h-5 w-5 text-primary" />Ganhos de Buybox por Marca (Vendedor)</CardTitle>
                        <CardDescription>Importe o mapeamento de SKUs e Marcas para visualizar esta análise para o(s) vendedor(es) selecionado(s).</CardDescription>
                    </CardHeader>
                </Card>
            }

        <Accordion type="multiple" className="w-full" defaultValue={['losing-buybox', 'winning-buybox']}>
          <AccordionItem value="losing-buybox">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline p-0 py-3 data-[state=open]:pb-2">
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Produtos Perdendo Buybox ({consolidatedMetrics.allLosingProducts.length})
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0">
              {consolidatedMetrics.allLosingProducts.length > 0 ? (
                <div className="overflow-x-auto rounded-md border max-h-[500px]">
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-[60px] hidden sm:table-cell">Img</TableHead><TableHead>Produto (SKU/Marca)</TableHead><TableHead>Vendedor Ofertante (Mktplace)</TableHead><TableHead className="text-right">Preços</TableHead><TableHead>Vencedor (Dif.)</TableHead><TableHead className="text-right">Raspagem</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {consolidatedMetrics.allLosingProducts.map((item, idx) => (
                        <TableRow key={`losing-${item.sku}-${item.sellerName}-${item.marketplace}-${idx}`}>
                          <TableCell className="hidden sm:table-cell"><Image src={item.imagem || "https://placehold.co/50x50.png"} alt={item.descricao} width={50} height={50} className="rounded" data-ai-hint="product item small"/></TableCell>
                          <TableCell>
                            <div className="font-medium max-w-xs truncate" title={item.descricao}>{item.descricao}</div>
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                            {item.internalSku && (<div className="text-xs text-muted-foreground mt-0.5">Interno: {item.internalSku}</div>)}
                            {item.marca && (<Badge variant="outline" className="text-xs mt-1">{item.marca}</Badge>)}
                          </TableCell>
                          <TableCell><div className="font-medium max-w-xs truncate" title={item.sellerName}>{item.sellerName}</div><div className="text-xs text-muted-foreground max-w-xs truncate" title={item.marketplace}>{item.marketplace}</div></TableCell>
                          <TableCell className="text-right"><div><span className="text-xs text-muted-foreground mr-1">Vencedor:</span><span className="font-semibold text-green-600">R$ {item.winningPrice.toFixed(2)}</span></div><div><span className="text-xs text-muted-foreground mr-1">Seu:</span><span className="font-semibold text-blue-600">R$ {item.sellerPrice.toFixed(2)}</span></div></TableCell>
                          <TableCell><div className="font-medium max-w-[150px] truncate" title={item.winningSeller}>{item.winningSeller}</div><div className="text-xs text-red-600">Perdendo por R$ {item.priceDifference.toFixed(2)}</div></TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{formatTableCellDateTime(item.data_hora)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : consolidatedMetrics.buyboxesLost > 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Detalhes de produtos perdendo buybox não disponíveis.</p>
              ) : consolidatedMetrics.totalProductsListed > 0 ? (
                <p className="text-sm text-green-600 font-medium mt-2">Nenhum vendedor selecionado está perdendo buyboxes!</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Nenhuma informação de buybox perdido disponível.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="winning-buybox" className="mt-1 border-t pt-1"> 
            <AccordionTrigger className="text-lg font-semibold hover:no-underline p-0 py-3 data-[state=open]:pb-2">
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                Produtos Ganhando Buybox ({consolidatedMetrics.allWinningProducts.length})
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0">
              {consolidatedMetrics.allWinningProducts.length > 0 ? (
                <div className="overflow-x-auto rounded-md border max-h-[500px]">
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-[60px] hidden sm:table-cell">Img</TableHead><TableHead>Produto (SKU/Marca)</TableHead><TableHead>Vendedor Ofertante (Mktplace)</TableHead><TableHead className="text-right">Seu Preço (Margem)</TableHead><TableHead>Próx. Concorrente</TableHead><TableHead className="text-right">Raspagem</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {consolidatedMetrics.allWinningProducts.map((item, idx) => (
                        <TableRow key={`winning-${item.sku}-${item.sellerName}-${item.marketplace}-${idx}`}>
                          <TableCell className="hidden sm:table-cell"><Image src={item.imagem || "https://placehold.co/50x50.png"} alt={item.descricao} width={50} height={50} className="rounded" data-ai-hint="product item small"/></TableCell>
                          <TableCell>
                            <div className="font-medium max-w-xs truncate" title={item.descricao}>{item.descricao}</div>
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                            {item.internalSku && (<div className="text-xs text-muted-foreground mt-0.5">Interno: {item.internalSku}</div>)}
                            {item.marca && (<Badge variant="outline" className="text-xs mt-1">{item.marca}</Badge>)}
                          </TableCell>
                          <TableCell><div className="font-medium max-w-xs truncate" title={item.sellerName}>{item.sellerName}</div><div className="text-xs text-muted-foreground max-w-xs truncate" title={item.marketplace}>{item.marketplace}</div></TableCell>
                          <TableCell className="text-right"><div className="font-semibold text-green-600">R$ {item.sellerPrice.toFixed(2)}</div><div className="text-xs">{formatDifference(item.priceDifferenceToNext)}</div></TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate" title={item.nextCompetitorSellerName || undefined}>{item.priceDifferenceToNext !== null && item.priceDifferenceToNext !== undefined ? item.nextCompetitorSellerName || 'N/A' : 'Sem concorrente'}</div>
                            {(item.priceDifferenceToNext !== null && item.priceDifferenceToNext !== undefined && item.nextCompetitorSellerName && (item.sellerPrice + item.priceDifferenceToNext) > 0) && (<div className="text-xs text-muted-foreground">R$ {(item.sellerPrice + item.priceDifferenceToNext).toFixed(2)}</div>)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{formatTableCellDateTime(item.data_hora)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : consolidatedMetrics.buyboxesWon > 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Ganhando {consolidatedMetrics.buyboxesWon} buybox(es), mas detalhes não disponíveis (sem concorrência direta ou erro).</p>
              ) : (
                <p className="text-sm text-red-600 font-medium mt-2">Nenhum vendedor selecionado ganhando buyboxes.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
