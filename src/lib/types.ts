
export interface Product {
  id: string;
  sku: string;
  loja: string;
  preco_final: number;
  data_hora: string; // ISO date string
  marketplace: string;
  descricao: string;
  avaliacao: number; // e.g., 0-5
  imagem: string;
  change_price?: number;
}

export interface PriceTrendProductInfo {
  sku: string;
  descricao: string;
  loja: string;
  marketplace: string;
  earliest_price: number;
  latest_price: number;
  earliest_date: string;
  latest_date: string;
  price_change_percentage: number;
  imagem: string;
}

export interface Metrics {
  averagePrice: number;
  topRatedProduct: Product | null;
  mostFrequentStore: { store: string; count: number } | null;
  totalDataPoints: number;
  uniqueSKUs: number;
  uniqueSellers: number;
  uniqueMarketplaces: number;
}

export interface BuyboxWinner {
  seller: string;
  wins: number;
}

// Types for Seller Performance Analysis
export interface ProductLosingBuyboxInfo {
  sku: string;
  descricao: string;
  imagem: string;
  data_hora: string;
  sellerPrice: number;
  winningPrice: number;
  winningSeller: string;
  priceDifference: number;
  marketplace: string;
  internalSku?: string;
  marca?: string;
}

export interface ProductWinningBuyboxInfo {
  sku: string;
  descricao: string;
  imagem: string;
  data_hora: string;
  sellerPrice: number;
  winningPrice: number; // This will be same as sellerPrice if they are winning
  winningSeller: string; // This will be the sellerName from SellerAnalysisMetrics
  priceDifferenceToNext?: number | null;
  nextCompetitorSellerName?: string | null; // Name of the seller with the next closest price
  marketplace: string;
  internalSku?: string;
  marca?: string;
}

export interface SellerAnalysisMetrics {
  sellerName: string;
  totalProductsListed: number;
  buyboxesWon: number;
  buyboxesLost: number;
  productsLosingBuybox: ProductLosingBuyboxInfo[];
  productsWinningBuybox: ProductWinningBuyboxInfo[];
  // marketplaceWins: SellerMarketplaceWinSummary[]; // Removed per user request to consolidate marketplace chart elsewhere
  lastUpdateTime: string | null;
}

export interface UniqueProductSummary {
  sku: string;
  descricao: string;
  imagem: string;
  marketplaces: string[]; // List of unique marketplaces this SKU is found in
  latestScrapeDate: string; // ISO date string of the most recent scrape for this SKU
  sellerCount: number; // Number of unique sellers for this SKU
  minPrice: number;
  maxPrice: number;
  internalSku?: string;
  marca?: string;
}

// Types for PriceChangeSellersDisplay
export interface SellerPriceChangeSummary {
  sellerName: string;
  totalChangeSum: number; // Sum of change_price counts
  distinctSkusChangedCount: number; // Count of unique SKUs with changes
}

export interface SkuChangeFrequency {
  sku: string;
  descricao: string;
  imagem: string;
  totalChangeSum: number; // Sum of change_price counts for this SKU
}

export interface AggregatedProductChangeDetail {
  sku: string;
  descricao: string;
  imagem: string;
  marketplace: string;
  totalChangesSum: number; // Sum of change_price for this specific SKU+Marketplace by the seller
  latestChangeDate: string | null; // Most recent data_hora for this change
}

export interface BrandBuyboxWinSummary {
  marca: string;
  wins: number; // Total unique SKUs this brand is winning
}

export interface MarketplaceBuyboxWinSummary {
  marketplace: string;
  wins: number; // Total unique SKUs won in this marketplace overall
}

export interface InternalSkuMapping {
  internalSku?: string;
  marca?: string;
}

