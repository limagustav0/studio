
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Product, BuyboxWinner, SellerAnalysisMetrics } from '@/lib/types'; 
import { fetchData, getUniqueSellers, calculateBuyboxWins, analyzeSellerPerformance } from '@/lib/data';
import { AppHeader } from '@/components/AppHeader';
import { BuyboxWinnersDisplay } from '@/components/BuyboxWinnersDisplay';
import { SellerPerformanceDashboard } from '@/components/SellerPerformanceDashboard';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { BarChartBig } from 'lucide-react'; // Icon for the remaining tab

const NO_SELLER_SELECTED_VALUE = "--none--";

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("analysis"); // Default to analysis tab
  
  const [uniqueSellers, setUniqueSellers] = useState<string[]>([]);
  const [buyboxWinners, setBuyboxWinners] = useState<BuyboxWinner[]>([]);
  const [focusedSeller, setFocusedSeller] = useState<string | null>(null); 
  const [sellerPerformanceData, setSellerPerformanceData] = useState<SellerAnalysisMetrics | null>(null);
  const [isSellerPerformanceLoading, setIsSellerPerformanceLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setIsSellerPerformanceLoading(true); 
      try {
        const products = await fetchData();
        setAllProducts(products);
        const sellers = getUniqueSellers(products);
        setUniqueSellers(sellers);
        setBuyboxWinners(calculateBuyboxWins(products));
        
        if (focusedSeller && products.length > 0) {
          const performanceData = analyzeSellerPerformance(products, focusedSeller);
          setSellerPerformanceData(performanceData);
        }

      } catch (error) {
        console.error("Failed to load products on page:", error);
        let description = "Não foi possível buscar os dados dos produtos. Por favor, tente novamente mais tarde.";
        if (error instanceof Error && error.message) {
          if (error.message.toLowerCase().includes('failed to fetch')) {
            description = "Falha ao buscar dados da API. Isso pode ser um problema de rede, CORS, ou o servidor da API pode estar indisponível. Verifique sua conexão e a disponibilidade da API, e tente novamente.";
          } else {
            description = `Erro: ${error.message}. Verifique os detalhes e tente mais tarde.`;
          }
        }
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Dados",
          description: description,
        });
      } finally {
        setIsLoading(false);
        setIsSellerPerformanceLoading(false); 
      }
    }
    loadData();
  }, [toast]);

  useEffect(() => {
    if (focusedSeller && allProducts.length > 0) {
      setIsSellerPerformanceLoading(true);
      setTimeout(() => {
        const performanceData = analyzeSellerPerformance(allProducts, focusedSeller);
        setSellerPerformanceData(performanceData);
        setIsSellerPerformanceLoading(false);
      }, 50); 
    } else if (!focusedSeller) { 
      setSellerPerformanceData(null);
      setIsSellerPerformanceLoading(false);
    }
  }, [focusedSeller, allProducts]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6 sticky top-[calc(var(--header-height,68px)+1rem)] bg-background z-40 py-2 shadow-md gap-2 rounded-lg">
            <TabsTrigger value="analysis" className="px-4 py-2.5 text-sm sm:text-base font-medium flex items-center justify-center gap-2 data-[state=active]:shadow-lg">
              <BarChartBig className="h-5 w-5" />
              Análise Detalhada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-8">
            <section aria-labelledby="seller-performance-title" className="space-y-6">
                <Card className="shadow-lg p-2 sm:p-6">
                    <CardHeader className="pb-4 px-2 sm:px-6">
                        <CardTitle>Análise de Desempenho por Vendedor</CardTitle>
                        <CardDescription>Selecione um vendedor para ver suas métricas detalhadas de buybox e produtos.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <Label htmlFor="focused-seller-filter" className="text-sm font-medium">Selecionar Vendedor para Análise Detalhada</Label>
                        <Select 
                            value={focusedSeller || NO_SELLER_SELECTED_VALUE} 
                            onValueChange={(value) => setFocusedSeller(value === NO_SELLER_SELECTED_VALUE ? null : value)}
                        >
                            <SelectTrigger id="focused-seller-filter" className="mt-1">
                            <SelectValue placeholder="Selecione um vendedor..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value={NO_SELLER_SELECTED_VALUE}>Nenhum (Limpar Seleção)</SelectItem>
                            {uniqueSellers.map(seller => <SelectItem key={`focused-${seller}`} value={seller}>{seller}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <SellerPerformanceDashboard 
                    sellerMetrics={sellerPerformanceData} 
                    isLoading={isSellerPerformanceLoading || (isLoading && !allProducts.length)} 
                    selectedSellerName={focusedSeller}
                />
            </section>
            
            <Separator className="my-8" /> 

            <section aria-labelledby="buybox-analysis-title">
              <h2 id="buybox-analysis-title" className="sr-only">Análise de Buybox Global</h2>
              <BuyboxWinnersDisplay buyboxWinners={buyboxWinners} isLoading={isLoading && buyboxWinners.length === 0} />
            </section>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="bg-card text-card-foreground py-6 text-center text-sm border-t">
        <p>&copy; {new Date().getFullYear()} Painel PriceWise. Todos os direitos reservados.</p>
      </footer>
      <Toaster />
    </div>
  );
}
