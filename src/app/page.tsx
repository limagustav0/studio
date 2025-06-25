
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Product, BuyboxWinner, SellerAnalysisMetrics, UniqueProductSummary, InternalSkuMapping } from '@/lib/types';
import { fetchData, getUniqueSellers, calculateBuyboxWins, analyzeSellerPerformance, getUniqueMarketplaces, generateUniqueProductSummaries } from '@/lib/data';
import { AppHeader } from '@/components/AppHeader';
import { BuyboxWinnersDisplay } from '@/components/BuyboxWinnersDisplay';
import { SellerPerformanceDashboard } from '@/components/SellerPerformanceDashboard';
import { ProductSummaryTable } from '@/components/ProductSummaryTable';
import { SearchBar } from '@/components/SearchBar';
import { SkuImportTab } from '@/components/SkuImportTab';
import { PriceChangeSellersDisplay } from '@/components/PriceChangeSellersDisplay';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, BarChartBig, LayoutGrid, ChevronDown, Users, UploadCloud, Repeat, Building, Tags, Globe, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from '@/components/ui/input';

const ALL_MARKETPLACES_OPTION_VALUE = "--all-marketplaces--";
const DEFAULT_SELLER_FOCUS = "HAIRPRO";
const INTERNAL_SKUS_LOCAL_STORAGE_KEY = 'priceWiseInternalSkusMap_v2';
const SEARCH_DEBOUNCE_DELAY = 500;

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [internalSkusMap, setInternalSkusMap] = useState<Record<string, InternalSkuMapping>>({});
  const [uniqueMarketplaces, setUniqueMarketplaces] = useState<string[]>([]);

  // Analysis Tab States
  const [analysis_selectedMarketplace, setAnalysis_selectedMarketplace] = useState<string | null>(null);
  const [analysis_selectedInternalSkus, setAnalysis_selectedInternalSkus] = useState<string[]>([]);
  const [analysis_selectedMarcas, setAnalysis_selectedMarcas] = useState<string[]>([]);
  const [uniqueSellersForAnalysis, setUniqueSellersForAnalysis] = useState<string[]>([]);
  const [buyboxWinners, setBuyboxWinners] = useState<BuyboxWinner[]>([]);
  const [analysis_selectedSellers, setAnalysis_selectedSellers] = useState<string[]>([]);
  const [analysis_sellerPerformanceData, setAnalysis_sellerPerformanceData] = useState<SellerAnalysisMetrics[]>([]);
  const [isSellerPerformanceLoading, setIsSellerPerformanceLoading] = useState<boolean>(false);

  // States for Dropdown search
  const [analysisSellerSearch, setAnalysisSellerSearch] = useState('');
  const [analysisInternalSkuSearch, setAnalysisInternalSkuSearch] = useState('');
  const [analysisMarcaSearch, setAnalysisMarcaSearch] = useState('');
  const [priceChangeInternalSkuSearch, setPriceChangeInternalSkuSearch] = useState('');

  // Overview Tab States
  const [uniqueProductSummaries, setUniqueProductSummaries] = useState<UniqueProductSummary[]>([]);
  const [overviewTab_selectedMarketplace, setOverviewTab_selectedMarketplace] = useState<string | null>(null);
  const [overviewTab_searchTerm, setOverviewTab_searchTerm] = useState<string>('');
  const debouncedOverviewTab_SearchTerm = useDebounce(overviewTab_searchTerm, SEARCH_DEBOUNCE_DELAY);

  // Price Change Tab States
  const [priceChangeTab_selectedMarketplace, setPriceChangeTab_selectedMarketplace] = useState<string | null>(null);
  const [priceChangeTab_selectedInternalSkus, setPriceChangeTab_selectedInternalSkus] = useState<string[]>([]);


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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (Object.keys(internalSkusMap).length > 0 || localStorage.getItem(INTERNAL_SKUS_LOCAL_STORAGE_KEY)) {
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
          description = error.message.toLowerCase().includes('failed to fetch')
            ? "Falha ao buscar dados da API. Verifique sua conexão e a disponibilidade da API."
            : `Erro: ${error.message}.`;
        }
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Dados Iniciais",
          description: description,
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const analysis_productsFilteredByMarketplace = useMemo(() => {
    let filtered = allProducts;

    if (analysis_selectedMarketplace && analysis_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      filtered = filtered.filter(p => p.marketplace === analysis_selectedMarketplace);
    }

    if (analysis_selectedInternalSkus.length > 0) {
      const matchingPrincipalSkusByInternalSku = Object.entries(internalSkusMap)
        .filter(([_, mapping]) => analysis_selectedInternalSkus.includes(mapping.internalSku || ''))
        .map(([principalSku, _]) => principalSku);
      
      filtered = matchingPrincipalSkusByInternalSku.length > 0 
        ? filtered.filter(p => matchingPrincipalSkusByInternalSku.includes(p.sku)) 
        : (analysis_selectedInternalSkus.length > 0 ? [] : filtered);
    }

    if (analysis_selectedMarcas.length > 0) {
        const matchingPrincipalSkusByMarca = Object.entries(internalSkusMap)
            .filter(([_, mapping]) => analysis_selectedMarcas.includes(mapping.marca || ''))
            .map(([principalSku, _]) => principalSku);
        
        filtered = matchingPrincipalSkusByMarca.length > 0
            ? filtered.filter(p => matchingPrincipalSkusByMarca.includes(p.sku))
            : (analysis_selectedMarcas.length > 0 ? [] : filtered);
    }

    return filtered;
  }, [allProducts, analysis_selectedMarketplace, analysis_selectedInternalSkus, analysis_selectedMarcas, internalSkusMap]);

  useEffect(() => {
    const currentMarketplaceSellers = getUniqueSellers(analysis_productsFilteredByMarketplace);
    setUniqueSellersForAnalysis(currentMarketplaceSellers);
    setAnalysis_selectedSellers(prev => {
      const validSelected = prev.filter(s => currentMarketplaceSellers.includes(s));
      if (validSelected.length > 0) return validSelected;
      return currentMarketplaceSellers.includes(DEFAULT_SELLER_FOCUS) ? [DEFAULT_SELLER_FOCUS] : [];
    });
    setBuyboxWinners(calculateBuyboxWins(analysis_productsFilteredByMarketplace));
  }, [analysis_productsFilteredByMarketplace]);

  useEffect(() => {
    if (analysis_selectedSellers.length > 0 && analysis_productsFilteredByMarketplace.length > 0) {
      setIsSellerPerformanceLoading(true);
      const promises = analysis_selectedSellers.map(sellerName =>
        analyzeSellerPerformance(analysis_productsFilteredByMarketplace, sellerName, internalSkusMap)
      );
      Promise.all(promises)
        .then(results => {
          const augmentedResults = results.map(metric => {
            if (!metric) return null;
            return {
              ...metric,
              productsLosingBuybox: metric.productsLosingBuybox.map(p => ({
                ...p,
                internalSku: internalSkusMap[p.sku]?.internalSku || '',
                marca: internalSkusMap[p.sku]?.marca || '',
              })),
              productsWinningBuybox: metric.productsWinningBuybox.map(p => ({
                ...p,
                internalSku: internalSkusMap[p.sku]?.internalSku || '',
                marca: internalSkusMap[p.sku]?.marca || '',
              })),
            };
          }).filter(r => r !== null) as SellerAnalysisMetrics[];
          setAnalysis_sellerPerformanceData(augmentedResults);
        })
        .catch(error => {
          console.error("Error fetching seller performance data:", error);
          toast({
            variant: "destructive",
            title: "Erro ao Carregar Análise de Vendedor",
            description: "Não foi possível buscar os dados de desempenho.",
          });
          setAnalysis_sellerPerformanceData([]);
        })
        .finally(() => setIsSellerPerformanceLoading(false));
    } else {
      setAnalysis_sellerPerformanceData([]);
      setIsSellerPerformanceLoading(false);
    }
  }, [analysis_selectedSellers, analysis_productsFilteredByMarketplace, toast, internalSkusMap]);

  const handleAnalysisMarketplaceChange = (value: string) => {
    setAnalysis_selectedMarketplace(value === ALL_MARKETPLACES_OPTION_VALUE ? null : value);
  };

  const uniqueInternalSkuValues = useMemo(() => {
    if (!internalSkusMap) return [];
    return Array.from(new Set(Object.values(internalSkusMap).map(m => m.internalSku).filter(Boolean))).sort();
  }, [internalSkusMap]);

  const uniqueMarcaValues = useMemo(() => {
    if (!internalSkusMap) return [];
    return Array.from(new Set(Object.values(internalSkusMap).map(m => m.marca).filter(Boolean))).sort((a,b) => (a || '').localeCompare(b || ''));
  }, [internalSkusMap]);

  const handleInternalSkuChange = (productSku: string, newInternalSku: string) => {
    setInternalSkusMap(prevMap => ({
      ...prevMap,
      [productSku]: { ...(prevMap[productSku] || { internalSku: '', marca: '' }), internalSku: newInternalSku },
    }));
  };

  const handleBrandChange = (productSku: string, newBrand: string) => {
    setInternalSkusMap(prevMap => ({
      ...prevMap,
      [productSku]: { ...(prevMap[productSku] || { internalSku: '', marca: '' }), marca: newBrand },
    }));
  };

  const handleBulkInternalSkuImport = (importedData: Record<string, { internalSku: string; marca: string }>) => {
    setInternalSkusMap(prevMap => {
      const newMap = { ...prevMap };
      for (const principalSku in importedData) {
        newMap[principalSku] = {
          internalSku: importedData[principalSku].internalSku,
          marca: importedData[principalSku].marca,
        };
      }
      return newMap;
    });
    toast({
      title: "Importação Concluída",
      description: `${Object.keys(importedData).length} mapeamentos de SKU/Marca foram importados/atualizados.`,
    });
  };

  const overviewTab_filteredSummaries = useMemo(() => {
    let filtered = uniqueProductSummaries;
    if (overviewTab_selectedMarketplace && overviewTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      filtered = filtered.filter(summary => summary.marketplaces.includes(overviewTab_selectedMarketplace));
    }
    if (debouncedOverviewTab_SearchTerm) {
      const lowerSearchTerm = debouncedOverviewTab_SearchTerm.toLowerCase();
      filtered = filtered.filter(summary =>
        summary.descricao.toLowerCase().includes(lowerSearchTerm) ||
        summary.sku.toLowerCase().includes(lowerSearchTerm) ||
        (internalSkusMap[summary.sku]?.internalSku || '').toLowerCase().includes(lowerSearchTerm) ||
        (internalSkusMap[summary.sku]?.marca || '').toLowerCase().includes(lowerSearchTerm)
      );
    }
    return filtered.map(summary => ({
      ...summary,
      internalSku: internalSkusMap[summary.sku]?.internalSku || '',
      marca: internalSkusMap[summary.sku]?.marca || '',
    }));
  }, [uniqueProductSummaries, overviewTab_selectedMarketplace, debouncedOverviewTab_SearchTerm, internalSkusMap]);

  const handleOverviewMarketplaceChange = (value: string) => {
    setOverviewTab_selectedMarketplace(value === ALL_MARKETPLACES_OPTION_VALUE ? null : value);
  };

  const overviewProductCountMessage = useMemo(() => {
    const count = overviewTab_filteredSummaries.length;
    let message = `Exibindo ${count} SKU(s) único(s)`;
    if (overviewTab_selectedMarketplace && overviewTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
      message += ` encontrado(s) no marketplace "${overviewTab_selectedMarketplace}"`;
    } else {
      message += ` (todos os marketplaces)`;
    }
    if (debouncedOverviewTab_SearchTerm) message += ` correspondente(s) à pesquisa.`;
    else message += `.`;
    return message;
  }, [overviewTab_filteredSummaries.length, overviewTab_selectedMarketplace, debouncedOverviewTab_SearchTerm]);

  const getSelectedSellersText = () => {
    if (analysis_selectedSellers.length === 0) return "Selecione Vendedor(es)...";
    if (analysis_selectedSellers.length <= 2) return analysis_selectedSellers.join(', ');
    return `${analysis_selectedSellers.slice(0, 2).join(', ')} + ${analysis_selectedSellers.length - 2} mais`;
  };

  const getSelectedItemsText = (selectedItems: string[], placeholder: string, itemTypeLabel: string) => {
    if (selectedItems.length === 0) return placeholder;
    if (selectedItems.length <= 2) return selectedItems.join(', ');
    return `${selectedItems.slice(0, 2).join(', ')} + ${selectedItems.length - 2} mais`;
  };
  
  const analysis_selectedSellersSet = useMemo(() => new Set(analysis_selectedSellers), [analysis_selectedSellers]);
  const analysis_selectedInternalSkusSet = useMemo(() => new Set(analysis_selectedInternalSkus), [analysis_selectedInternalSkus]);
  const analysis_selectedMarcasSet = useMemo(() => new Set(analysis_selectedMarcas), [analysis_selectedMarcas]);

  const handlePriceChangeTabMarketplaceChange = (value: string) => {
    setPriceChangeTab_selectedMarketplace(value === ALL_MARKETPLACES_OPTION_VALUE ? null : value);
  };
  const priceChangeTab_selectedInternalSkusSet = useMemo(() => new Set(priceChangeTab_selectedInternalSkus), [priceChangeTab_selectedInternalSkus]);

  const priceChangeTab_filteredProducts = useMemo(() => {
    let filtered = allProducts;
    if (priceChangeTab_selectedMarketplace && priceChangeTab_selectedMarketplace !== ALL_MARKETPLACES_OPTION_VALUE) {
        filtered = filtered.filter(p => p.marketplace === priceChangeTab_selectedMarketplace);
    }
    if (priceChangeTab_selectedInternalSkus.length > 0) {
        const matchingPrincipalSkus = Object.entries(internalSkusMap)
            .filter(([_, mapping]) => priceChangeTab_selectedInternalSkus.includes(mapping.internalSku || ''))
            .map(([principalSku, _]) => principalSku);
        filtered = matchingPrincipalSkus.length > 0 ? filtered.filter(p => matchingPrincipalSkus.includes(p.sku)) : (priceChangeTab_selectedInternalSkus.length > 0 ? [] : filtered);
    }
    return filtered;
  }, [allProducts, priceChangeTab_selectedMarketplace, priceChangeTab_selectedInternalSkus, internalSkusMap]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-card p-1 rounded-lg">
            <TabsTrigger value="analysis" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2"><BarChartBig className="h-5 w-5" /><span>Análise Detalhada</span></span>
            </TabsTrigger>
            <TabsTrigger value="product-overview" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" /><span>Visão Geral do Produto</span></span>
            </TabsTrigger>
            <TabsTrigger value="price-change-sellers" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2"><Repeat className="h-5 w-5" /><span>Vendedores c/ Mudanças</span></span>
            </TabsTrigger>
            <TabsTrigger value="sku-import" className="py-3 text-base hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                <span className="flex items-center gap-2"><UploadCloud className="h-5 w-5" /><span>Importar SKUs/Marcas</span></span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-8">
            <Card className="shadow-lg p-2 sm:p-6">
                <CardHeader className="pb-4 px-2 sm:px-6">
                    <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" />Filtro para Análise</CardTitle>
                    <CardDescription>Aplique filtros para refinar os dados exibidos nas seções de Análise de Desempenho e Vencedores de Buybox abaixo.</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> 
                    <div>
                        <Label htmlFor="analysis-marketplace-filter" className="text-sm font-medium">Filtrar por Marketplace</Label>
                        <Select value={analysis_selectedMarketplace || ALL_MARKETPLACES_OPTION_VALUE} onValueChange={handleAnalysisMarketplaceChange}>
                            <SelectTrigger id="analysis-marketplace-filter" className="mt-1"><SelectValue placeholder="Selecione um marketplace..." /></SelectTrigger>
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
                                    <span className="truncate pr-2">{getSelectedItemsText(analysis_selectedInternalSkus, "Selecione SKU(s) Interno(s)...", "SKU Interno")}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <div className="p-2">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Pesquisar SKU..."
                                        value={analysisInternalSkuSearch}
                                        onChange={(e) => setAnalysisInternalSkuSearch(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                  </div>
                                </div>
                                <DropdownMenuSeparator />
                                {uniqueInternalSkuValues.length === 0 && (<p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum SKU interno mapeado.</p>)}
                                <ScrollArea className="h-[200px]">
                                {uniqueInternalSkuValues
                                    .filter(sku => sku.toLowerCase().includes(analysisInternalSkuSearch.toLowerCase()))
                                    .map((sku) => (
                                    <DropdownMenuCheckboxItem key={`internal-sku-filter-${sku}`} checked={analysis_selectedInternalSkusSet.has(sku)}
                                        onCheckedChange={(checked) => setAnalysis_selectedInternalSkus(prev => checked ? [...prev, sku] : prev.filter(s => s !== sku))}
                                        onSelect={(e) => e.preventDefault()}>{sku}</DropdownMenuCheckboxItem>
                                    ))}
                                {uniqueInternalSkuValues.filter(sku => sku.toLowerCase().includes(analysisInternalSkuSearch.toLowerCase())).length === 0 && uniqueInternalSkuValues.length > 0 && (
                                    <p className="px-2 py-1.5 text-sm text-muted-foreground text-center">Nenhum resultado.</p>
                                )}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div>
                        <Label htmlFor="analysis-marca-filter" className="text-sm font-medium">Filtrar por Marca(s)</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between mt-1">
                                    <span className="truncate pr-2">{getSelectedItemsText(analysis_selectedMarcas, "Selecione Marca(s)...", "Marca")}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <div className="p-2">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Pesquisar marca..."
                                        value={analysisMarcaSearch}
                                        onChange={(e) => setAnalysisMarcaSearch(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                  </div>
                                </div>
                                <DropdownMenuSeparator />
                                {uniqueMarcaValues.length === 0 && (<p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma marca mapeada.</p>)}
                                <ScrollArea className="h-[200px]">
                                {uniqueMarcaValues
                                    .filter(marca => marca.toLowerCase().includes(analysisMarcaSearch.toLowerCase()))
                                    .map((marca) => (
                                    <DropdownMenuCheckboxItem key={`marca-filter-${marca}`} checked={analysis_selectedMarcasSet.has(marca)}
                                        onCheckedChange={(checked) => setAnalysis_selectedMarcas(prev => checked ? [...prev, marca] : prev.filter(m => m !== marca))}
                                        onSelect={(e) => e.preventDefault()}>{marca}</DropdownMenuCheckboxItem>
                                    ))}
                                {uniqueMarcaValues.filter(marca => marca.toLowerCase().includes(analysisMarcaSearch.toLowerCase())).length === 0 && uniqueMarcaValues.length > 0 && (
                                    <p className="px-2 py-1.5 text-sm text-muted-foreground text-center">Nenhum resultado.</p>
                                )}
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
                        <CardDescription>
                            Selecione um ou mais vendedores para ver suas métricas consolidadas, ganhos de buybox por marca/marketplace, e detalhes de produtos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <Label className="text-sm font-medium mb-1 block">Selecionar Vendedor(es) para Análise</Label>
                         {(isLoading && uniqueSellersForAnalysis.length === 0 && allProducts.length > 0) || (isSellerPerformanceLoading && analysis_selectedSellers.length > 0 && uniqueSellersForAnalysis.length === 0 && analysis_productsFilteredByMarketplace.length > 0) ? (
                            <Skeleton className="h-10 w-full mt-1" />
                        ) : uniqueSellersForAnalysis.length === 0 && !isLoading ? (
                            <p className="text-xs text-muted-foreground mt-2">Nenhum vendedor encontrado para os filtros selecionados.</p>
                        ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between mt-1">
                                <span className="truncate pr-2">{getSelectedSellersText()}</span><ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <div className="p-2">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Pesquisar vendedor..."
                                        value={analysisSellerSearch}
                                        onChange={(e) => setAnalysisSellerSearch(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                  </div>
                                </div>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-[200px]">
                                {uniqueSellersForAnalysis
                                    .filter(seller => seller.toLowerCase().includes(analysisSellerSearch.toLowerCase()))
                                    .map((seller) => (
                                    <DropdownMenuCheckboxItem key={seller} checked={analysis_selectedSellersSet.has(seller)}
                                        onCheckedChange={(checked) => setAnalysis_selectedSellers(prev => checked ? [...prev, seller] : prev.filter(s => s !== seller))}
                                        onSelect={(e) => e.preventDefault()}>{seller}</DropdownMenuCheckboxItem>
                                    ))}
                                {uniqueSellersForAnalysis.filter(seller => seller.toLowerCase().includes(analysisSellerSearch.toLowerCase())).length === 0 && uniqueSellersForAnalysis.length > 0 && (
                                    <p className="px-2 py-1.5 text-sm text-muted-foreground text-center">Nenhum resultado.</p>
                                )}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                    </CardContent>
                </Card>
                
                <SellerPerformanceDashboard 
                    performanceMetricsList={analysis_sellerPerformanceData} 
                    isLoading={isSellerPerformanceLoading || (isLoading && analysis_selectedSellers.length > 0 && analysis_sellerPerformanceData.length === 0 && analysis_productsFilteredByMarketplace.length > 0 )} 
                    selectedSellersCount={analysis_selectedSellers.length} 
                    selectedSellerNames={analysis_selectedSellers} 
                    internalSkusMap={internalSkusMap}
                />
            </section>
            
            <Separator className="my-8" />
            
            <section aria-labelledby="buybox-analysis-title" className="space-y-6">
                <h2 id="buybox-analysis-title" className="sr-only">Análise de Buybox Global (Todos Vendedores)</h2>
                <BuyboxWinnersDisplay buyboxWinners={buyboxWinners} isLoading={isLoading && buyboxWinners.length === 0 && analysis_productsFilteredByMarketplace.length > 0} />
                {(isLoading && analysis_productsFilteredByMarketplace.length === 0 && allProducts.length > 0 && (analysis_selectedMarketplace !== null || analysis_selectedInternalSkus.length > 0 || analysis_selectedMarcas.length > 0)) && <p className="text-center text-muted-foreground">Carregando dados de buybox por vendedor...</p>}
                {(!isLoading && analysis_productsFilteredByMarketplace.length === 0 && allProducts.length > 0 && (analysis_selectedMarketplace !== null || analysis_selectedInternalSkus.length > 0 || analysis_selectedMarcas.length > 0)) &&
                    <Card className="shadow-lg"><CardHeader><CardTitle>Vencedores de Buybox por Loja (Global)</CardTitle><CardDescription>Nenhum produto encontrado para os filtros selecionados.</CardDescription></CardHeader></Card>
                }
            </section>
          </TabsContent>

           <TabsContent value="product-overview" className="space-y-6">
            <Card className="shadow-lg p-2 sm:p-6">
              <CardHeader className="pb-4 px-2 sm:px-6">
                <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" />Filtros para Visão Geral</CardTitle>
                <CardDescription>Filtre a lista de SKUs únicos abaixo.</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overview-marketplace-filter" className="text-sm font-medium">Marketplace de Ocorrência</Label>
                    <Select value={overviewTab_selectedMarketplace || ALL_MARKETPLACES_OPTION_VALUE} onValueChange={handleOverviewMarketplaceChange}>
                      <SelectTrigger id="overview-marketplace-filter" className="mt-1"><SelectValue placeholder="Selecione um marketplace..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_MARKETPLACES_OPTION_VALUE}>Todos os Marketplaces</SelectItem>
                        {uniqueMarketplaces.map(mp => <SelectItem key={`mp-filter-overview-${mp}`} value={mp}>{mp}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="overview-search" className="text-sm font-medium">Pesquisar</Label>
                    <SearchBar searchTerm={overviewTab_searchTerm} onSearchChange={setOverviewTab_searchTerm} placeholder="Descrição, SKU, SKU Interno, Marca..." className="mt-1"/>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="text-sm text-muted-foreground mb-4">{overviewProductCountMessage}</div>
            <ProductSummaryTable summaries={overviewTab_filteredSummaries} isLoading={isLoading && uniqueProductSummaries.length === 0} onInternalSkuChange={handleInternalSkuChange} onBrandChange={handleBrandChange}/>
          </TabsContent>

          <TabsContent value="price-change-sellers" className="space-y-6">
            <Card className="shadow-lg p-2 sm:p-6">
                <CardHeader className="pb-4 px-2 sm:px-6">
                    <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" />Filtros para Vendedores com Mudanças</CardTitle>
                    <CardDescription>Refine a lista de vendedores e produtos com alterações de preço.</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="pricechange-marketplace-filter" className="text-sm font-medium">Filtrar por Marketplace</Label>
                        <Select value={priceChangeTab_selectedMarketplace || ALL_MARKETPLACES_OPTION_VALUE} onValueChange={handlePriceChangeTabMarketplaceChange}>
                            <SelectTrigger id="pricechange-marketplace-filter" className="mt-1"><SelectValue placeholder="Selecione um marketplace..." /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value={ALL_MARKETPLACES_OPTION_VALUE}>Todos os Marketplaces</SelectItem>
                            {uniqueMarketplaces.map(mp => <SelectItem key={`mp-filter-pricechange-${mp}`} value={mp}>{mp}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="pricechange-internal-sku-filter" className="text-sm font-medium">Filtrar por SKU(s) Interno(s)</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between mt-1">
                                <span className="truncate pr-2">{getSelectedItemsText(priceChangeTab_selectedInternalSkus, "Selecione SKU(s) Interno(s)...", "SKU Interno")}</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <div className="p-2">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Pesquisar SKU..."
                                        value={priceChangeInternalSkuSearch}
                                        onChange={(e) => setPriceChangeInternalSkuSearch(e.target.value)}
                                        className="h-9 pl-8"
                                    />
                                  </div>
                                </div>
                                <DropdownMenuSeparator />
                                 {uniqueInternalSkuValues.length === 0 && (<p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum SKU interno mapeado.</p>)}
                                <ScrollArea className="h-[200px]">
                                {uniqueInternalSkuValues
                                    .filter(sku => sku.toLowerCase().includes(priceChangeInternalSkuSearch.toLowerCase()))
                                    .map((sku) => (
                                    <DropdownMenuCheckboxItem key={`internal-sku-filter-pricechange-${sku}`} checked={priceChangeTab_selectedInternalSkusSet.has(sku)}
                                        onCheckedChange={(checked) => setPriceChangeTab_selectedInternalSkus(prev => checked ? [...prev, sku] : prev.filter(s => s !== sku))}
                                        onSelect={(e) => e.preventDefault()}>{sku}</DropdownMenuCheckboxItem>
                                    ))}
                                {uniqueInternalSkuValues.filter(sku => sku.toLowerCase().includes(priceChangeInternalSkuSearch.toLowerCase())).length === 0 && uniqueInternalSkuValues.length > 0 && (
                                    <p className="px-2 py-1.5 text-sm text-muted-foreground text-center">Nenhum resultado.</p>
                                )}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                   </div>
                </CardContent>
            </Card>
            <PriceChangeSellersDisplay allProducts={priceChangeTab_filteredProducts} isLoading={isLoading && allProducts.length === 0} />
          </TabsContent>

          <TabsContent value="sku-import" className="space-y-6">
            <SkuImportTab onImport={handleBulkInternalSkuImport} allProducts={allProducts} internalSkusMap={internalSkusMap} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="bg-card text-card-foreground py-6 text-center text-sm border-t">
        <p>&copy; {new Date().getFullYear()} MONITORAMENTO DE PREÇOS. Todos os direitos reservados.</p>
      </footer>
      <Toaster />
    </div>
  );
}

    
