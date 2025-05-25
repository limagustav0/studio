import Image from 'next/image';
import type { PriceTrendProductInfo } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface PriceTrendDisplayProps {
  trendProducts: PriceTrendProductInfo[];
}

export function PriceTrendDisplay({ trendProducts }: PriceTrendDisplayProps) {
  if (trendProducts.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" />Análise de Tendência de Preços</CardTitle>
          <CardDescription>Nenhuma mudança de preço significativa detectada recentemente.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" />Principais Mudanças de Preço</CardTitle>
        <CardDescription>Produtos com as variações de preço mais significativas.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Produto (SKU)</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead className="text-right">Preço Anterior</TableHead>
              <TableHead className="text-right">Preço Atual</TableHead>
              <TableHead className="text-right">Variação (%)</TableHead>
              <TableHead className="text-right hidden md:table-cell">Período</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trendProducts.map((product) => (
              <TableRow key={product.sku + product.earliest_date}>
                <TableCell>
                  <Image 
                    src={product.imagem || "https://placehold.co/50x50.png"} 
                    alt={product.descricao} 
                    width={50} 
                    height={50} 
                    className="rounded"
                    data-ai-hint="product detail"
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{product.descricao}</div>
                  <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                </TableCell>
                <TableCell>{product.loja}</TableCell>
                <TableCell className="text-right">R$ {product.earliest_price.toFixed(2)}</TableCell>
                <TableCell className="text-right">R$ {product.latest_price.toFixed(2)}</TableCell>
                <TableCell className={`text-right font-semibold ${product.price_change_percentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <div className="flex items-center justify-end">
                    {product.price_change_percentage > 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                    {Math.abs(product.price_change_percentage).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground hidden md:table-cell">
                  {format(new Date(product.earliest_date), 'dd/MM/yy')} - {format(new Date(product.latest_date), 'dd/MM/yy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
