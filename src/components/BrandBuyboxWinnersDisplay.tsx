
import type { BrandBuyboxWinSummary } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tags } from 'lucide-react';

interface BrandBuyboxWinnersDisplayProps {
  brandBuyboxWins: BrandBuyboxWinSummary[];
  isLoading: boolean;
}

export function BrandBuyboxWinnersDisplay({ brandBuyboxWins, isLoading }: BrandBuyboxWinnersDisplayProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <Tags className="mr-2 h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-1/2 mb-1" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={`skel-brand-bb-${i}`} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!brandBuyboxWins || brandBuyboxWins.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Tags className="mr-2 h-5 w-5 text-primary" />Vencedores de Buybox por Marca</CardTitle>
          <CardDescription>Nenhuma informação de buybox por marca disponível ou nenhuma marca vencedora encontrada com os filtros atuais.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Tags className="mr-2 h-5 w-5 text-primary" />Vencedores de Buybox por Marca</CardTitle>
        <CardDescription>Marcas cujos produtos (SKUs únicos) mais venceram o buybox.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead className="text-right">SKUs Únicos com Buybox Vencido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandBuyboxWins.map((winner) => (
              <TableRow key={winner.marca}>
                <TableCell className="font-medium">{winner.marca}</TableCell>
                <TableCell className="text-right">{winner.wins}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
