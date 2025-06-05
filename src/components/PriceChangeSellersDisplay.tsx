
"use client";

import * as React from 'react';
import type { Product, SellerPriceChangeSummary, SkuChangeFrequency, AggregatedProductChangeDetail } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, TrendingUp, BarChartHorizontalBig, ListTodo } from 'lucide-react';
import Image from 'next/image';
import { parseISO, compareDesc, format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PriceChangeSellersDisplayProps {
  allProducts: Product[];
  isLoading: boolean;
}

const TOP_N_SKUS_TABLE = 10;
const TOP_N_SELLERS_CHART = 10;

const chartConfig = {
  totalChangeSum: { // Renamed from totalChangeInstances
    label: "Total de Alterações (Soma)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const formatDetailedTableDate = (isoDateString: string | null | undefined) => {
  if (!isoDateString) return 'N/A';
  try {
    const parsedDate = parseISO(isoDateString);
    return formatDate(parsedDate, "dd/MM/yy HH:mm", { locale: ptBR });
  } catch (e) {
    console.warn("Failed to format detailed table date time:", e, "Input:", isoDateString);
    return 'Inválida';
  }
};

export function PriceChangeSellersDisplay({ allProducts, isLoading }: PriceChangeSellersDisplayProps) {

  const {
    sellerSummaries,
    skuFrequencies,
    topSellersForChart,
    productDetailsBySeller,
  } = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { sellerSummaries: [], skuFrequencies: [], topSellersForChart: [], productDetailsBySeller: {} };
    }

    const productsWithAnyChange = allProducts.filter(p => p && (p.change_price || 0) > 0 && p.loja && p.sku);

    // 1. Calculate Seller Summaries (for chart)
    const sellerDataMap: Record<string, { totalChangeSum: number, skus: Set<string> }> = {};
    productsWithAnyChange.forEach(p => {
      if (p.loja) {
        if (!sellerDataMap[p.loja]) {
          sellerDataMap[p.loja] = { totalChangeSum: 0, skus: new Set() };
        }
        sellerDataMap[p.loja].totalChangeSum += (p.change_price || 0);
        if (p.sku) {
            sellerDataMap[p.loja].skus.add(p.sku);
        }
      }
    });

    const calculatedSellerSummaries: SellerPriceChangeSummary[] = Object.entries(sellerDataMap)
      .map(([sellerName, data]) => ({
        sellerName,
        totalChangeSum: data.totalChangeSum,
        distinctSkusChangedCount: data.skus.size,
      }))
      .sort((a, b) => b.totalChangeSum - a.totalChangeSum || a.sellerName.localeCompare(b.sellerName));

    const calculatedTopSellersForChart = [...calculatedSellerSummaries]
      .slice(0, TOP_N_SELLERS_CHART)
      .reverse();

    // 2. Calculate SKU Frequencies (for Top SKUs table)
    const skuDataMap: Record<string, { products: Product[], totalChangeSum: number }> = {};
    productsWithAnyChange.forEach(p => {
      if (p.sku) {
        if (!skuDataMap[p.sku]) {
          skuDataMap[p.sku] = { products: [], totalChangeSum: 0 };
        }
        skuDataMap[p.sku].products.push(p);
        skuDataMap[p.sku].totalChangeSum += (p.change_price || 0);
      }
    });

    const calculatedSkuFrequencies: SkuChangeFrequency[] = Object.entries(skuDataMap)
      .map(([sku, data]) => {
        let latestProduct: Product | null = null;
        if (data.products.length > 0) {
          const sortedProducts = [...data.products].sort((a, b) => {
            try {
              if (!a.data_hora && !b.data_hora) return 0;
              if (!a.data_hora) return 1;
              if (!b.data_hora) return -1;
              return compareDesc(parseISO(a.data_hora), parseISO(b.data_hora));
            } catch { return 0; }
          });
          latestProduct = sortedProducts[0] || null;
        }
        return {
          sku,
          descricao: latestProduct?.descricao || 'N/A',
          imagem: latestProduct?.imagem || '',
          totalChangeSum: data.totalChangeSum,
        };
      })
      .sort((a, b) => b.totalChangeSum - a.totalChangeSum || a.sku.localeCompare(b.sku))
      .slice(0, TOP_N_SKUS_TABLE);

    // 3. Calculate Aggregated Product Details by Seller (for Accordion)
    const calculatedProductDetailsBySeller: Record<string, AggregatedProductChangeDetail[]> = {};
    const sellersWithChanges = new Set(productsWithAnyChange.map(p => p.loja));

    sellersWithChanges.forEach(sellerName => {
      if (!sellerName) return;
      const productsForThisSeller = productsWithAnyChange.filter(p => p.loja === sellerName);
      const groupedBySkuAndMarketplace: Record<string, {
        products: Product[],
        totalChangesSum: number,
        latestProduct: Product | null
      }> = {};

      productsForThisSeller.forEach(p => {
        if (!p.sku || !p.marketplace) return;
        const key = `${p.sku}|${p.marketplace}`;
        if (!groupedBySkuAndMarketplace[key]) {
          groupedBySkuAndMarketplace[key] = { products: [], totalChangesSum: 0, latestProduct: null };
        }
        groupedBySkuAndMarketplace[key].products.push(p);
        groupedBySkuAndMarketplace[key].totalChangesSum += (p.change_price || 0);

        // Determine latest product for this group
        const currentLatest = groupedBySkuAndMarketplace[key].latestProduct;
        if (!currentLatest || (p.data_hora && currentLatest.data_hora && compareDesc(parseISO(p.data_hora), parseISO(currentLatest.data_hora)) < 0)) {
             try {
                if (p.data_hora) parseISO(p.data_hora); // validate date
                groupedBySkuAndMarketplace[key].latestProduct = p;
            } catch (e) {
                // if date is invalid, don't update latestProduct based on this one
            }
        } else if (p.data_hora && !currentLatest?.data_hora) { // If current latest has no date but this one does
             try {
                if (p.data_hora) parseISO(p.data_hora); // validate date
                groupedBySkuAndMarketplace[key].latestProduct = p;
            } catch (e) { /* ignore */ }
        }


      });

      calculatedProductDetailsBySeller[sellerName] = Object.entries(groupedBySkuAndMarketplace)
        .map(([key, data]) => {
          const [sku, marketplace] = key.split('|');
          const latestP = data.latestProduct;
          return {
            sku: sku || 'N/A',
            marketplace: marketplace || 'N/A',
            descricao: latestP?.descricao || 'N/A',
            imagem: latestP?.imagem || '',
            totalChangesSum: data.totalChangesSum,
            latestChangeDate: latestP?.data_hora || null,
          };
        })
        .sort((a,b) => b.totalChangesSum - a.totalChangesSum || a.sku.localeCompare(b.sku));
    });


    return {
        sellerSummaries: calculatedSellerSummaries,
        skuFrequencies: calculatedSkuFrequencies,
        topSellersForChart: calculatedTopSellersForChart,
        productDetailsBySeller: calculatedProductDetailsBySeller,
    };
  }, [allProducts]);


  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
              Top {TOP_N_SELLERS_CHART} Vendedores por Soma de Alterações de Preço
            </CardTitle>
            <CardDescription>Carregando dados dos vendedores que mais alteraram preços...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full rounded-md" />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" />
              Top {TOP_N_SKUS_TABLE} SKUs por Soma de Alterações de Preço
            </CardTitle>
            <CardDescription>Carregando dados dos SKUs com maior soma de alterações de preço...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full rounded-md" />
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListTodo className="mr-2 h-5 w-5 text-primary" />
              Detalhes de Produtos Alterados por Vendedor (Soma)
            </CardTitle>
            <CardDescription>Carregando detalhes dos produtos...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAnyChangeData = sellerSummaries.length > 0 || skuFrequencies.length > 0 || Object.keys(productDetailsBySeller).length > 0;

  if (!hasAnyChangeData && !isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Análise de Alterações de Preço
                </CardTitle>
                <CardDescription>
                    Não foram encontradas alterações de preço (campo 'change_price' com valor maior que zero) nos dados atuais.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-4">
                    Nenhum dado para exibir.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
            Top {TOP_N_SELLERS_CHART} Vendedores por Soma de Alterações de Preço
          </CardTitle>
          <CardDescription>
            Gráfico dos {TOP_N_SELLERS_CHART} vendedores com maior soma de contagens do campo 'change_price' em seus produtos.
            {sellerSummaries.length > TOP_N_SELLERS_CHART && (
                ` (Exibindo top ${TOP_N_SELLERS_CHART} de ${sellerSummaries.length} vendedores).`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topSellersForChart.length > 0 ? (
            <div className="h-[400px] w-full">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topSellersForChart}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      dataKey="sellerName"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => typeof value === 'string' && value.length > 25 ? `${value.substring(0, 22)}...` : value}
                      width={180}
                      interval={0}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="totalChangeSum" fill="var(--color-totalChangeSum)" radius={[0, 4, 4, 0]}>
                       <LabelList dataKey="totalChangeSum" position="right" offset={8} className="fill-foreground" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum vendedor com alteração de preço (baseado na soma de 'change_price') encontrado para exibir no gráfico.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5 text-primary" />
            Top {TOP_N_SKUS_TABLE} SKUs por Soma de Alterações de Preço
          </CardTitle>
          <CardDescription>
            SKUs com a maior soma de contagens do campo 'change_price'.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skuFrequencies.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] hidden sm:table-cell">Imagem</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Soma de Alterações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skuFrequencies.map(skuItem => (
                    <TableRow key={`sku-freq-${skuItem.sku}`}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          src={skuItem.imagem || "https://placehold.co/50x50.png"}
                          alt={skuItem.descricao || 'Imagem do produto'}
                          width={50}
                          height={50}
                          className="rounded"
                          data-ai-hint="product item small"
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate" title={skuItem.sku}>{skuItem.sku}</TableCell>
                      <TableCell className="max-w-xs truncate" title={skuItem.descricao}>{skuItem.descricao}</TableCell>
                      <TableCell className="text-right">{skuItem.totalChangeSum}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum SKU com alteração de preço (baseado na soma de 'change_price') encontrado.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center">
                <ListTodo className="mr-2 h-5 w-5 text-primary" />
                Detalhes Agregados de Alterações por Vendedor
            </CardTitle>
            <CardDescription>
                Expanda cada vendedor para ver a soma de alterações de preço por produto (SKU + Marketplace).
            </CardDescription>
        </CardHeader>
        <CardContent>
            {sellerSummaries.filter(s => s.totalChangeSum > 0).length > 0 ? (
                <Accordion type="multiple" className="w-full">
                    {sellerSummaries.filter(s => s.totalChangeSum > 0).map((seller) => {
                        const aggregatedDetailsForSeller = productDetailsBySeller[seller.sellerName] || [];
                        const uniqueKey = `${seller.sellerName}-${seller.totalChangeSum}-${seller.distinctSkusChangedCount}`;
                        return (
                            <AccordionItem value={uniqueKey} key={uniqueKey}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex justify-between items-center w-full pr-2">
                                        <span className="font-medium text-left truncate" title={seller.sellerName}>
                                            {seller.sellerName}
                                        </span>
                                        <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
                                            {seller.totalChangeSum} alteraç{seller.totalChangeSum === 1 ? 'ão' : 'ões'} em {seller.distinctSkusChangedCount} SKU(s)
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {aggregatedDetailsForSeller.length > 0 ? (
                                        <div className="overflow-x-auto rounded-md border mt-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[60px] hidden sm:table-cell">Imagem</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Descrição</TableHead>
                                                        <TableHead>Marketplace</TableHead>
                                                        <TableHead className="text-right">Total de Alterações</TableHead>
                                                        <TableHead className="text-right">Última Alteração</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {aggregatedDetailsForSeller.map((detail, index) => (
                                                        <TableRow key={`${seller.sellerName}-${detail.sku}-${detail.marketplace}-${index}`}>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <Image
                                                                    src={detail.imagem || "https://placehold.co/50x50.png"}
                                                                    alt={detail.descricao || 'Imagem do produto'}
                                                                    width={50}
                                                                    height={50}
                                                                    className="rounded"
                                                                    data-ai-hint="product item tiny"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-medium max-w-[150px] truncate" title={detail.sku}>{detail.sku}</TableCell>
                                                            <TableCell className="max-w-xs truncate" title={detail.descricao}>{detail.descricao}</TableCell>
                                                            <TableCell className="max-w-[150px] truncate" title={detail.marketplace}>{detail.marketplace}</TableCell>
                                                            <TableCell className="text-right font-semibold">{detail.totalChangesSum}</TableCell>
                                                            <TableCell className="text-right text-xs text-muted-foreground">{formatDetailedTableDate(detail.latestChangeDate)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground py-2 px-4">Nenhum produto com alteração de preço ('change_price' > 0) encontrado para este vendedor.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            ) : (
                <p className="text-muted-foreground text-center py-4">
                    Nenhum vendedor com alterações de preço (soma de 'change_price' > 0) para detalhar.
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
