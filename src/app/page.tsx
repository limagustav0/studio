
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Product, BuyboxWinner, SellerAnalysisMetrics } from '@/lib/types'; 
import { fetchData, getUniqueSellers, calculateBuyboxWins, analyzeSellerPerformance, getUniqueMarketplaces } from '@/lib/data';
import { AppHeader } from '@/components/AppHeader';
import { BuyboxWinnersDisplay } from '@/components/BuyboxWinnersDisplay';
import { SellerPerformanceDashboard } from '@/components/SellerPerformanceDashboard';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Filter } from 'lucide-react';

const NO_SELLER_SELECTED_VALUE = "--none--";
const ALL_MARKETPLACES_OPTION_VALUE = "--all-marketplaces--";
const DEFAULT_SELLER_FOCUS = "HAIRPRO";

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [uniqueSellers, setUniqueSellers] = useState<string[]>([]);
  const [buyboxWinners, setBuyboxWinners] = useState<BuyboxWinner[]>([]);
  const [focusedSeller, setFocusedSeller] = useState<string | null>(null); 
  const [sellerPerformanceData, setSellerPerformanceData] = useState<SellerAnalysisMetrics | null>(null);
  const [isSellerPerformanceLoading, setIsSellerPerformanceLoading] = useState<boolean>(false);

  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);
  const [uniqueMarketplaces, setUniqueMarketplaces] = useState<string[]>([]);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const products = await fetchData();
        setAllProducts(products);
        
        const marketplaces = getUniqueMarketplaces(products);
        setUniqueMarketplaces(marketplaces);
        
        // Initial seller list and focused seller based on all products initially
        // This will be refined by marketplace filter effect later
        const initialSellers = getUniqueSellers(products);
        setUniqueSellers(initialSellers);
        if (initialSellers.includes(DEFAULT_SELLER_FOCUS)) {
          setFocusedSeller(DEFAULT_SELLER_FOCUS);
        } else {
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
          title: "Erro ao Carregar Dados Iniciais",
          description: description,
        });
        setAllProducts([]);
        setUniqueMarketplaces([]);
        setUniqueSellers([]);
        setBuyboxWinners([]);
        setFocusedSeller(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const productsFilteredByMarketplace = useMemo(() => {
    if (!selectedMarketplace || selectedMarketplace === ALL_MARKETPLACES_OPTION_VALUE) {
      return allProducts;
    }
    return allProducts.filter(p => p.marketplace === selectedMarketplace);
  }, [allProducts, selectedMarketplace]);

  useEffect(() => {
    // Update unique sellers based on marketplace filter
    const currentMarketplaceSellers = getUniqueSellers(productsFilteredByMarketplace);
    setUniqueSellers(currentMarketplaceSellers);

    // Reset focused seller if no longer valid or set default
    if (focusedSeller && !currentMarketplaceSellers.includes(focusedSeller)) {
        setFocusedSeller(null);
        setSellerPerformanceData(null); // Clear performance data if focused seller is invalidated
    } else if (!focusedSeller && currentMarketplaceSellers.includes(DEFAULT_SELLER_FOCUS)) {
        // If no seller is focused, but default exists in new list, set it.
        // This might re-focus on default when marketplace changes, consider user experience.
        // For now, let's stick to invalidating if current focused is gone.
        // setFocusedSeller(DEFAULT_SELLER_FOCUS);
    } else if (focusedSeller && currentMarketplaceSellers.includes(focusedSeller)) {
      // Focused seller is still valid, do nothing to focusedSeller state here
      // Performance data will be re-calculated by its own effect
    }


    // Update buybox winners based on marketplace filter
    setBuyboxWinners(calculateBuyboxWins(productsFilteredByMarketplace));

  }, [productsFilteredByMarketplace, focusedSeller]); // Removed toast from deps as it's stable


  useEffect(() => {
    if (focusedSeller && productsFilteredByMarketplace.length > 0) {
      setIsSellerPerformanceLoading(true);
      setTimeout(() => {
        const performanceData = analyzeSellerPerformance(productsFilteredByMarketplace, focusedSeller);
        setSellerPerformanceData(performanceData);
        setIsSellerPerformanceLoading(false);
      }, 50); 
    } else if (!focusedSeller) { 
      setSellerPerformanceData(null);
      setIsSellerPerformanceLoading(false);
    }
  }, [focusedSeller, productsFilteredByMarketplace]);


  const handleMarketplaceChange = (value: string) => {
    const newMarketplace = value === ALL_MARKETPLACES_OPTION_VALUE ? null : value;
    setSelectedMarketplace(newMarketplace);
    // Focused seller logic is handled in the effect watching productsFilteredByMarketplace
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        
        <Card className="shadow-lg p-2 sm:p-6">
            <CardHeader className="pb-4 px-2 sm:px-6">
                <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" />Filtro Global</CardTitle>
                <CardDescription>Aplique filtros para refinar os dados exibidos em toda a análise.</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <Label htmlFor="marketplace-filter" className="text-sm font-medium">Filtrar por Marketplace</Label>
                <Select 
                    value={selectedMarketplace || ALL_MARKETPLACES_OPTION_VALUE} 
                    onValueChange={handleMarketplaceChange}
                >
                    <SelectTrigger id="marketplace-filter" className="mt-1">
                    <SelectValue placeholder="Selecione um marketplace..." />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value={ALL_MARKETPLACES_OPTION_VALUE}>Todos os Marketplaces</SelectItem>
                    {uniqueMarketplaces.map(mp => <SelectItem key={`mp-filter-${mp}`} value={mp}>{mp}</SelectItem>)}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        <section aria-labelledby="seller-performance-title" className="space-y-6">
            <Card className="shadow-lg p-2 sm:p-6">
                <CardHeader className="pb-4 px-2 sm:px-6">
                    <CardTitle>Análise de Desempenho por Vendedor</CardTitle>
                    <CardDescription>Selecione um vendedor para ver suas métricas detalhadas de buybox e produtos, considerando o filtro de marketplace acima (se aplicado).</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    <Label htmlFor="focused-seller-filter" className="text-sm font-medium">Selecionar Vendedor para Análise Detalhada</Label>
                    <Select 
                        value={focusedSeller || NO_SELLER_SELECTED_VALUE} 
                        onValueChange={(value) => setFocusedSeller(value === NO_SELLER_SELECTED_VALUE ? null : value)}
                        disabled={isLoading || uniqueSellers.length === 0}
                    >
                        <SelectTrigger id="focused-seller-filter" className="mt-1">
                        <SelectValue placeholder={uniqueSellers.length === 0 && !isLoading ? "Nenhum vendedor encontrado com os filtros atuais" : "Selecione um vendedor..."} />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value={NO_SELLER_SELECTED_VALUE}>Nenhum (Limpar Seleção)</SelectItem>
                        {uniqueSellers.map(seller => <SelectItem key={`focused-${seller}`} value={seller}>{seller}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     {uniqueSellers.length === 0 && !isLoading && productsFilteredByMarketplace.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">Nenhum vendedor encontrado para o marketplace selecionado.</p>
                    )}
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
          <BuyboxWinnersDisplay buyboxWinners={buyboxWinners} isLoading={isLoading && buyboxWinners.length === 0 && productsFilteredByMarketplace.length > 0} />
           {(isLoading && productsFilteredByMarketplace.length === 0 && allProducts.length > 0) && <p className="text-center text-muted-foreground">Carregando dados de buybox...</p>}
           {(!isLoading && productsFilteredByMarketplace.length === 0 && allProducts.length > 0) && 
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Vencedores de Buybox por Loja</CardTitle>
                <CardDescription>Nenhum produto encontrado para o marketplace selecionado.</CardDescription>
              </CardHeader>
            </Card>
           }
        </section>
      </main>
      <footer className="bg-card text-card-foreground py-6 text-center text-sm border-t">
        <p>&copy; {new Date().getFullYear()} Monitoramento KAMI PRICING. Todos os direitos reservados.</p>
      </footer>
      <Toaster />
    </div>
  );
}

