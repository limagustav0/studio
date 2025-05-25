
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Product, PriceTrendProductInfo, Metrics } from '@/lib/types';
import { fetchData, calculateMetrics, analyzePriceTrends } from '@/lib/data';
import { AppHeader } from '@/components/AppHeader';
import { ProductList } from '@/components/ProductList';
import { SearchBar } from '@/components/SearchBar';
import { MetricsDashboard } from '@/components/MetricsDashboard';
import { PriceTrendDisplay } from '@/components/PriceTrendDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"; // Import standard Card components

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trendProducts, setTrendProducts] = useState<PriceTrendProductInfo[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const products = await fetchData();
        setAllProducts(products);
        setMetrics(calculateMetrics(products));
        setTrendProducts(analyzePriceTrends(products));
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
      }
    }
    loadData();
  }, [toast]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    return allProducts.filter(product =>
      product.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.loja.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allProducts, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <section aria-labelledby="metrics-title">
          <h2 id="metrics-title" className="sr-only">Métricas Chave</h2>
          {isLoading && !metrics ? <MetricsDashboard metrics={null} /> : <MetricsDashboard metrics={metrics} />}
        </section>
        
        <section aria-labelledby="price-trends-title" className="mb-8">
           <h2 id="price-trends-title" className="sr-only">Análise de Tendências de Preços</h2>
          {isLoading && trendProducts.length === 0 ? (
             <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ) : (
            <PriceTrendDisplay trendProducts={trendProducts} />
          )}
        </section>

        <section aria-labelledby="search-products-title" className="mb-8">
          <h2 id="search-products-title" className="sr-only">Pesquisar Produtos</h2>
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </section>

        <section aria-labelledby="product-list-title">
          <h2 id="product-list-title" className="text-2xl font-semibold mb-6 text-center md:text-left">Lista de Produtos</h2>
          {isLoading && filteredProducts.length === 0 && allProducts.length === 0 ? (
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
          ) : (
            <ProductList products={filteredProducts} />
          )}
        </section>
      </main>
      <footer className="bg-card text-card-foreground py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Painel PriceWise. Todos os direitos reservados.</p>
      </footer>
      <Toaster />
    </div>
  );
}
