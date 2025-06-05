
"use client";

import * as React from 'react';
import type { Product, SellerPriceChangeSummary, SkuChangeFrequency } from '@/lib/types';
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

// interface SellerPriceChangeSummary { // Already in types
//   sellerName: string;
//   totalChangeInstances: number;
//   distinctSkusChanged: number;
// }

// interface SkuChangeFrequency { // Already in types
//   sku: string;
//   descricao: string;
//   imagem: string;
//   changeInstanceCount: number;
// }

const TOP_N_SKUS_TABLE = 10;
const TOP_N_SELLERS_CHART = 10;

const chartConfig = {
  totalChangeInstances: {
    label: "Total de Alterações",
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

  const { sellerSummaries, skuFrequencies, topSellersForChart, productsChangedBySeller } = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { sellerSummaries: [], skuFrequencies: [], topSellersForChart: [], productsChangedBySeller: {} };
    }

    const productsWithChange = allProducts.filter(p => p && p.change_price === true && p.loja && p.sku);

    const sellerMap: Record<string, { products: Product[], skus: Set<string> }> = {};
    productsWithChange.forEach(p => {
      if (p.loja) { 
        if (!sellerMap[p.loja]) {
          sellerMap[p.loja] = { products: [], skus: new Set() };
        }
        sellerMap[p.loja].products.push(p);
        if (p.sku) { 
          sellerMap[p.loja].skus.add(p.sku);
        }
      }
    });

    const calculatedSellerSummaries: SellerPriceChangeSummary[] = Object.entries(sellerMap)
      .map(([sellerName, data]) => ({
        sellerName,
        totalChangeInstances: data.products.length,
        distinctSkusChanged: data.skus.size,
      }))
      .sort((a, b) => b.totalChangeInstances - a.totalChangeInstances || a.sellerName.localeCompare(b.sellerName));

    const calculatedTopSellersForChart = [...calculatedSellerSummaries]
      .slice(0, TOP_N_SELLERS_CHART)
      .reverse(); 

    const skuMap: Record<string, Product[]> = {};
    productsWithChange.forEach(p => {
      if (p.sku) { 
        if (!skuMap[p.sku]) {
          skuMap[p.sku] = [];
        }
        skuMap[p.sku].push(p);
      }
    });

    const calculatedSkuFrequencies: SkuChangeFrequency[] = Object.entries(skuMap)
      .map(([sku, productsForThisSku]) => {
        let latestProduct: Product | null = null;
        if (productsForThisSku && productsForThisSku.length > 0) {
          const sortedProducts = [...productsForThisSku].sort((a, b) => {
            try {
                const dateA = a.data_hora ? parseISO(a.data_hora) : null;
                const dateB = b.data_hora ? parseISO(b.data_hora) : null;
                if (dateA && dateB) return compareDesc(dateA, dateB);
                if (dateA) return -1;
                if (dateB) return 1;
                return 0;
            } catch { return 0; }
          });
          latestProduct = sortedProducts[0] || null;
        }

        return {
          sku,
          descricao: latestProduct?.descricao || 'N/A',
          imagem: latestProduct?.imagem || '',
          changeInstanceCount: productsForThisSku ? productsForThisSku.length : 0,
        };
      })
      .sort((a, b) => b.changeInstanceCount - a.changeInstanceCount || a.sku.localeCompare(b.sku))
      .slice(0, TOP_N_SKUS_TABLE);

    const calculatedProductsChangedBySeller: Record<string, Product[]> = {};
    productsWithChange.forEach(p => {
        if (p.loja) { 
            if (!calculatedProductsChangedBySeller[p.loja]) {
                calculatedProductsChangedBySeller[p.loja] = [];
            }
            calculatedProductsChangedBySeller[p.loja].push(p);
        }
    });

    for (const seller in calculatedProductsChangedBySeller) {
        if (calculatedProductsChangedBySeller[seller]) {
            calculatedProductsChangedBySeller[seller].sort((a, b) => {
                try {
                    const dateA = a.data_hora ? parseISO(a.data_hora) : null;
                    const dateB = b.data_hora ? parseISO(b.data_hora) : null;

                    if (dateA && dateB) return compareDesc(dateA, dateB);
                    if (dateA) return -1;
                    if (dateB) return 1;
                    return (a.descricao || '').localeCompare(b.descricao || '');
                } catch {
                    return (a.descricao || '').localeCompare(b.descricao || '');
                }
            });
        }
    }

    return {
        sellerSummaries: calculatedSellerSummaries,
        skuFrequencies: calculatedSkuFrequencies,
        topSellersForChart: calculatedTopSellersForChart,
        productsChangedBySeller: calculatedProductsChangedBySeller
    };
  }, [allProducts]);


  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
              Top {TOP_N_SELLERS_CHART} Vendedores por Alterações de Preço
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
              Top {TOP_N_SKUS_TABLE} SKUs Sinalizados com Alteração de Preço
            </CardTitle>
            <CardDescription>Carregando dados dos SKUs com mais alterações de preço sinalizadas...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full rounded-md" />
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListTodo className="mr-2 h-5 w-5 text-primary" />
              Detalhes de Produtos Alterados por Vendedor
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

  const hasAnyChangeData = sellerSummaries.length > 0 || skuFrequencies.length > 0 || Object.keys(productsChangedBySeller).length > 0;

  if (!hasAnyChangeData && !isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Análise de Alterações de Preço
                </CardTitle>
                <CardDescription>
                    Não foram encontradas sinalizações de alteração de preço (baseado na flag 'change_price') nos dados atuais.
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
            Top {TOP_N_SELLERS_CHART} Vendedores por Contagem de Alterações de Preço
          </CardTitle>
          <CardDescription>
            Gráfico dos {TOP_N_SELLERS_CHART} vendedores com maior número de vezes que a flag 'change_price' foi detectada em seus produtos.
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
                      width={180} // Adjusted width for potentially longer names
                      interval={0}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="totalChangeInstances" fill="var(--color-totalChangeInstances)" radius={[0, 4, 4, 0]}>
                       <LabelList dataKey="totalChangeInstances" position="right" offset={8} className="fill-foreground" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum vendedor com alteração de preço (baseado na flag 'change_price') encontrado nos dados atuais para exibir no gráfico.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5 text-primary" />
            Top {TOP_N_SKUS_TABLE} SKUs Sinalizados com Alteração de Preço
          </CardTitle>
          <CardDescription>
            SKUs com o maior número de ocorrências da flag 'change_price' como verdadeira.
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
                    <TableHead className="text-right">Nº de Sinalizações de Alteração</TableHead>
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
                      <TableCell className="text-right">{skuItem.changeInstanceCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum SKU com alteração de preço sinalizada (baseado na flag 'change_price') encontrado nos dados atuais.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center">
                <ListTodo className="mr-2 h-5 w-5 text-primary" />
                Detalhes de Produtos Alterados por Vendedor
            </CardTitle>
            <CardDescription>
                Expanda cada vendedor para ver os produtos específicos para os quais a flag 'change_price' foi sinalizada.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {sellerSummaries.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                    {sellerSummaries.map((seller) => {
                        const changedProductsForThisSeller = productsChangedBySeller[seller.sellerName] || [];
                        return (
                            <AccordionItem value={`${seller.sellerName}-${seller.totalChangeInstances}-${seller.distinctSkusChanged}`} key={`accordion-seller-${seller.sellerName}-${seller.totalChangeInstances}-${seller.distinctSkusChanged}`}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex justify-between items-center w-full pr-2">
                                        <span className="font-medium text-left truncate" title={seller.sellerName}>
                                            {seller.sellerName}
                                        </span>
                                        <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
                                            {seller.totalChangeInstances} alteraç{seller.totalChangeInstances === 1 ? 'ão' : 'ões'} em {seller.distinctSkusChanged} SKU(s)
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {changedProductsForThisSeller.length > 0 ? (
                                        <div className="overflow-x-auto rounded-md border mt-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[60px] hidden sm:table-cell">Imagem</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Descrição</TableHead>
                                                        <TableHead>Marketplace</TableHead>
                                                        <TableHead className="text-right">Data da Sinalização</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {changedProductsForThisSeller.map((product, index) => (
                                                        <TableRow key={`${product.id || product.sku || `prod-${index}`}-${product.data_hora || Date.now()}-${Math.random()}`}>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <Image
                                                                    src={product.imagem || "https://placehold.co/50x50.png"}
                                                                    alt={product.descricao || 'Imagem do produto'}
                                                                    width={50}
                                                                    height={50}
                                                                    className="rounded"
                                                                    data-ai-hint="product item tiny"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-medium max-w-[150px] truncate" title={product.sku}>{product.sku}</TableCell>
                                                            <TableCell className="max-w-xs truncate" title={product.descricao}>{product.descricao}</TableCell>
                                                            <TableCell className="max-w-[150px] truncate" title={product.marketplace}>{product.marketplace}</TableCell>
                                                            <TableCell className="text-right text-xs text-muted-foreground">{formatDetailedTableDate(product.data_hora)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground py-2 px-4">Nenhum produto específico encontrado para este vendedor com a flag 'change_price'.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            ) : (
                <p className="text-muted-foreground text-center py-4">
                    Nenhum vendedor com alterações de preço registradas para detalhar.
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
