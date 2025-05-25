
import type { SellerAnalysisMetrics, ProductLosingBuyboxInfo, ProductWinningBuyboxInfo } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, ListChecks, PackageSearch, AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';
import Image from 'next/image';
import { format as formatDate, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SellerPerformanceDashboardProps {
  sellerMetrics: SellerAnalysisMetrics | null;
  isLoading: boolean;
  selectedSellerName?: string | null;
}

export function SellerPerformanceDashboard({ sellerMetrics, isLoading, selectedSellerName }: SellerPerformanceDashboardProps) {
  const formatLastUpdateTime = (isoDateString: string | null) => {
    if (!isoDateString) return 'N/A';
    try {
      return formatDate(parseISO(isoDateString), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch (e) {
      console.warn("Failed to format last update time:", e);
      return 'Data inválida';
    }
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
              <Card key={i}>
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

  if (!selectedSellerName) {
     return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise de Desempenho do Vendedor</CardTitle>
          <CardDescription>Selecione um vendedor na seção acima para visualizar a análise detalhada.</CardDescription>
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
  
  if (!isLoading && selectedSellerName && !sellerMetrics) {
     return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise de Desempenho: {selectedSellerName}</CardTitle>
          <CardDescription>Não foi possível carregar os dados de desempenho para este vendedor.</CardDescription>
        </CardHeader>
         <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4 text-destructive"/>
                <p className="text-center">Sem dados para exibir ou falha ao carregar.</p>
            </div>
        </CardContent>
      </Card>
    );
  }
  
  if (sellerMetrics && sellerMetrics.totalProductsListed === 0 && !isLoading) {
    return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise de Desempenho: {selectedSellerName}</CardTitle>
          <CardDescription>Este vendedor não possui produtos listados nos dados atuais.</CardDescription>
          {sellerMetrics.lastUpdateTime && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Clock className="mr-1.5 h-3 w-3" />
              Última atualização dos dados: {formatLastUpdateTime(sellerMetrics.lastUpdateTime)}
            </p>
          )}
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Info className="h-12 w-12 mb-4"/>
                <p className="text-center">Sem produtos listados para este vendedor.</p>
            </div>
        </CardContent>
      </Card>
    );
  }

  if (!sellerMetrics) {
    return null; 
  }


  const { totalProductsListed, buyboxesWon, buyboxesLost, productsLosingBuybox, productsWinningBuybox, lastUpdateTime } = sellerMetrics;

  const formatDifference = (diff: number | null | undefined) => {
    if (diff === null || diff === undefined) {
      return <span className="text-muted-foreground">Único vendedor</span>;
    }
    if (diff === 0) {
      return <span className="text-yellow-600">Empatado</span>;
    }
    if (diff > 0) {
      return <span className="text-green-600">Ganhando por R$ {diff.toFixed(2)}</span>;
    }
    return <span className="text-red-600">Perdendo por R$ {Math.abs(diff).toFixed(2)}</span>; 
  };


  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" />Análise de Desempenho: {selectedSellerName}</CardTitle>
        <CardDescription>Métricas detalhadas sobre os produtos e buybox do vendedor selecionado.</CardDescription>
        {lastUpdateTime && (
          <p className="text-xs text-muted-foreground pt-1 flex items-center">
            <Clock className="mr-1.5 h-3 w-3" />
            Dados atualizados em: {formatLastUpdateTime(lastUpdateTime)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Listados</CardTitle>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProductsListed}</div>
              <p className="text-xs text-muted-foreground">Total de produtos ofertados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Buyboxes Ganhos</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buyboxesWon}</div>
              <p className="text-xs text-muted-foreground">SKUs com o menor preço</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Buyboxes Perdidos</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buyboxesLost}</div>
              <p className="text-xs text-muted-foreground">SKUs onde outro vendedor é mais barato</p>
            </CardContent>
          </Card>
        </div>

        {productsLosingBuybox.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
              Produtos Perdendo Buybox (para outros vendedores)
            </h3>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] hidden sm:table-cell">Imagem</TableHead>
                    <TableHead>Produto (SKU)</TableHead>
                    <TableHead className="text-right">Seu Preço</TableHead>
                    <TableHead className="text-right">Preço Vencedor</TableHead>
                    <TableHead>Vencedor do Buybox</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLosingBuybox.map((item) => (
                    <TableRow key={`losing-${item.sku}`}>
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
                      <TableCell className="text-right">R$ {item.sellerPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">R$ {item.winningPrice.toFixed(2)}</TableCell>
                      <TableCell className="max-w-[100px] truncate" title={item.winningSeller}>{item.winningSeller}</TableCell>
                      <TableCell className="text-right text-red-600">R$ {item.priceDifference.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {productsLosingBuybox.length === 0 && buyboxesLost > 0 && (
             <p className="text-sm text-muted-foreground mt-4">Informações detalhadas sobre produtos perdendo buybox não disponíveis ou erro no cálculo.</p>
        )}
         {buyboxesLost === 0 && totalProductsListed > 0 && (
             <p className="text-sm text-green-600 font-medium mt-4">Ótimo! Este vendedor não está perdendo nenhum buybox para os produtos que lista.</p>
        )}

        <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
              Produtos Ganhando Buybox
            </h3>
            {productsWinningBuybox.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] hidden sm:table-cell">Imagem</TableHead>
                      <TableHead>Produto (SKU)</TableHead>
                      <TableHead className="text-right">Seu Preço</TableHead>
                      <TableHead className="text-right">Preço Vencedor</TableHead>
                      <TableHead>Vencedor do Buybox</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsWinningBuybox.map((item) => (
                      <TableRow key={`winning-${item.sku}`}>
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
                        <TableCell className="text-right font-semibold text-green-600">R$ {item.sellerPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">R$ {item.winningPrice.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[100px] truncate" title={item.winningSeller}>{item.winningSeller}</TableCell>
                        <TableCell className="text-right">{formatDifference(item.priceDifferenceToNext)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : buyboxesWon > 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                Este vendedor está ganhando {buyboxesWon} buybox(es), mas os detalhes dos produtos não estão disponíveis nesta visualização (possivelmente ganhos sem concorrência direta, onde são o único vendedor do SKU, ou erro no processamento dos detalhes).
              </p>
            ) : ( 
              <p className="text-sm text-red-600 font-medium mt-2">
                Este vendedor não está ganhando nenhum buybox atualmente.
              </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
