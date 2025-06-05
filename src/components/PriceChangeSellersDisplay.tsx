
"use client";

import * as React from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Package, TrendingUp, BarChartHorizontalBig } from 'lucide-react';
import Image from 'next/image';
import { parseISO, compareDesc } from 'date-fns';
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

interface PriceChangeSellersDisplayProps {
  allProducts: Product[];
  isLoading: boolean;
}

interface SellerPriceChangeSummary {
  sellerName: string;
  totalChangeInstances: number;
  distinctSkusChanged: number;
}

interface SkuChangeFrequency {
  sku: string;
  descricao: string;
  imagem: string;
  changeInstanceCount: number;
}

const TOP_N_SKUS_TABLE = 10;
const TOP_N_SELLERS_CHART = 10;

const chartConfig = {
  totalChangeInstances: {
    label: "Total de Alterações",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function PriceChangeSellersDisplay({ allProducts, isLoading }: PriceChangeSellersDisplayProps) {
  const { sellerSummaries, skuFrequencies, topSellersForChart } = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { sellerSummaries: [], skuFrequencies: [], topSellersForChart: [] };
    }

    const productsWithChange = allProducts.filter(p => p.change_price === true);

    // Calculate seller summaries
    const sellerMap: Record<string, { products: Product[], skus: Set<string> }> = {};
    productsWithChange.forEach(p => {
      if (!p.loja) return;
      if (!sellerMap[p.loja]) {
        sellerMap[p.loja] = { products: [], skus: new Set() };
      }
      sellerMap[p.loja].products.push(p);
      sellerMap[p.loja].skus.add(p.sku);
    });

    const calculatedSellerSummaries: SellerPriceChangeSummary[] = Object.entries(sellerMap)
      .map(([sellerName, data]) => ({
        sellerName,
        totalChangeInstances: data.products.length,
        distinctSkusChanged: data.skus.size,
      }))
      .sort((a, b) => b.totalChangeInstances - a.totalChangeInstances || a.sellerName.localeCompare(b.sellerName));
    
    const calculatedTopSellersForChart = [...calculatedSellerSummaries] // Create a copy for chart data processing
      .slice(0, TOP_N_SELLERS_CHART)
      .reverse(); // Reverse for horizontal bar chart (bottom to top display)


    // Calculate SKU frequencies
    const skuMap: Record<string, Product[]> = {};
    productsWithChange.forEach(p => {
      if (!p.sku) return;
      if (!skuMap[p.sku]) {
        skuMap[p.sku] = [];
      }
      skuMap[p.sku].push(p);
    });

    const calculatedSkuFrequencies: SkuChangeFrequency[] = Object.entries(skuMap)
      .map(([sku, products]) => {
        const sortedProducts = [...products].sort((a,b) => {
            try { return compareDesc(parseISO(a.data_hora), parseISO(b.data_hora))} catch { return 0; }
        });
        const latestProduct = sortedProducts[0] || products[0];
        return {
          sku,
          descricao: latestProduct.descricao,
          imagem: latestProduct.imagem,
          changeInstanceCount: products.length,
        };
      })
      .sort((a, b) => b.changeInstanceCount - a.changeInstanceCount || a.sku.localeCompare(b.sku))
      .slice(0, TOP_N_SKUS_TABLE);

    return { sellerSummaries: calculatedSellerSummaries, skuFrequencies: calculatedSkuFrequencies, topSellersForChart: calculatedTopSellersForChart };
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
              SKUs Mais Frequentemente Alterados
            </CardTitle>
            <CardDescription>Carregando dados dos SKUs com mais alterações de preço sinalizadas...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
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
            <div className="h-[400px] w-full"> {/* Adjust height as needed */}
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topSellersForChart}
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }} // Adjust left margin for seller names
                  >
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      dataKey="sellerName"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                      width={150} // Ensure enough space for YAxis labels
                      interval={0} // Show all labels
                    />
                    <Tooltip
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
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
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
                    <TableRow key={skuItem.sku}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          src={skuItem.imagem || "https://placehold.co/50x50.png"}
                          alt={skuItem.descricao}
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
    </div>
  );
}

    