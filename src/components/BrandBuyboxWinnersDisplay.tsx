
import type { BrandBuyboxWinSummary, MarketplaceBuyboxWinSummary } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tags, Globe } from 'lucide-react';
import * as React from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface BrandBuyboxWinnersDisplayProps {
  brandBuyboxWins: BrandBuyboxWinSummary[];
  marketplaceBuyboxWins: MarketplaceBuyboxWinSummary[];
  isLoading: boolean;
  context?: 'seller' | 'global'; // To adjust titles if needed
}

const TOP_N_BRANDS_PIE = 5;
const TOP_N_BRANDS_BAR = 10;
const TOP_N_MARKETPLACES_BAR = 3; 

const COLORS_PIE = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(60 90% 50%)", "hsl(var(--chart-4))", "hsl(25 95% 53%)",
  "hsl(var(--chart-5))", "hsl(150 85% 45%)", "hsl(200 90% 55%)",
  "hsl(330 90% 65%)", "hsl(270 80% 60%)", "hsl(90 75% 50%)" 
];

const MARKETPLACE_CHART_COLOR = "hsl(var(--chart-1))"; 

export function BrandBuyboxWinnersDisplay({ brandBuyboxWins, marketplaceBuyboxWins, isLoading, context = 'global' }: BrandBuyboxWinnersDisplayProps) {
  
  const processedPieData = React.useMemo(() => {
    if (!brandBuyboxWins || brandBuyboxWins.length === 0) return [];
    const sortedWins = [...brandBuyboxWins].sort((a,b) => b.wins - a.wins);
    if (sortedWins.length <= TOP_N_BRANDS_PIE) {
      return sortedWins.map(item => ({ ...item, name: item.marca, value: item.wins }));
    }
    const topN = sortedWins.slice(0, TOP_N_BRANDS_PIE);
    const othersWins = sortedWins.slice(TOP_N_BRANDS_PIE).reduce((sum, item) => sum + item.wins, 0);
    if (othersWins > 0) {
      return [...topN.map(item => ({ ...item, name: item.marca, value: item.wins })), { marca: "Outras", wins: othersWins, name: "Outras", value: othersWins }];
    }
    return topN.map(item => ({ ...item, name: item.marca, value: item.wins }));
  }, [brandBuyboxWins]);

  const pieChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    processedPieData.forEach((item, index) => {
      const sanitizedKey = item.marca.replace(/[^a-zA-Z0-9_]/g, '_'); 
      config[sanitizedKey] = {
        label: item.marca,
        color: COLORS_PIE[index % COLORS_PIE.length],
      };
    });
    return config;
  }, [processedPieData]);

  const brandBarChartData = React.useMemo(() => {
    if (!brandBuyboxWins) return [];
    return [...brandBuyboxWins].sort((a,b) => b.wins - a.wins).slice(0, TOP_N_BRANDS_BAR).reverse();
  }, [brandBuyboxWins]);

  const brandBarChartConfig = {
    wins: { label: "Ganhos de Buybox (Marca)", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const marketplaceBarChartData = React.useMemo(() => {
    if (!marketplaceBuyboxWins) return [];
    return [...marketplaceBuyboxWins].sort((a,b) => b.wins - a.wins).slice(0, TOP_N_MARKETPLACES_BAR).reverse();
  }, [marketplaceBuyboxWins]);

  const marketplaceBarChartConfig = {
    wins: { label: `Ganhos de Buybox (${context === 'seller' ? 'Vendedor' : 'Global'})`, color: MARKETPLACE_CHART_COLOR },
  } satisfies ChartConfig;

  const cardTitle = context === 'seller' 
    ? "Ganhos de Buybox do Vendedor: Marcas e Marketplaces" 
    : "Análise de Ganhos de Buybox: Marcas e Marketplaces (Global)";
  
  const cardDescription = context === 'seller'
    ? "Visão gráfica das marcas e marketplaces onde o(s) vendedor(es) selecionado(s) mais venceram o buybox."
    : "Visão gráfica das marcas e marketplaces cujos produtos (SKUs únicos) mais venceram o buybox (Global).";


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <Tags className="mr-1 h-5 w-5 text-primary" />
            <Globe className="ml-1 mr-2 h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-3/4 mb-1" />
          </div>
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
          <Skeleton className="h-[250px] w-full mt-8" />
        </CardContent>
      </Card>
    );
  }
  
  const noBrandData = !brandBuyboxWins || brandBuyboxWins.length === 0;
  const noMarketplaceData = !marketplaceBuyboxWins || marketplaceBuyboxWins.length === 0;

  if (noBrandData && noMarketplaceData && context === 'seller') {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><Tags className="mr-1 h-5 w-5 text-primary" />/<Globe className="ml-1 mr-2 h-5 w-5 text-primary" />{cardTitle}</CardTitle>
                <CardDescription>{cardDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-4">
                Nenhuma informação de buybox por marca ou marketplace disponível para o(s) vendedor(es) selecionado(s).
                Verifique se há mapeamentos de SKU para Marca ou se o vendedor possui ganhos de buybox.
                </p>
            </CardContent>
        </Card>
    );
  }
   if (noBrandData && noMarketplaceData && context === 'global') {
    return null; 
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Tags className="mr-1 h-5 w-5 text-primary" />/<Globe className="ml-1 mr-2 h-5 w-5 text-primary" />{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {(noBrandData && noMarketplaceData && context === 'global') ? ( 
            <CardDescription>Nenhuma informação de buybox por marca ou marketplace disponível com os filtros atuais ou mapeamentos.</CardDescription>
        ) : (
        <div className="space-y-8">
          {brandBuyboxWins.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Distribuição por Marca (Top {TOP_N_BRANDS_PIE}{brandBuyboxWins.length > TOP_N_BRANDS_PIE && processedPieData.find(p=>p.marca === "Outras") ? " + Outras" : ""})</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] sm:h-[350px]">
                    <ChartContainer config={pieChartConfig} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <ChartTooltip 
                            cursor={{ fill: "hsl(var(--muted))" }}
                            content={<ChartTooltipContent hideLabel nameKey="name" />} 
                          />
                          <Pie 
                            data={processedPieData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius="80%" 
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              if ((percent * 100) < 5) return null; 
                              return (
                                <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                  {`${processedPieData[index].name} (${(percent * 100).toFixed(0)}%)`}
                                </text>
                              );
                            }}
                          >
                            {processedPieData.map((entry, index) => {
                              const sanitizedKey = entry.marca.replace(/[^a-zA-Z0-9_]/g, '_');
                              return (
                                <Cell key={`cell-brand-pie-${index}`} fill={`var(--color-${sanitizedKey}, ${COLORS_PIE[index % COLORS_PIE.length]})`} />
                              )
                            })}
                          </Pie>
                          <Legend 
                            iconSize={10} 
                            wrapperStyle={{fontSize: "12px"}}
                            formatter={(value, entry) => {
                               const originalEntry = processedPieData.find(p => p.name === value);
                               return (
                                  <span style={{ color: "hsl(var(--foreground))" }}>
                                    {originalEntry ? `${value} (${originalEntry.value})` : value}
                                  </span>
                                );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Top {brandBarChartData.length > TOP_N_BRANDS_BAR ? TOP_N_BRANDS_BAR : brandBarChartData.length} Marcas por Ganhos</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] sm:h-[350px]">
                    <ChartContainer config={brandBarChartConfig} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={brandBarChartData} layout="vertical" margin={{ right: 35, left: 20, top: 5, bottom: 5 }}>
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis 
                            dataKey="marca" 
                            type="category" 
                            width={130} 
                            interval={0} 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={12}
                            tickFormatter={(value) => value.length > 15 ? `${value.substring(0,13)}...` : value}
                          />
                          <ChartTooltip
                            cursor={{ fill: "hsl(var(--muted))" }}
                            content={<ChartTooltipContent indicator="dot" />}
                          />
                          <Bar dataKey="wins" fill="var(--color-wins)" radius={[0, 4, 4, 0]} barSize={brandBarChartData.length < 5 ? 40 : undefined}>
                             <LabelList dataKey="wins" position="right" offset={8} className="fill-foreground" fontSize={12} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          {(!isLoading && noBrandData && context === 'global') && (
              <CardDescription className="text-center py-4">Nenhuma informação de buybox por marca para os filtros e mapeamentos atuais.</CardDescription>
          )}
          {(!isLoading && noBrandData && context === 'seller') &&
            <CardDescription className="text-center py-4">
                Nenhuma informação de ganhos de buybox por marca para o(s) vendedor(es) selecionado(s).
                Verifique se há mapeamentos de SKU para Marca válidos ou se o vendedor tem ganhos de buybox.
            </CardDescription>
          }


          {marketplaceBuyboxWins.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  Top {marketplaceBarChartData.length > TOP_N_MARKETPLACES_BAR ? TOP_N_MARKETPLACES_BAR : marketplaceBarChartData.length} Marketplaces por Ganhos
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]"> 
                <ChartContainer config={marketplaceBarChartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketplaceBarChartData} layout="vertical" margin={{ right: 35, left: 20, top: 5, bottom: 5 }}>
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickCount={3} />
                      <YAxis 
                        dataKey="marketplace" 
                        type="category" 
                        width={130} 
                        interval={0} 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0,13)}...` : value}
                      />
                      <ChartTooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="wins" fill="var(--color-wins, hsl(var(--chart-1)))" radius={[0, 4, 4, 0]} barSize={marketplaceBarChartData.length < 4 ? 35 : undefined}>
                        <LabelList dataKey="wins" position="right" offset={8} className="fill-foreground" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
           {(!isLoading && noMarketplaceData && context === 'global') && (
              <CardDescription className="text-center py-4 mt-4">Nenhuma informação de buybox por marketplace para os filtros atuais.</CardDescription>
          )}
           {(!isLoading && noMarketplaceData && context === 'seller') &&
            <CardDescription className="text-center py-4 mt-4">
                Nenhuma informação de ganhos de buybox por marketplace para o(s) vendedor(es) selecionado(s).
            </CardDescription>
          }
        </div>
        )}
      </CardContent>
    </Card>
  );
}

