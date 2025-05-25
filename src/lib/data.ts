import type { Product, PriceTrendProductInfo, Metrics } from './types';
import { parseISO, compareDesc, differenceInDays } from 'date-fns';

export const mockProducts: Product[] = [
  {
    id: 'SKU001',
    sku: 'SKU001',
    loja: 'Tech Emporium',
    preco_final: 1299.99,
    data_hora: '2024-05-01T10:00:00Z',
    marketplace: 'OnlineStore',
    descricao: 'Advanced Laptop Pro 15"',
    avaliacao: 4.8,
    imagem: 'https://placehold.co/300x200.png',
  },
  {
    id: 'SKU001_old',
    sku: 'SKU001',
    loja: 'Tech Emporium',
    preco_final: 1399.99,
    data_hora: '2024-03-15T10:00:00Z',
    marketplace: 'OnlineStore',
    descricao: 'Advanced Laptop Pro 15"',
    avaliacao: 4.8,
    imagem: 'https://placehold.co/300x200.png',
  },
  {
    id: 'SKU002',
    sku: 'SKU002',
    loja: 'Gadget Hub',
    preco_final: 79.50,
    data_hora: '2024-05-10T14:30:00Z',
    marketplace: 'LocalShop',
    descricao: 'Wireless Bluetooth Headphones',
    avaliacao: 4.5,
    imagem: 'https://placehold.co/300x200.png',
  },
  {
    id: 'SKU003',
    sku: 'SKU003',
    loja: 'Home Essentials',
    preco_final: 45.00,
    data_hora: '2024-05-05T09:15:00Z',
    marketplace: 'MegaMart',
    descricao: 'Smart Coffee Maker with Timer',
    avaliacao: 4.2,
    imagem: 'https://placehold.co/300x200.png',
  },
  {
    id: 'SKU004',
    sku: 'SKU004',
    loja: 'Tech Emporium',
    preco_final: 249.00,
    data_hora: '2024-04-20T11:00:00Z',
    marketplace: 'OnlineStore',
    descricao: 'Ultra HD 27" Monitor',
    avaliacao: 4.9,
    imagem: 'https://placehold.co/300x200.png',
  },
  {
    id: 'SKU004_new',
    sku: 'SKU004',
    loja: 'Tech Emporium',
    preco_final: 239.00,
    data_hora: '2024-05-12T11:00:00Z',
    marketplace: 'OnlineStore',
    descricao: 'Ultra HD 27" Monitor',
    avaliacao: 4.9,
    imagem: 'https://placehold.co/300x200.png',
  },
  {
    id: 'SKU005',
    sku: 'SKU005',
    loja: 'Gadget Hub',
    preco_final: 19.99,
    data_hora: '2024-05-11T18:00:00Z',
    marketplace: 'LocalShop',
    descricao: 'Portable USB Charger',
    avaliacao: 4.0,
    imagem: 'https://placehold.co/300x200.png',
  },
   {
    id: 'SKU006',
    sku: 'SKU006',
    loja: 'Book Nook',
    preco_final: 15.99,
    data_hora: '2024-01-10T10:00:00Z',
    marketplace: 'OnlineStore',
    descricao: 'The Alchemist by Paulo Coelho',
    avaliacao: 4.9,
    imagem: 'https://placehold.co/300x200.png',
  },
  {
    id: 'SKU006_new',
    sku: 'SKU006',
    loja: 'Book Nook',
    preco_final: 12.99,
    data_hora: '2024-05-13T10:00:00Z',
    marketplace: 'OnlineStore',
    descricao: 'The Alchemist by Paulo Coelho',
    avaliacao: 4.9,
    imagem: 'https://placehold.co/300x200.png',
  }
];

export const fetchData = async (): Promise<Product[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, you would fetch from an API endpoint
  // For example: const response = await fetch('/api/products');
  // const data = await response.json();
  // return data;
  return mockProducts.map(p => ({...p, data_hora: parseISO(p.data_hora).toISOString()}));
};

export const calculateMetrics = (products: Product[]): Metrics => {
  if (products.length === 0) {
    return {
      averagePrice: 0,
      topRatedProduct: null,
      mostFrequentStore: null,
    };
  }

  const averagePrice = products.reduce((sum, p) => sum + p.preco_final, 0) / products.length;

  const topRatedProduct = [...products].sort((a, b) => b.avaliacao - a.avaliacao)[0] || null;

  const storeCounts = products.reduce((acc, p) => {
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
    const skuProducts = productsBySku[sku].sort((a, b) => 
      compareDesc(parseISO(a.data_hora), parseISO(b.data_hora)) // Sorts ascending by date
    );

    if (skuProducts.length < 2) continue;

    const earliestEntry = skuProducts[0];
    const latestEntry = skuProducts[skuProducts.length - 1];
    
    // Ensure there's a meaningful time difference for trend
    if (differenceInDays(parseISO(latestEntry.data_hora), parseISO(earliestEntry.data_hora)) < 1) continue;


    const priceChangePercentage = ((latestEntry.preco_final - earliestEntry.preco_final) / earliestEntry.preco_final) * 100;

    if (Math.abs(priceChangePercentage) > 0) { // Consider any change significant for this demo
      priceChanges.push({
        sku: latestEntry.sku,
        descricao: latestEntry.descricao,
        loja: latestEntry.loja,
        marketplace: latestEntry.marketplace,
        earliest_price: earliestEntry.preco_final,
        latest_price: latestEntry.preco_final,
        earliest_date: earliestEntry.data_hora,
        latest_date: latestEntry.data_hora,
        price_change_percentage: priceChangePercentage,
        imagem: latestEntry.imagem,
      });
    }
  }

  return priceChanges
    .sort((a, b) => Math.abs(b.price_change_percentage) - Math.abs(a.price_change_percentage))
    .slice(0, count);
};
