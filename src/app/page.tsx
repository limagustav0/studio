
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Product, PriceTrendProductInfo, Metrics, BuyboxWinner, SellerAnalysisMetrics } from '@/lib/types'; 
import { fetchData, calculateMetrics, analyzePriceTrends, getUniqueMarketplaces, getUniqueSellers, calculateBuyboxWins, analyzeSellerPerformance } from '@/lib/data';
import { AppHeader } from '@/components/AppHeader';
import { ProductList } from '@/components/ProductList';
import { SearchBar } from '@/components/SearchBar';
import { MetricsDashboard } from '@/components/MetricsDashboard';
import { PriceTrendDisplay } from '@/components/PriceTrendDisplay';
import { BuyboxWinnersDisplay } from '@/components/BuyboxWinnersDisplay';
import { SellerPerformanceDashboard } from '@/components/SellerPerformanceDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, BarChartBig } from 'lucide-react'; // Icons for tabs

const NO_SELLER_SELECTED_VALUE = "--none--";

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trendProducts, setTrendProducts] = useState<PriceTrendProductInfo[]>([]);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  
  // States for general filters (Marketplace, Seller, SKU) - UI removed from "Análise Detalhada" tab but state kept for now
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>("all");
  const [selectedSeller, setSelectedSeller] = useState<string>("all"); 
  const [skuFilter, setSkuFilter] = useState<string>(""); 
  const [uniqueMarketplaces, setUniqueMarketplaces] = useState<string[]>([]);
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
        setMetrics(calculateMetrics(products));
        setTrendProducts(analyzePriceTrends(products));
        setUniqueMarketplaces(getUniqueMarketplaces(products)); // Still populated, though UI filter removed from this tab
        const sellers = getUniqueSellers(products);
        setUniqueSellers(sellers); // Used for focusedSeller dropdown
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
  }, [toast]); // Removed focusedSeller from dependencies as it's handled in its own useEffect

  useEffect(() => {
    if (focusedSeller && allProducts.length > 0) {
      setIsSellerPerformanceLoading(true);
      // Using a small timeout to ensure state updates are batched and UI shows loading
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


  const overviewFilteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    return allProducts.filter(product =>
      product.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.loja && product.loja.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allProducts, searchTerm]);

  // This memoized value is no longer directly used by a ProductList in "Análise Detalhada" tab
  // Kept for now in case of future use or if other components might indirectly depend on its structure.
  const detailedFilteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const marketplaceMatch = selectedMarketplace === "all" || (product.marketplace && product.marketplace.toLowerCase() === selectedMarketplace.toLowerCase());
      const sellerMatch = selectedSeller === "all" || (product.loja && product.loja.toLowerCase() === selectedSeller.toLowerCase());
      const skuMatch = !skuFilter || (product.sku && product.sku.toLowerCase().includes(skuFilter.toLowerCase()));
      return marketplaceMatch && sellerMatch && skuMatch;
    });
  }, [allProducts, selectedMarketplace, selectedSeller, skuFilter]);

  const ProductListSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="shadow-lg">
          <CardHeader>
            <Skeleton className="w-full h-48 mb-4 rounded-t-lg" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-1/4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 sticky top-[calc(var(--header-height,68px)+1rem)] bg-background z-40 py-2 shadow-md gap-2 rounded-lg">
            <TabsTrigger value="overview" className="px-4 py-2.5 text-sm sm:text-base font-medium flex items-center justify-center gap-2 data-[state=active]:shadow-lg">
              <LayoutDashboard className="h-5 w-5" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="analysis" className="px-4 py-2.5 text-sm sm:text-base font-medium flex items-center justify-center gap-2 data-[state=active]:shadow-lg">
              <BarChartBig className="h-5 w-5" />
              Análise Detalhada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <section aria-labelledby="metrics-title">
              <h2 id="metrics-title" className="sr-only">Métricas Chave</h2>
              <MetricsDashboard metrics={metrics} />
            </section>
            
            <section aria-labelledby="price-trends-title" className="mb-8">
              <h2 id="price-trends-title" className="sr-only">Análise de Tendências de Preços</h2>
              {isLoading && trendProducts.length === 0 ? (
                <Card className="shadow-lg">
                  <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                  <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                </Card>
              ) : (
                <PriceTrendDisplay trendProducts={trendProducts} />
              )}
            </section>

            <section aria-labelledby="search-products-title" className="mb-8">
              <h2 id="search-products-title" className="sr-only">Pesquisar Produtos</h2>
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Pesquisar por descrição ou loja..."/>
            </section>

            <section aria-labelledby="product-list-title">
              <h2 id="product-list-title" className="text-2xl font-semibold mb-6 text-center md:text-left">Lista de Produtos</h2>
              {isLoading && overviewFilteredProducts.length === 0 && allProducts.length === 0 ? <ProductListSkeleton /> : <ProductList products={overviewFilteredProducts} />}
            </section>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-8">
            {/* Filtros de Análise de Produtos Card REMOVED */}

            {/* Seller Performance Section FIRST */}
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

            {/* Buybox Winners Display Section MOVED HERE */}
            <section aria-labelledby="buybox-analysis-title">
              <h2 id="buybox-analysis-title" className="sr-only">Análise de Buybox Global</h2>
              <BuyboxWinnersDisplay buyboxWinners={buyboxWinners} isLoading={isLoading && buyboxWinners.length === 0} />
            </section>
            
            {/* Separator and Filtered Product List Section REMOVED */}
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
