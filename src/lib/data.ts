
import type { Product, PriceTrendProductInfo, Metrics } from './types';
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
        // Using SKU, loja, a sanitized data_hora, and index for uniqueness.
        const sanitizedDateTime = (apiProduct.data_hora || '').replace(/[\s:-]/g, ''); // Remove spaces, hyphens, and colons
        currentId = `fallback-${apiProduct.sku || 'no-sku'}-${apiProduct.loja || 'no-loja'}-${sanitizedDateTime}-${index}`;
      }
      return {
        id: String(currentId), // Ensure id is always a string
        sku: apiProduct.sku,
        loja: apiProduct.loja,
        preco_final: parseFloat(apiProduct.preco_final) || 0,
        // Convert "YYYY-MM-DD HH:MM:SS" to ISO string "YYYY-MM-DDTHH:MM:SSZ" (assuming UTC if no tz info)
        data_hora: (apiProduct.data_hora || '').includes('T') ? (apiProduct.data_hora || '') : (apiProduct.data_hora || '').replace(' ', 'T') + 'Z',
        marketplace: apiProduct.marketplace,
        descricao: apiProduct.descricao,
        avaliacao: parseFloat(apiProduct.avaliacao) || 0,
        imagem: apiProduct.imagem || 'https://placehold.co/300x200.png', // Fallback if image is missing
      };
    });

  } catch (error) { // This catches network errors or errors from response.json()
    console.error(`Fetch operation failed for ${apiUrl}:`, error);
    if (error instanceof Error) {
      // Re-throw the original error to preserve its type and message for the caller
      throw error;
    }
    // For other types of thrown values (less common with fetch)
    throw new Error('An unknown error occurred while fetching product data.');
  }
};

export const calculateMetrics = (products: Product[]): Metrics => {
  if (products.length === 0) {
    return {
      averagePrice: 0,
      topRatedProduct: null,
      mostFrequentStore: null,
    };
  }

  const validProducts = products.filter(p => p && !isNaN(p.preco_final) && !isNaN(p.avaliacao));

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
    acc[p.loja] = (acc[p.loja] || 0) + 1;
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
  const productsBySku: Record<string, Product[]> = {};
  products.forEach(product => {
    if (!product || !product.sku) return; // Skip if product or sku is null/undefined
    if (!productsBySku[product.sku]) {
      productsBySku[product.sku] = [];
    }
    productsBySku[product.sku].push(product);
  });

  const priceChanges: PriceTrendProductInfo[] = [];

  for (const sku in productsBySku) {
    // Sorts ascending by date (earliest first) then take first and last for comparison
    const skuProducts = productsBySku[sku]
      .filter(p => p && p.data_hora) // Ensure product and data_hora exist
      .sort((a, b) => 
        parseISO(a.data_hora).getTime() - parseISO(b.data_hora).getTime()
      );

    if (skuProducts.length < 2) continue;

    const productAtEarliestDate = skuProducts[0]; 
    const productAtLatestDate = skuProducts[skuProducts.length - 1];
    
    try {
      // Ensure dates are valid and there's at least some difference
      const earliestDate = parseISO(productAtEarliestDate.data_hora);
      const latestDate = parseISO(productAtLatestDate.data_hora);
      if (differenceInDays(latestDate, earliestDate) < 1 && productAtEarliestDate.preco_final === productAtLatestDate.preco_final) continue;
    } catch (e) {
      console.warn(`Skipping trend analysis for SKU ${sku} due to invalid date format or insufficient data. Error: ${e}`);
      continue;
    }

    const priceChangePercentage = ((productAtLatestDate.preco_final - productAtEarliestDate.preco_final) / productAtEarliestDate.preco_final) * 100;

    // Only include if there's an actual price change, or if you want to show all significant changes (even if 0 if dates differ)
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
        price_change_percentage: priceChangePercentage,
        imagem: productAtLatestDate.imagem,
      });
    }
  }

  return priceChanges
    .sort((a, b) => Math.abs(b.price_change_percentage) - Math.abs(a.price_change_percentage))
    .slice(0, count);
};

