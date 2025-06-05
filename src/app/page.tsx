
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Product, BuyboxWinner, SellerAnalysisMetrics, UniqueProductSummary, ProductLosingBuyboxInfo, ProductWinningBuyboxInfo } from '@/lib/types';
import { fetchData, getUniqueSellers, calculateBuyboxWins, analyzeSellerPerformance, getUniqueMarketplaces, generateUniqueProductSummaries } from '@/lib/data';
import { AppHeader } from '@/components/AppHeader';
import { BuyboxWinnersDisplay } from '@/components/BuyboxWinnersDisplay';
import { SellerPerformanceDashboard } from '@/components/SellerPerformanceDashboard';
import { ProductList } from '@/components/ProductList';
import { ProductSummaryTable } from '@/components/ProductSummaryTable';
import { SearchBar } from '@/components/SearchBar';
import { SkuImportTab } from '@/components/SkuImportTab'; // Import the new component
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce"; // Import useDebounce
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, List, BarChartBig, Search, Package, LayoutGrid, ChevronDown, Users, UploadCloud } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";


const ALL_MARKETPLACES_OPTION_VALUE = "--all-marketplaces--";
const DEFAULT_SELLER_FOCUS = "HAIRPRO";
const INTERNAL_SKUS_LOCAL_STORAGE_KEY = 'priceWiseInternalSkusMap';
const SEARCH_DEBOUNCE_DELAY = 500; // milliseconds

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [internalSkusMap, setInternalSkusMap] = useState<Record<string, string>>({});

  // Common state for marketplace lists
  const [uniqueMarketplaces, setUniqueMarketplaces] = useState<string[]>([]);

  // State for "Análise Detalhada" Tab
  const [analysis_selectedMarketplace, setAnalysis_selectedMarketplace] = useState<string | null>(null);
  const [analysis_selectedInternalSkus, setAnalysis_selectedInternalSkus] = useState<string[]>([]);
  const [uniqueSellersForAnalysis, setUniqueSellersForAnalysis] = useState<string[]>([]);
  const [buyboxWinners, setBuyboxWinners] = useState<BuyboxWinner[]>([]);
  const [analysis_selectedSellers, setAnalysis_selectedSellers] = useState<string[]>([]);
  const [analysis_sellerPerformanceData, setAnalysis_sellerPerformanceData] = useState<SellerAnalysisMetrics[]>([]);
  const [isSellerPerformanceLoading, setIsSellerPerformanceLoading] = useState<boolean>(false);

  // State for "Todos os Produtos" Tab
  const [allProductsTab_selectedMarketplace, setAllProductsTab_selectedMarketplace] = useState<string | null>(null);
  const [allProductsTab_searchTerm, setAllProductsTab_searchTerm] = useState<string>('');
  const debouncedAllProductsTab_SearchTerm = useDebounce(allProductsTab_searchTerm, SEARCH_DEBOUNCE_DELAY);


  // State for "Visão Geral do Produto" Tab
  const [uniqueProductSummaries, setUniqueProductSummaries] = useState<UniqueProductSummary[]>([]);
  const [overviewTab_selectedMarketplace, setOverviewTab_selectedMarketplace] = useState<string | null>(null);
  const [overviewTab_searchTerm, setOverviewTab_searchTerm] = useState<string>('');
  const debouncedOverviewTab_SearchTerm = useDebounce(overviewTab_searchTerm, SEARCH_DEBOUNCE_DELAY);

  // Load internal SKUs from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSkus = localStorage.getItem(INTERNAL_SKUS_LOCAL_STORAGE_KEY);
      if (savedSkus) {
        try {
          setInternalSkusMap(JSON.parse(savedSkus));
        } catch (error) {
          console.error("Error parsing internal SKUs from localStorage:", error);
        }
      }
    }
  }, []);

  // Save internal SKUs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (Object.keys(internalSkusMap).length > 0) {
        localStorage.setItem(INTERNAL_SKUS_LOCAL_STORAGE_KEY, JSON.stringify(internalSkusMap));
      }
    }
  }, [internalSkusMap]);


  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const products = await fetchData();
        setAllProducts(products);

        const marketplaces = getUniqueMarketplaces(products);
        setUniqueMarketplaces(marketplaces);

        const initialSellers = getUniqueSellers(products);
        setUniqueSellersForAnalysis(initialSellers);
        
        setUniqueProductSummaries(generateUniqueProductSummaries(products));

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
        setUniqueSellersForAnalysis([]);
        setBuyboxWinners([]);
        setAnalysis_selectedSellers([]);
        setUniqueProductSummaries([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Memoized products for "Análise Detalhada" Tab
  const analysis_productsFilteredByMarketplace = useMemo(() => {
    let filtered = allProducts;
    if (analysis_selectedMarketplace && analysis_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      filtered = filtered.filter(p => p.marketplace === analysis_selectedMarketplace);
    }
    if (analysis_selectedInternalSkus.length > 0) {
      const matchingPrincipalSkus = Object.entries(internalSkusMap)
        .filter(([_, internalSkuVal]) => analysis_selectedInternalSkus.includes(internalSkuVal))
        .map(([principalSku, _]) => principalSku);
      
      if (matchingPrincipalSkus.length > 0) {
        filtered = filtered.filter(p => matchingPrincipalSkus.includes(p.sku));
      } else {
         // If selected internal SKUs map to no principal SKUs, or the map is empty,
        // no products will match this SKU filter.
        filtered = [];
      }
    }
    return filtered;
  }, [allProducts, analysis_selectedMarketplace, analysis_selectedInternalSkus, internalSkusMap]);

  // Effects for "Análise Detalhada" Tab - Seller list and default selection
  useEffect(() => {
    const currentMarketplaceSellers = getUniqueSellers(analysis_productsFilteredByMarketplace);
    setUniqueSellersForAnalysis(currentMarketplaceSellers);

    setAnalysis_selectedSellers(prevSelectedSellers => {
      const stillValidSelectedSellers = prevSelectedSellers.filter(s => currentMarketplaceSellers.includes(s));
      if (stillValidSelectedSellers.length > 0) {
        return stillValidSelectedSellers;
      }
      if (currentMarketplaceSellers.includes(DEFAULT_SELLER_FOCUS)) {
        return [DEFAULT_SELLER_FOCUS];
      }
      return []; 
    });

    setBuyboxWinners(calculateBuyboxWins(analysis_productsFilteredByMarketplace));
  }, [analysis_productsFilteredByMarketplace]);


  // Effect for Seller Performance Data (now for multiple sellers)
  useEffect(() => {
    if (analysis_selectedSellers.length > 0 && analysis_productsFilteredByMarketplace.length > 0) {
      setIsSellerPerformanceLoading(true);
      const promises = analysis_selectedSellers.map(sellerName =>
        analyzeSellerPerformance(analysis_productsFilteredByMarketplace, sellerName)
      );
      Promise.all(promises)
        .then(results => {
          const augmentedResults = results.map(metric => {
            if (!metric) return null;
            return {
              ...metric,
              productsLosingBuybox: metric.productsLosingBuybox.map(p => ({
                ...p,
                internalSku: internalSkusMap[p.sku] || '',
              })),
              productsWinningBuybox: metric.productsWinningBuybox.map(p => ({
                ...p,
                internalSku: internalSkusMap[p.sku] || '',
              })),
            };
          }).filter(r => r !== null) as SellerAnalysisMetrics[];

          setAnalysis_sellerPerformanceData(augmentedResults);
          setIsSellerPerformanceLoading(false);
        })
        .catch(error => {
          console.error("Error fetching seller performance data for multiple sellers:", error);
          toast({
            variant: "destructive",
            title: "Erro ao Carregar Análise de Vendedor",
            description: "Não foi possível buscar os dados de desempenho para os vendedores selecionados.",
          });
          setAnalysis_sellerPerformanceData([]);
          setIsSellerPerformanceLoading(false);
        });
    } else {
      setAnalysis_sellerPerformanceData([]); 
      setIsSellerPerformanceLoading(false);
    }
  }, [analysis_selectedSellers, analysis_productsFilteredByMarketplace, toast, internalSkusMap]);


  const handleAnalysisMarketplaceChange = (value: string) => {
    const newMarketplace = value === ALL_MARKETPLACES_OPTION_VALUE ? null : value;
    setAnalysis_selectedMarketplace(newMarketplace);
  };

  const uniqueInternalSkuValues = useMemo(() => {
    if (!internalSkusMap) return [];
    return Array.from(new Set(Object.values(internalSkusMap).filter(Boolean))).sort();
  }, [internalSkusMap]);


  // Memoized products for "Todos os Produtos" Tab
  const allProductsTab_filteredProducts = useMemo(() => {
    let filtered = allProducts;

    if (allProductsTab_selectedMarketplace && allProductsTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      filtered = filtered.filter(p => p.marketplace === allProductsTab_selectedMarketplace);
    }

    if (debouncedAllProductsTab_SearchTerm) {
      const lowerSearchTerm = debouncedAllProductsTab_SearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.descricao.toLowerCase().includes(lowerSearchTerm) ||
        p.sku.toLowerCase().includes(lowerSearchTerm) ||
        p.loja.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return filtered;
  }, [allProducts, allProductsTab_selectedMarketplace, debouncedAllProductsTab_SearchTerm]);

  const handleAllProductsMarketplaceChange = (value: string) => {
    const newMarketplace = value === ALL_MARKETPLACES_OPTION_VALUE ? null : value;
    setAllProductsTab_selectedMarketplace(newMarketplace);
  };

  const productCountMessage = useMemo(() => {
    const count = allProductsTab_filteredProducts.length;
    if (allProductsTab_selectedMarketplace && allProductsTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      return `Exibindo ${count} produto(s) para o marketplace "${allProductsTab_selectedMarketplace}".`;
    }
    if(debouncedAllProductsTab_SearchTerm && (!allProductsTab_selectedMarketplace || allProductsTab_selectedMarketplace === ALL_MARKETPLACES_OPTION_VALUE)) {
         return `Exibindo ${count} produto(s) correspondente(s) à pesquisa em todos os marketplaces.`;
    }
     if(debouncedAllProductsTab_SearchTerm && allProductsTab_selectedMarketplace && allProductsTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
         return `Exibindo ${count} produto(s) correspondente(s) à pesquisa para o marketplace "${allProductsTab_selectedMarketplace}".`;
    }
    return `Exibindo ${count} produto(s) (todos os marketplaces).`;
  }, [allProductsTab_filteredProducts, allProductsTab_selectedMarketplace, debouncedAllProductsTab_SearchTerm]);

  const handleInternalSkuChange = (productSku: string, newInternalSku: string) => {
    setInternalSkusMap(prevMap => ({
      ...prevMap,
      [productSku]: newInternalSku,
    }));
  };

  const handleBulkInternalSkuImport = (importedSkus: Record<string, string>) => {
    setInternalSkusMap(prevMap => ({
      ...prevMap,
      ...importedSkus,
    }));
    toast({
      title: "Importação Concluída",
      description: `${Object.keys(importedSkus).length} SKUs internos foram importados/atualizados.`,
    });
  };


  // Memoized summaries for "Visão Geral do Produto" Tab
  const overviewTab_filteredSummaries = useMemo(() => {
    let filtered = uniqueProductSummaries;

    if (overviewTab_selectedMarketplace && overviewTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      filtered = filtered.filter(summary => summary.marketplaces.includes(overviewTab_selectedMarketplace));
    }

    if (debouncedOverviewTab_SearchTerm) {
      const lowerSearchTerm = debouncedOverviewTab_SearchTerm.toLowerCase();
      filtered = filtered.filter(summary =>
        summary.descricao.toLowerCase().includes(lowerSearchTerm) ||
        summary.sku.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return filtered.map(summary => ({
      ...summary,
      internalSku: internalSkusMap[summary.sku] || '', 
    }));
  }, [uniqueProductSummaries, overviewTab_selectedMarketplace, debouncedOverviewTab_SearchTerm, internalSkusMap]);

  const handleOverviewMarketplaceChange = (value: string) => {
    const newMarketplace = value === ALL_MARKETPLACES_OPTION_VALUE ? null : value;
    setOverviewTab_selectedMarketplace(newMarketplace);
  };

  const overviewProductCountMessage = useMemo(() => {
    const count = overviewTab_filteredSummaries.length;
    let message = `Exibindo ${count} SKU(s) único(s)`;
    if (overviewTab_selectedMarketplace && overviewTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      message += ` encontrado(s) no marketplace "${overviewTab_selectedMarketplace}"`;
    } else {
      message += ` (todos os marketplaces)`;
    }
    if (debouncedOverviewTab_SearchTerm) {
      message += ` correspondente(s) à pesquisa.`;
    } else {
      message += `.`;
    }
    return message;
  }, [overviewTab_filteredSummaries, overviewTab_selectedMarketplace, debouncedOverviewTab_SearchTerm]);

  const getSelectedSellersText = () => {
    if (analysis_selectedSellers.length === 0) {
      return "Selecione Vendedor(es)...";
    }
    if (analysis_selectedSellers.length <= 2) {
      return analysis_selectedSellers.join(', ');
    }
    return `${analysis_selectedSellers.slice(0, 2).join(', ')} + ${analysis_selectedSellers.length - 2} mais`;
  };

  const getSelectedInternalSkusText = () => {
    if (analysis_selectedInternalSkus.length === 0) {
      return "Selecione SKU(s) Interno(s)...";
    }
    if (analysis_selectedInternalSkus.length <= 2) {
      return analysis_selectedInternalSkus.join(', ');
    }
    return `${analysis_selectedInternalSkus.slice(0, 2).join(', ')} + ${analysis_selectedInternalSkus.length - 2} mais`;
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-card p-1 rounded-lg">
            <TabsTrigger value="analysis" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2">
                    <BarChartBig className="h-5 w-5" />
                    <span>Análise Detalhada</span>
                </span>
            </TabsTrigger>
            <TabsTrigger value="product-overview" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5" />
                    <span>Visão Geral do Produto</span>
                </span>
            </TabsTrigger>
            <TabsTrigger value="all-products" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <span>Todos os Produtos</span>
                </span>
            </TabsTrigger>
            <TabsTrigger value="sku-import" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2">
                    <UploadCloud className="h-5 w-5" />
                    <span>Importar SKUs Internos</span>
                </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-8">
            <Card className="shadow-lg p-2 sm:p-6">
                <CardHeader className="pb-4 px-2 sm:px-6">
                    <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" />Filtro para Análise</CardTitle>
                    <CardDescription>Aplique filtros para refinar os dados exibidos nas seções de Análise de Desempenho e Vencedores de Buybox abaixo.</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                    <div>
                        <Label htmlFor="analysis-marketplace-filter" className="text-sm font-medium">Filtrar por Marketplace</Label>
                        <Select
                            value={analysis_selectedMarketplace || ALL_MARKETPLACES_OPTION_VALUE}
                            onValueChange={handleAnalysisMarketplaceChange}
                        >
                            <SelectTrigger id="analysis-marketplace-filter" className="mt-1">
                            <SelectValue placeholder="Selecione um marketplace..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value={ALL_MARKETPLACES_OPTION_VALUE}>Todos os Marketplaces</SelectItem>
                            {uniqueMarketplaces.map(mp => <SelectItem key={`mp-filter-analysis-${mp}`} value={mp}>{mp}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="analysis-internal-sku-filter" className="text-sm font-medium">Filtrar por SKU(s) Interno(s)</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between mt-1">
                                <span className="truncate pr-2">{getSelectedInternalSkusText()}</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuLabel>SKUs Internos Disponíveis</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                 {uniqueInternalSkuValues.length === 0 && (
                                    <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum SKU interno mapeado.</p>
                                 )}
                                <ScrollArea className="h-[200px]">
                                {uniqueInternalSkuValues.map((sku) => (
                                <DropdownMenuCheckboxItem
                                    key={`internal-sku-filter-${sku}`}
                                    checked={analysis_selectedInternalSkus.includes(sku)}
                                    onCheckedChange={(checked) => {
                                    setAnalysis_selectedInternalSkus((prev) =>
                                        checked
                                        ? [...prev, sku]
                                        : prev.filter((s) => s !== sku)
                                    );
                                    }}
                                    onSelect={(e) => e.preventDefault()} 
                                >
                                    {sku}
                                </DropdownMenuCheckboxItem>
                                ))}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                   </div>
                </CardContent>
            </Card>

            <section aria-labelledby="seller-performance-title" className="space-y-6">
                <Card className="shadow-lg p-2 sm:p-6">
                    <CardHeader className="pb-4 px-2 sm:px-6">
                        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Análise de Desempenho por Vendedor</CardTitle>
                        <CardDescription>Selecione um ou mais vendedores para ver suas métricas consolidadas, considerando o filtro de marketplace e SKU interno acima.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <Label className="text-sm font-medium mb-1 block">Selecionar Vendedor(es) para Análise</Label>
                         {(isLoading && uniqueSellersForAnalysis.length === 0 && allProducts.length > 0) || (isSellerPerformanceLoading && analysis_selectedSellers.length > 0 && uniqueSellersForAnalysis.length === 0 && analysis_productsFilteredByMarketplace.length > 0) ? (
                            <Skeleton className="h-10 w-full mt-1" />
                        ) : uniqueSellersForAnalysis.length === 0 && !isLoading ? (
                            <p className="text-xs text-muted-foreground mt-2">
                                Nenhum vendedor encontrado para os filtros selecionados.
                            </p>
                        ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between mt-1">
                                <span className="truncate pr-2">{getSelectedSellersText()}</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuLabel>Vendedores Disponíveis</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-[200px]">
                                {uniqueSellersForAnalysis.map((seller) => (
                                <DropdownMenuCheckboxItem
                                    key={seller}
                                    checked={analysis_selectedSellers.includes(seller)}
                                    onCheckedChange={(checked) => {
                                    setAnalysis_selectedSellers((prev) =>
                                        checked
                                        ? [...prev, seller]
                                        : prev.filter((s) => s !== seller)
                                    );
                                    }}
                                    onSelect={(e) => e.preventDefault()} 
                                >
                                    {seller}
                                </DropdownMenuCheckboxItem>
                                ))}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                    </CardContent>
                </Card>

                <SellerPerformanceDashboard
                    performanceMetricsList={analysis_sellerPerformanceData}
                    isLoading={isSellerPerformanceLoading || (isLoading && analysis_selectedSellers.length > 0 && analysis_sellerPerformanceData.length === 0 && analysis_productsFilteredByMarketplace.length > 0 ) }
                    selectedSellersCount={analysis_selectedSellers.length}
                    selectedSellerNames={analysis_selectedSellers}
                />
            </section>

            <Separator className="my-8" />

            <section aria-labelledby="buybox-analysis-title">
              <h2 id="buybox-analysis-title" className="sr-only">Análise de Buybox (Considerando Filtros de Análise)</h2>
              <BuyboxWinnersDisplay buyboxWinners={buyboxWinners} isLoading={isLoading && buyboxWinners.length === 0 && analysis_productsFilteredByMarketplace.length > 0} />
              {(isLoading && analysis_productsFilteredByMarketplace.length === 0 && allProducts.length > 0 && (analysis_selectedMarketplace !== null || analysis_selectedInternalSkus.length > 0)) && <p className="text-center text-muted-foreground">Carregando dados de buybox...</p>}
              {(!isLoading && analysis_productsFilteredByMarketplace.length === 0 && allProducts.length > 0 && (analysis_selectedMarketplace !== null || analysis_selectedInternalSkus.length > 0)) &&
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Vencedores de Buybox por Loja</CardTitle>
                    <CardDescription>Nenhum produto encontrado para os filtros selecionados.</CardDescription>
                  </CardHeader>
                </Card>
              }
            </section>
          </TabsContent>

           <TabsContent value="product-overview" className="space-y-6">
            <Card className="shadow-lg p-2 sm:p-6">
              <CardHeader className="pb-4 px-2 sm:px-6">
                <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" />Filtros para Visão Geral</CardTitle>
                <CardDescription>Filtre a lista de SKUs únicos abaixo por marketplace de ocorrência e/ou termo de pesquisa.</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overview-marketplace-filter" className="text-sm font-medium">Filtrar por Marketplace de Ocorrência</Label>
                    <Select
                      value={overviewTab_selectedMarketplace || ALL_MARKETPLACES_OPTION_VALUE}
                      onValueChange={handleOverviewMarketplaceChange}
                    >
                      <SelectTrigger id="overview-marketplace-filter" className="mt-1">
                        <SelectValue placeholder="Selecione um marketplace..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_MARKETPLACES_OPTION_VALUE}>Todos os Marketplaces</SelectItem>
                        {uniqueMarketplaces.map(mp => <SelectItem key={`mp-filter-overview-${mp}`} value={mp}>{mp}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="overview-search" className="text-sm font-medium">Pesquisar SKUs</Label>
                    <SearchBar
                      searchTerm={overviewTab_searchTerm}
                      onSearchChange={setOverviewTab_searchTerm}
                      placeholder="Pesquisar por descrição ou SKU..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground mb-4">
              {overviewProductCountMessage}
            </div>

            <ProductSummaryTable
              summaries={overviewTab_filteredSummaries}
              isLoading={isLoading && uniqueProductSummaries.length === 0}
              onInternalSkuChange={handleInternalSkuChange}
            />

          </TabsContent>

          <TabsContent value="all-products" className="space-y-6">
            <Card className="shadow-lg p-2 sm:p-6">
                <CardHeader className="pb-4 px-2 sm:px-6">
                    <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" />Filtros para Lista de Produtos</CardTitle>
                    <CardDescription>Filtre a lista de todos os produtos abaixo por marketplace e/ou termo de pesquisa.</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="allProducts-marketplace-filter" className="text-sm font-medium">Filtrar por Marketplace</Label>
                        <Select
                            value={allProductsTab_selectedMarketplace || ALL_MARKETPLACES_OPTION_VALUE}
                            onValueChange={handleAllProductsMarketplaceChange}
                        >
                            <SelectTrigger id="allProducts-marketplace-filter" className="mt-1">
                            <SelectValue placeholder="Selecione um marketplace..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value={ALL_MARKETPLACES_OPTION_VALUE}>Todos os Marketplaces</SelectItem>
                            {uniqueMarketplaces.map(mp => <SelectItem key={`mp-filter-allProducts-${mp}`} value={mp}>{mp}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="allProducts-search" className="text-sm font-medium">Pesquisar Produtos</Label>
                        <SearchBar
                            searchTerm={allProductsTab_searchTerm}
                            onSearchChange={setAllProductsTab_searchTerm}
                            placeholder="Pesquisar por descrição, SKU ou loja..."
                            className="mt-1"
                        />
                    </div>
                  </div>
                </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground mb-4">
                {productCountMessage}
            </div>

            {isLoading && allProducts.length === 0 ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                        <Card key={`skel-prod-${i}`}>
                            <CardHeader>
                                <Skeleton className="h-36 w-full mb-4" />
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2 mt-1" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-6 w-1/3" />
                            </CardFooter>
                        </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <ProductList products={allProductsTab_filteredProducts} />
            )}
          </TabsContent>
          <TabsContent value="sku-import" className="space-y-6">
            <SkuImportTab onImport={handleBulkInternalSkuImport} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="bg-card text-card-foreground py-6 text-center text-sm border-t">
        <p>&copy; {new Date().getFullYear()} Monitoramento KAMI PRICING. Todos os direitos reservados.</p>
      </footer>
      <Toaster />
    </div>
  );
}

    

    