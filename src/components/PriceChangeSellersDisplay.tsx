
"use client";

import * as React from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Repeat, Users } from 'lucide-react'; // Using Repeat icon

interface PriceChangeSellersDisplayProps {
  allProducts: Product[];
  isLoading: boolean;
}

export function PriceChangeSellersDisplay({ allProducts, isLoading }: PriceChangeSellersDisplayProps) {
  const sellersWithPriceChanges = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return [];
    }
    const productsWithChange = allProducts.filter(p => p.change_price === true);
    const uniqueSellers = Array.from(new Set(productsWithChange.map(p => p.loja).filter(Boolean)));
    return uniqueSellers.sort();
  }, [allProducts]);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Repeat className="mr-2 h-5 w-5 text-primary" />
            Vendedores com Mudança de Preço
          </CardTitle>
          <CardDescription>Carregando dados dos vendedores que alteraram preços...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-2/3 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Repeat className="mr-2 h-5 w-5 text-primary" />
          Vendedores com Mudança de Preço
        </CardTitle>
        <CardDescription>
          Lista de vendedores cujos produtos tiveram uma alteração de preço detectada (com base na coluna 'change_price').
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sellersWithPriceChanges.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Total de vendedores com alterações: {sellersWithPriceChanges.length}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sellersWithPriceChanges.map(seller => (
                <li 
                  key={seller} 
                  className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm truncate" title={seller}>{seller}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Nenhum vendedor com alteração de preço encontrado nos dados atuais.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
