import type { BuyboxWinner } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface BuyboxWinnersDisplayProps {
  buyboxWinners: BuyboxWinner[];
  isLoading: boolean;
}

export function BuyboxWinnersDisplay({ buyboxWinners, isLoading }: BuyboxWinnersDisplayProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-1/2 mb-1" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!buyboxWinners || buyboxWinners.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" />Análise de Buybox</CardTitle>
          <CardDescription>Nenhuma informação de buybox disponível ou nenhum vencedor encontrado com os filtros atuais.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" />Vencedores de Buybox por Loja</CardTitle>
        <CardDescription>Lojas que mais venceram o buybox (menor preço por SKU) globalmente.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loja (Vendedor)</TableHead>
              <TableHead className="text-right">Produtos com Buybox Vencido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyboxWinners.map((winner) => (
              <TableRow key={winner.seller}>
                <TableCell className="font-medium">{winner.seller}</TableCell>
                <TableCell className="text-right">{winner.wins}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
