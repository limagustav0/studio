
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
  // Fetch from the live API
  const response = await fetch('https://streamlit-apirest.onrender.com/api/products/');
  if (!response.ok) {
    console.error(`API request failed with status ${response.status}`);
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const apiProducts: ApiProduct[] = await response.json();

  // Transform API data to Product type
  return apiProducts.map((apiProduct: ApiProduct): Product => ({
    id: apiProduct.id,
    sku: apiProduct.sku,
    loja: apiProduct.loja,
    preco_final: parseFloat(apiProduct.preco_final) || 0,
    // Convert "YYYY-MM-DD HH:MM:SS" to ISO string "YYYY-MM-DDTHH:MM:SSZ" (assuming UTC)
    data_hora: apiProduct.data_hora.replace(' ', 'T') + 'Z',
    marketplace: apiProduct.marketplace,
    descricao: apiProduct.descricao,
    avaliacao: parseFloat(apiProduct.avaliacao) || 0,
    imagem: apiProduct.imagem || 'https://placehold.co/300x200.png', // Fallback if image is missing
  }));
};

export const calculateMetrics = (products: Product[]): Metrics => {
  if (products.length === 0) {
    return {
      averagePrice: 0,
      topRatedProduct: null,
      mostFrequentStore: null,
    };
  }

  // Filter out products with potentially invalid data due to parsing if needed, or ensure robust parsing
  const validProducts = products.filter(p => !isNaN(p.preco_final) && !isNaN(p.avaliacao));

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
    if (!productsBySku[product.sku]) {
      productsBySku[product.sku] = [];
    }
    productsBySku[product.sku].push(product);
  });

  const priceChanges: PriceTrendProductInfo[] = [];

  for (const sku in productsBySku) {
    // Sorts descending by date (latest first)
    const skuProducts = productsBySku[sku].sort((a, b) => 
      compareDesc(parseISO(a.data_hora), parseISO(b.data_hora)) 
    );

    if (skuProducts.length < 2) continue;

    const productAtLatestDate = skuProducts[0]; // Latest entry because of sort order
    const productAtEarliestDate = skuProducts[skuProducts.length - 1]; // Earliest entry
    
    // Ensure there's a meaningful time difference for trend
    // And that dates are valid before parsing
    try {
      if (differenceInDays(parseISO(productAtLatestDate.data_hora), parseISO(productAtEarliestDate.data_hora)) < 1) continue;
    } catch (e) {
      console.warn(`Skipping trend analysis for SKU ${sku} due to invalid date format.`);
      continue;
    }


    const priceChangePercentage = ((productAtLatestDate.preco_final - productAtEarliestDate.preco_final) / productAtEarliestDate.preco_final) * 100;

    if (Math.abs(priceChangePercentage) > 0) { // Consider any change significant for this demo
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

