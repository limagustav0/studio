
import type { Product, PriceTrendProductInfo, Metrics, BuyboxWinner } from './types';
import { parseISO, compareDesc, differenceInDays } from 'date-fns';

interface ApiProduct {
  id: string;
  sku: string;
  loja: string;
  preco_original?: string;
  preco_final: string;
  desconto_percentual?: string;
  data_hora: string; // Format "YYYY-MM-DD HH:MM:SS"
  marketplace: string;
  descricao: string;
  avaliacao: string;
  num_avaliacoes?: string;
  link_produto?: string;
  imagem: string;
}

export const fetchData = async (): Promise<Product[]> => {
  const apiUrl = '/api/price-data'; // Use the proxied path
  try {
    // Fetch from the proxied API path
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (e) {
        // Ignore if can't read body
      }
      console.error(`API request to ${apiUrl} failed with status ${response.status}. Body: ${errorBody}`);
      throw new Error(`API request failed with status ${response.status}.`);
    }
    
    const apiProducts: ApiProduct[] = await response.json();

    // Transform API data to Product type
    return apiProducts.map((apiProduct: ApiProduct, index: number): Product => {
      let currentId = apiProduct.id;
      if (!currentId || String(currentId).trim() === "") {
        // If ID is missing or empty, create a fallback.
        const sanitizedDateTime = (apiProduct.data_hora || '').replace(/[\s:-]/g, ''); 
        currentId = `fallback-${apiProduct.sku || 'no-sku'}-${apiProduct.loja || 'no-loja'}-${sanitizedDateTime}-${index}`;
      }
      return {
        id: String(currentId), 
        sku: apiProduct.sku,
        loja: apiProduct.loja,
        preco_final: parseFloat(apiProduct.preco_final) || 0,
        data_hora: (apiProduct.data_hora || '').includes('T') ? (apiProduct.data_hora || '') : (apiProduct.data_hora || '').replace(' ', 'T') + 'Z',
        marketplace: apiProduct.marketplace,
        descricao: apiProduct.descricao,
        avaliacao: parseFloat(apiProduct.avaliacao) || 0,
        imagem: apiProduct.imagem || 'https://placehold.co/300x200.png', 
      };
    });

  } catch (error) { 
    console.error(`Fetch operation failed for ${apiUrl}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while fetching product data.');
  }
};

export const calculateMetrics = (products: Product[]): Metrics => {
  if (!products || products.length === 0) {
    return {
      averagePrice: 0,
      topRatedProduct: null,
      mostFrequentStore: null,
    };
  }

  const validProducts = products.filter(p => p && typeof p.preco_final === 'number' && !isNaN(p.preco_final) && typeof p.avaliacao === 'number' && !isNaN(p.avaliacao));

  if (validProducts.length === 0) {
    return {
      averagePrice: 0,
      topRatedProduct: null,
      mostFrequentStore: null,
    };
  }

  const averagePrice = validProducts.reduce((sum, p) => sum + p.preco_final, 0) / validProducts.length;

  const topRatedProduct = [...validProducts].sort((a, b) => b.avaliacao - a.avaliacao)[0] || null;

  const storeCounts = validProducts.reduce((acc, p) => {
    if (p.loja) {
      acc[p.loja] = (acc[p.loja] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mostFrequentStoreEntry = Object.entries(storeCounts).sort((a, b) => b[1] - a[1])[0];
  const mostFrequentStore = mostFrequentStoreEntry ? { store: mostFrequentStoreEntry[0], count: mostFrequentStoreEntry[1] } : null;

  return {
    averagePrice,
    topRatedProduct,
    mostFrequentStore,
  };
};

export const analyzePriceTrends = (products: Product[], count: number = 3): PriceTrendProductInfo[] => {
  if (!products || products.length === 0) return [];
  const productsBySku: Record<string, Product[]> = {};
  products.forEach(product => {
    if (!product || !product.sku) return; 
    if (!productsBySku[product.sku]) {
      productsBySku[product.sku] = [];
    }
    productsBySku[product.sku].push(product);
  });

  const priceChanges: PriceTrendProductInfo[] = [];

  for (const sku in productsBySku) {
    const skuProducts = productsBySku[sku]
      .filter(p => p && p.data_hora && p.preco_final !== null && p.preco_final !== undefined) 
      .sort((a, b) => {
        try {
          return parseISO(a.data_hora).getTime() - parseISO(b.data_hora).getTime();
        } catch {
          return 0; 
        }
      });

    if (skuProducts.length < 2) continue;

    const productAtEarliestDate = skuProducts[0]; 
    const productAtLatestDate = skuProducts[skuProducts.length - 1];
    
    try {
      const earliestDate = parseISO(productAtEarliestDate.data_hora);
      const latestDate = parseISO(productAtLatestDate.data_hora);
      if (differenceInDays(latestDate, earliestDate) < 1 && productAtEarliestDate.preco_final === productAtLatestDate.preco_final) continue;
    } catch (e) {
      console.warn(`Skipping trend analysis for SKU ${sku} due to invalid date format or insufficient data. Error: ${e}`);
      continue;
    }

    const priceChangePercentage = ((productAtLatestDate.preco_final - productAtEarliestDate.preco_final) / productAtEarliestDate.preco_final) * 100;

    if (Math.abs(priceChangePercentage) > 0.001 || productAtEarliestDate.data_hora !== productAtLatestDate.data_hora) { 
      priceChanges.push({
        sku: productAtLatestDate.sku,
        descricao: productAtLatestDate.descricao,
        loja: productAtLatestDate.loja,
        marketplace: productAtLatestDate.marketplace,
        earliest_price: productAtEarliestDate.preco_final,
        latest_price: productAtLatestDate.preco_final,
        earliest_date: productAtEarliestDate.data_hora,
        latest_date: productAtLatestDate.data_hora,
        price_change_percentage: isFinite(priceChangePercentage) ? priceChangePercentage : 0,
        imagem: productAtLatestDate.imagem,
      });
    }
  }

  return priceChanges
    .sort((a, b) => Math.abs(b.price_change_percentage) - Math.abs(a.price_change_percentage))
    .slice(0, count);
};

export const getUniqueMarketplaces = (products: Product[]): string[] => {
  if (!products) return [];
  const marketplaces = new Set(products.map(p => p.marketplace).filter(Boolean));
  return Array.from(marketplaces).sort();
};

export const getUniqueSellers = (products: Product[]): string[] => {
  if (!products) return [];
  const sellers = new Set(products.map(p => p.loja).filter(Boolean));
  return Array.from(sellers).sort();
};

export const calculateBuyboxWins = (products: Product[]): BuyboxWinner[] => {
  if (!products || products.length === 0) return [];

  const productsBySku: Record<string, Product[]> = {};
  products.forEach(product => {
    if (!product || !product.sku || product.preco_final === null || product.preco_final === undefined) return;
    if (!productsBySku[product.sku]) {
      productsBySku[product.sku] = [];
    }
    productsBySku[product.sku].push(product);
  });

  const buyboxWinsBySeller: Record<string, number> = {};

  for (const sku in productsBySku) {
    const skuProducts = productsBySku[sku];
    if (skuProducts.length === 0) continue;

    let minPrice = skuProducts[0].preco_final;
    skuProducts.forEach(p => {
      if (p.preco_final < minPrice) {
        minPrice = p.preco_final;
      }
    });

    const winningSellersThisSku = new Set<string>();
    skuProducts.forEach(p => {
      if (p.preco_final === minPrice && p.loja) {
        winningSellersThisSku.add(p.loja);
      }
    });

    winningSellersThisSku.forEach(seller => {
      buyboxWinsBySeller[seller] = (buyboxWinsBySeller[seller] || 0) + 1;
    });
  }

  return Object.entries(buyboxWinsBySeller)
    .map(([seller, wins]) => ({ seller, wins }))
    .sort((a, b) => b.wins - a.wins);
};
