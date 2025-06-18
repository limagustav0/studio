
import type { BrandBuyboxWinSummary } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tags } from 'lucide-react';
import * as React from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface BrandBuyboxWinnersDisplayProps {
  brandBuyboxWins: BrandBuyboxWinSummary[];
  isLoading: boolean;
}

const TOP_N_BRANDS_PIE = 5;
const TOP_N_BRANDS_BAR = 10;

const COLORS_PIE = [
  "hsl(var(--chart-1))",   // Bright Cyan
  "hsl(var(--chart-2))",   // Bright Magenta
  "hsl(var(--chart-3))",   // Darker Cyan
  "hsl(60 90% 50%)",      // Bright Yellow
  "hsl(var(--chart-4))",   // Darker Magenta
  "hsl(25 95% 53%)",      // Bright Orange
  "hsl(var(--chart-5))",   // Muted Gray-Blue
  "hsl(150 85% 45%)",     // Bright Green
  "hsl(200 90% 55%)",     // Bright Blue
  "hsl(330 90% 65%)",     // Bright Pink
];


export function BrandBuyboxWinnersDisplay({ brandBuyboxWins, isLoading }: BrandBuyboxWinnersDisplayProps) {
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
    wins: {
      label: "Ganhos de Buybox (Marca)",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <Tags className="mr-2 h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-1/2 mb-1" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const noBrandData = !brandBuyboxWins || brandBuyboxWins.length === 0;

  if (noBrandData) {
    // This state is handled by the parent component in page.tsx for overall "no brand mapping"
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Tags className="mr-2 h-5 w-5 text-primary" />Vencedores de Buybox por Marca</CardTitle>
        <CardDescription>
          Visão gráfica das marcas cujos produtos (SKUs únicos) mais venceram o buybox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {brandBuyboxWins.length > 0 ? (
          <div className="space-y-8">
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
                                <Cell key={`cell-${index}`} fill={`var(--color-${sanitizedKey}, ${COLORS_PIE[index % COLORS_PIE.length]})`} />
                              )
                            })}
                          </Pie>
                          <Legend 
                            iconSize={10} 
                            wrapperStyle={{fontSize: "12px", fill: "hsl(var(--foreground))"}}
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
                    <CardTitle className="text-base sm:text-lg">Top {brandBarChartData.length} Marcas por Ganhos</CardTitle>
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
          </div>
        ) : (
          <CardDescription>Nenhuma informação de buybox por marca disponível com os filtros atuais.</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
