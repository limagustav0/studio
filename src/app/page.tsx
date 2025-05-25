
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';

const NO_SELLER_SELECTED_VALUE = "--none--";
const DEFAULT_SELLER_FOCUS = "HAIRPRO";

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For general page data loading
  const { toast } = useToast();
  
  const [uniqueSellers, setUniqueSellers] = useState<string[]>([]);
  const [buyboxWinners, setBuyboxWinners] = useState<BuyboxWinner[]>([]);
  const [focusedSeller, setFocusedSeller] = useState<string | null>(null); 
  const [sellerPerformanceData, setSellerPerformanceData] = useState<SellerAnalysisMetrics | null>(null);
  const [isSellerPerformanceLoading, setIsSellerPerformanceLoading] = useState<boolean>(false); // Specifically for seller performance section

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const products = await fetchData();
        setAllProducts(products);
        const sellers = getUniqueSellers(products);
        setUniqueSellers(sellers);
        setBuyboxWinners(calculateBuyboxWins(products));
        
        // Set default focused seller if it exists in the list
        if (sellers.includes(DEFAULT_SELLER_FOCUS)) {
          setFocusedSeller(DEFAULT_SELLER_FOCUS);
        } else {
          // If default is not found, ensure no seller is focused initially
          // or if a previously focused seller (like default) is no longer valid.
          setFocusedSeller(null); 
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
        // Clear data on error to prevent displaying stale info
        setAllProducts([]);
        setUniqueSellers([]);
        setBuyboxWinners([]);
        setFocusedSeller(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // `toast` is stable, so this effect runs primarily on mount.

  useEffect(() => {
    // This effect handles loading seller-specific performance data
    // whenever `focusedSeller` or `allProducts` changes.
    if (focusedSeller && allProducts.length > 0) {
      setIsSellerPerformanceLoading(true);
      // Using a small timeout can help UI responsiveness if analysis is heavy,
      // but can be removed if analysis is quick.
      setTimeout(() => {
        const performanceData = analyzeSellerPerformance(allProducts, focusedSeller);
        setSellerPerformanceData(performanceData);
        setIsSellerPerformanceLoading(false);
      }, 50); 
    } else if (!focusedSeller) { 
      // If no seller is focused (or selection is cleared), clear performance data
      setSellerPerformanceData(null);
      setIsSellerPerformanceLoading(false); // Ensure loading state is false
    }
  }, [focusedSeller, allProducts]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-8">
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
                  isLoading={isSellerPerformanceLoading || (isLoading && !allProducts.length)} // Show loading if seller data is loading OR initial page data is loading
                  selectedSellerName={focusedSeller}
              />
          </section>
          
          <Separator className="my-8" /> 

          <section aria-labelledby="buybox-analysis-title">
            <h2 id="buybox-analysis-title" className="sr-only">Análise de Buybox Global</h2>
            <BuyboxWinnersDisplay buyboxWinners={buyboxWinners} isLoading={isLoading && buyboxWinners.length === 0} />
          </section>
        </div>
      </main>
      <footer className="bg-card text-card-foreground py-6 text-center text-sm border-t">
        <p>&copy; {new Date().getFullYear()} Monitoramento KAMI PRICING. Todos os direitos reservados.</p>
      </footer>
      <Toaster />
    </div>
  );
}
