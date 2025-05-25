import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Tag, Store, DollarSign, CalendarDays, Globe, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedDate = product.data_hora ? format(new Date(product.data_hora), 'PPpp') : 'N/A';
  
  // Choose an icon for marketplace
  const MarketplaceIcon = product.marketplace.toLowerCase().includes('online') ? Globe : ShoppingCart;

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="relative w-full h-48 mb-4 rounded-t-lg overflow-hidden">
          <Image 
            src={product.imagem || "https://placehold.co/300x200.png"} 
            alt={product.descricao} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="product item"
          />
        </div>
        <CardTitle className="text-lg leading-tight">{product.descricao}</CardTitle>
        <CardDescription className="flex items-center text-sm">
          <Tag className="h-4 w-4 mr-1 text-muted-foreground" /> SKU: {product.sku}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div className="flex items-center">
          <Store className="h-4 w-4 mr-2 text-primary" />
          <span>{product.loja}</span>
        </div>
        <div className="flex items-center">
          <MarketplaceIcon className="h-4 w-4 mr-2 text-primary" />
          <span>{product.marketplace}</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-primary" />
          <span>{formattedDate}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500" />
          {product.avaliacao.toFixed(1)}
        </Badge>
        <div className="flex items-center text-lg font-semibold text-primary">
          <DollarSign className="h-5 w-5 mr-1" />
          {product.preco_final.toFixed(2)}
        </div>
      </CardFooter>
    </Card>
  );
}
