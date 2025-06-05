
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
  marketplace: string; // Added marketplace
}

export interface ProductWinningBuyboxInfo {
  sku: string;
  descricao: string;
  imagem: string;
  data_hora: string;
  sellerPrice: number;
  winningPrice: number;
  winningSeller: string;
  priceDifferenceToNext?: number | null;
  marketplace: string; // Added marketplace here as well for consistency, even if not explicitly requested for this table yet
}

export interface SellerAnalysisMetrics {
  sellerName: string;
  totalProductsListed: number;
  buyboxesWon: number;
  buyboxesLost: number;
  productsLosingBuybox: ProductLosingBuyboxInfo[];
  productsWinningBuybox: ProductWinningBuyboxInfo[];
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
}

