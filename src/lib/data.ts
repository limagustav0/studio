
import type { Product, PriceTrendProductInfo, Metrics, BuyboxWinner, SellerAnalysisMetrics, ProductLosingBuyboxInfo, ProductWinningBuyboxInfo, UniqueProductSummary, BrandBuyboxWinSummary, InternalSkuMapping, SellerMarketplaceWinSummary } from './types';
import { parseISO, compareDesc, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  change_price?: any; // Can be boolean, string "true"/"false", number 1/0, or a count
  status?: string;
}

const parseChangePriceToNumericCount = (value: any): number => {
  if (typeof value === 'number') {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return 1;
    if (value.toLowerCase() === 'false') return 0;
    const num = parseInt(value, 10);
    if (!isNaN(num)) return Math.max(0, Math.floor(num));
    return 0;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return 0;
};

export const fetchData = async (): Promise<Product[]> => {
  const apiUrl = '/api/price-data';
  try {
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

    const activeApiProducts = apiProducts.filter(apiProduct => apiProduct.status === "ativo");

    return activeApiProducts.map((apiProduct: ApiProduct, index: number): Product => {
      let currentId = apiProduct.id;
      if (!currentId || String(currentId).trim() === "") {
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
        change_price: parseChangePriceToNumericCount(apiProduct.change_price),
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
      totalDataPoints: 0,
      uniqueSKUs: 0,
      uniqueSellers: 0,
      uniqueMarketplaces: 0,
    };
  }

  const validProducts = products.filter(p => p && typeof p.preco_final === 'number' && !isNaN(p.preco_final) && typeof p.avaliacao === 'number' && !isNaN(p.avaliacao));

  if (validProducts.length === 0) {
    return {
      averagePrice: 0,
      topRatedProduct: null,
      mostFrequentStore: null,
      totalDataPoints: products.length,
      uniqueSKUs: new Set(products.map(p => p.sku).filter(Boolean)).size,
      uniqueSellers: new Set(products.map(p => p.loja).filter(Boolean)).size,
      uniqueMarketplaces: new Set(products.map(p => p.marketplace).filter(Boolean)).size,
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

  const totalDataPoints = products.length;
  const uniqueSKUs = new Set(products.map(p => p.sku).filter(Boolean)).size;
  const uniqueSellers = new Set(products.map(p => p.loja).filter(Boolean)).size;
  const uniqueMarketplaces = new Set(products.map(p => p.marketplace).filter(Boolean)).size;

  return {
    averagePrice,
    topRatedProduct,
    mostFrequentStore,
    totalDataPoints,
    uniqueSKUs,
    uniqueSellers,
    uniqueMarketplaces,
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
      parseISO(productAtEarliestDate.data_hora);
      parseISO(productAtLatestDate.data_hora);
      if (productAtEarliestDate.data_hora === productAtLatestDate.data_hora && productAtEarliestDate.preco_final === productAtLatestDate.preco_final) continue;
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

    let minPrice = Infinity;
    skuProducts.forEach(p => {
      if (p.preco_final < minPrice) {
        minPrice = p.preco_final;
      }
    });

    if (minPrice === Infinity) continue;

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


export const analyzeSellerPerformance = (
  allProducts: Product[],
  selectedSellerName: string
): SellerAnalysisMetrics | null => {
  if (!allProducts || allProducts.length === 0 || !selectedSellerName) {
    return null;
  }

  const sellerProducts = allProducts.filter(p => p.loja === selectedSellerName);
  let lastUpdateTime: string | null = null;

  if (sellerProducts.length > 0) {
    sellerProducts.sort((a, b) => {
      try {
        if (!a.data_hora && !b.data_hora) return 0;
        if (!a.data_hora) return 1;
        if (!b.data_hora) return -1;
        return compareDesc(parseISO(a.data_hora), parseISO(b.data_hora));
      } catch {
        return 0;
      }
    });
    if (sellerProducts[0] && sellerProducts[0].data_hora) {
      try {
        parseISO(sellerProducts[0].data_hora);
        lastUpdateTime = sellerProducts[0].data_hora;
      } catch (e) {
        console.warn("Could not parse date for lastUpdateTime", e);
        lastUpdateTime = null;
      }
    }
  }

  if (sellerProducts.length === 0) {
    return {
      sellerName: selectedSellerName,
      totalProductsListed: 0,
      buyboxesWon: 0,
      buyboxesLost: 0,
      productsLosingBuybox: [],
      productsWinningBuybox: [],
      marketplaceWins: [],
      lastUpdateTime: null,
    };
  }

  let buyboxesWonCount = 0;
  const productsLosingBuybox: ProductLosingBuyboxInfo[] = [];
  const productsWinningBuybox: ProductWinningBuyboxInfo[] = [];
  const sellerMarketplaceWinsMap: Record<string, Set<string>> = {}; // Marketplace -> Set<SKU>

  const productsBySkuGlobal: Record<string, Product[]> = {};
  allProducts.forEach(p => {
    if (!p || !p.sku || p.preco_final === null || p.preco_final === undefined) return;
    if (!productsBySkuGlobal[p.sku]) {
      productsBySkuGlobal[p.sku] = [];
    }
    productsBySkuGlobal[p.sku].push(p);
  });

  const skusListedBySeller = new Set(sellerProducts.map(p => p.sku));

  skusListedBySeller.forEach(sku => {
    const sellerProductInstancesForSku = sellerProducts
      .filter(p => p.sku === sku && p.data_hora)
      .sort((a,b) => compareDesc(parseISO(a.data_hora), parseISO(b.data_hora)));

    if (sellerProductInstancesForSku.length === 0) return;
    const sellerProductForSku = sellerProductInstancesForSku[0]; // Most recent product from the seller for this SKU

    const allListingsForThisSku = productsBySkuGlobal[sku] || [];

    if (allListingsForThisSku.length === 0) { // Seller is the only one listing this SKU
      buyboxesWonCount++;
      productsWinningBuybox.push({
        sku: sellerProductForSku.sku,
        descricao: sellerProductForSku.descricao,
        imagem: sellerProductForSku.imagem,
        data_hora: sellerProductForSku.data_hora,
        sellerPrice: sellerProductForSku.preco_final,
        winningPrice: sellerProductForSku.preco_final,
        winningSeller: selectedSellerName,
        priceDifferenceToNext: null,
        nextCompetitorSellerName: null,
        marketplace: sellerProductForSku.marketplace,
      });
      if (sellerProductForSku.marketplace) {
        if (!sellerMarketplaceWinsMap[sellerProductForSku.marketplace]) {
          sellerMarketplaceWinsMap[sellerProductForSku.marketplace] = new Set();
        }
        sellerMarketplaceWinsMap[sellerProductForSku.marketplace].add(sku);
      }
      return;
    }

    let globalMinPrice = Infinity;
    let winningSellerForSkuAtGlobalMin = '';

    allListingsForThisSku.forEach(p => {
      if (p.preco_final < globalMinPrice) {
        globalMinPrice = p.preco_final;
        winningSellerForSkuAtGlobalMin = p.loja;
      } else if (p.preco_final === globalMinPrice) {
        // Prioritize the selected seller if prices are tied
        if (winningSellerForSkuAtGlobalMin !== selectedSellerName && p.loja === selectedSellerName) {
           winningSellerForSkuAtGlobalMin = selectedSellerName;
        } else if (!winningSellerForSkuAtGlobalMin) { // If no winner yet, assign
            winningSellerForSkuAtGlobalMin = p.loja;
        }
      }
    });

    const sellerPriceForSku = sellerProductForSku.preco_final;

    if (sellerPriceForSku <= globalMinPrice) { // Seller is winning or tied for winning
      buyboxesWonCount++;
      let nextCompetitorPrice: number | null = null;
      let nextCompetitorName: string | null = null;

      // Find next competitor in the *same marketplace* as the seller's product instance
      const competitorsInSameMarketplace = allListingsForThisSku
        .filter(p => p.loja !== selectedSellerName && p.marketplace === sellerProductForSku.marketplace);

      competitorsInSameMarketplace
        .forEach(competitor => {
          if (nextCompetitorPrice === null || competitor.preco_final < nextCompetitorPrice) {
            nextCompetitorPrice = competitor.preco_final;
            nextCompetitorName = competitor.loja;
          } else if (competitor.preco_final === nextCompetitorPrice) {
             // Could handle multiple tied competitors if needed, for now, just take one
            nextCompetitorName = competitor.loja;
          }
        });
      
      let priceDifferenceToNext: number | null = null;
      if (nextCompetitorPrice !== null) {
        priceDifferenceToNext = nextCompetitorPrice - sellerPriceForSku;
      }

      productsWinningBuybox.push({
        sku: sellerProductForSku.sku,
        descricao: sellerProductForSku.descricao,
        imagem: sellerProductForSku.imagem,
        data_hora: sellerProductForSku.data_hora,
        sellerPrice: sellerPriceForSku,
        winningPrice: sellerPriceForSku, // Seller is winning
        winningSeller: selectedSellerName,
        priceDifferenceToNext: priceDifferenceToNext,
        nextCompetitorSellerName: (priceDifferenceToNext !== null && priceDifferenceToNext >=0 && nextCompetitorPrice !== null) ? nextCompetitorName : null,
        marketplace: sellerProductForSku.marketplace,
      });
      
      if (sellerProductForSku.marketplace) {
        if (!sellerMarketplaceWinsMap[sellerProductForSku.marketplace]) {
          sellerMarketplaceWinsMap[sellerProductForSku.marketplace] = new Set();
        }
        sellerMarketplaceWinsMap[sellerProductForSku.marketplace].add(sku);
      }

    } else { // Seller is losing
      productsLosingBuybox.push({
        sku: sellerProductForSku.sku,
        descricao: sellerProductForSku.descricao,
        imagem: sellerProductForSku.imagem,
        data_hora: sellerProductForSku.data_hora,
        sellerPrice: sellerPriceForSku,
        winningPrice: globalMinPrice,
        winningSeller: winningSellerForSkuAtGlobalMin,
        priceDifference: sellerPriceForSku - globalMinPrice,
        marketplace: sellerProductForSku.marketplace,
      });
    }
  });

  const marketplaceWinsArray: SellerMarketplaceWinSummary[] = Object.entries(sellerMarketplaceWinsMap)
    .map(([marketplace, skus]) => ({ marketplace, wins: skus.size }))
    .sort((a, b) => b.wins - a.wins || a.marketplace.localeCompare(b.marketplace));
  
  // Count unique SKUs won for the main buyboxesWon metric
  const uniqueWinningSkus = new Set(productsWinningBuybox.map(p => p.sku));
  const finalBuyboxesWon = uniqueWinningSkus.size;
  
  const uniqueLosingSkus = new Set(productsLosingBuybox.map(p => p.sku));
  const finalBuyboxesLost = uniqueLosingSkus.size;

  return {
    sellerName: selectedSellerName,
    totalProductsListed: sellerProducts.length, // Total listings, not unique SKUs
    buyboxesWon: finalBuyboxesWon,
    buyboxesLost: finalBuyboxesLost,
    productsLosingBuybox: productsLosingBuybox.sort((a,b) => b.priceDifference - a.priceDifference),
    productsWinningBuybox: productsWinningBuybox.sort((a,b) => (a.priceDifferenceToNext ?? Infinity) - (b.priceDifferenceToNext ?? Infinity) || a.descricao.localeCompare(b.descricao)),
    marketplaceWins: marketplaceWinsArray,
    lastUpdateTime,
  };
};


export const generateUniqueProductSummaries = (products: Product[]): UniqueProductSummary[] => {
  if (!products || products.length === 0) return [];

  const productsBySku: Record<string, Product[]> = {};
  products.forEach(product => {
    if (!product || !product.sku) return;
    if (!productsBySku[product.sku]) {
      productsBySku[product.sku] = [];
    }
    productsBySku[product.sku].push(product);
  });

  const summaries: UniqueProductSummary[] = [];

  for (const sku in productsBySku) {
    const skuProducts = productsBySku[sku].filter(p => p && p.preco_final !== null && p.preco_final !== undefined);
    if (skuProducts.length === 0) continue;

    const sortedSkuProducts = [...skuProducts].sort((a, b) => {
      try {
        if (!a.data_hora && !b.data_hora) return 0;
        if (!a.data_hora) return 1;
        if (!b.data_hora) return -1;
        return compareDesc(parseISO(a.data_hora), parseISO(b.data_hora));
      } catch {
        return 0;
      }
    });

    const latestProductInstance = sortedSkuProducts[0];
    if (!latestProductInstance) continue;


    const uniqueMarketplacesForSku = Array.from(new Set(skuProducts.map(p => p.marketplace).filter(Boolean)));
    const uniqueSellersForSku = new Set(skuProducts.map(p => p.loja).filter(Boolean));

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    skuProducts.forEach(p => {
      if (p.preco_final < minPrice) minPrice = p.preco_final;
      if (p.preco_final > maxPrice) maxPrice = p.preco_final;
    });

    minPrice = minPrice === Infinity ? 0 : minPrice;
    maxPrice = maxPrice === -Infinity ? 0 : maxPrice;

    summaries.push({
      sku: sku,
      descricao: latestProductInstance.descricao,
      imagem: latestProductInstance.imagem,
      marketplaces: uniqueMarketplacesForSku.sort(),
      latestScrapeDate: latestProductInstance.data_hora,
      sellerCount: uniqueSellersForSku.size,
      minPrice: minPrice,
      maxPrice: maxPrice,
    });
  }

  return summaries.sort((a,b) => b.sellerCount - a.sellerCount || a.sku.localeCompare(b.sku));
};

export const calculateBrandBuyboxWins = (
  products: Product[],
  internalSkusMap: Record<string, InternalSkuMapping>
): BrandBuyboxWinSummary[] => {
  if (!products || products.length === 0 || Object.keys(internalSkusMap).length === 0) {
    return [];
  }

  const productsBySku: Record<string, Product[]> = {};
  products.forEach(product => {
    if (!product || !product.sku || product.preco_final === null || product.preco_final === undefined) return;
    if (!productsBySku[product.sku]) {
      productsBySku[product.sku] = [];
    }
    productsBySku[product.sku].push(product);
  });

  const buyboxWinningSkusByBrand: Record<string, Set<string>> = {};

  for (const principalSku in productsBySku) {
    const skuProducts = productsBySku[principalSku];
    if (skuProducts.length === 0) continue;

    let minPrice = Infinity;
    skuProducts.forEach(p => {
      if (p.preco_final < minPrice) {
        minPrice = p.preco_final;
      }
    });

    if (minPrice === Infinity) continue;

    const brandMapping = internalSkusMap[principalSku];
    const brand = brandMapping?.marca;

    if (brand) {
      // Check if any product instance for this SKU has the minPrice
      const isWinningSkuForBrand = skuProducts.some(p => p.preco_final === minPrice);
      if (isWinningSkuForBrand) {
        if (!buyboxWinningSkusByBrand[brand]) {
          buyboxWinningSkusByBrand[brand] = new Set<string>();
        }
        buyboxWinningSkusByBrand[brand].add(principalSku);
      }
    }
  }

  return Object.entries(buyboxWinningSkusByBrand)
    .map(([marca, winningSkusSet]) => ({
      marca,
      wins: winningSkusSet.size,
    }))
    .sort((a, b) => b.wins - a.wins || a.marca.localeCompare(b.marca));
};

// This function is no longer needed here as its purpose is now part of analyzeSellerPerformance or specific brand analysis
// export const calculateMarketplaceBuyboxWins = (products: Product[]): MarketplaceBuyboxWinSummary[] => { ... }
