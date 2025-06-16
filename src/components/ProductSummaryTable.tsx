
'use client';

import Image from 'next/image';
import type { UniqueProductSummary } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductSummaryTableProps {
  summaries: UniqueProductSummary[];
  isLoading: boolean;
  onInternalSkuChange: (productSku: string, newInternalSku: string) => void;
  onBrandChange: (productSku: string, newBrand: string) => void; // Nova prop para marca
}

const formatSummaryTableDate = (isoDateString: string | null | undefined) => {
  if (!isoDateString) return 'N/A';
  try {
    return format(parseISO(isoDateString), "dd/MM/yy HH:mm", { locale: ptBR });
  } catch (e) {
    console.warn("Failed to format summary table date time:", e);
    return 'Inválida';
  }
};

export function ProductSummaryTable({ summaries, isLoading, onInternalSkuChange, onBrandChange }: ProductSummaryTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] hidden sm:table-cell">Imagem</TableHead>
              <TableHead>Produto (SKU)</TableHead>
              <TableHead>SKU Interno</TableHead>
              <TableHead>Marca</TableHead> {/* Nova Coluna */}
              <TableHead>Marketplaces</TableHead>
              <TableHead className="text-center">Sellers</TableHead>
              <TableHead className="text-right">Menor Preço</TableHead>
              <TableHead className="text-right">Maior Preço</TableHead>
              <TableHead className="text-right">Última Raspagem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={`skeleton-summary-${i}`}>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-12 w-12 rounded" /></TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </TableCell>
                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24" /></TableCell> {/* Skeleton para Marca */}
                <TableCell><Skeleton className="h-4 w-2/3" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado para resumir.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] hidden sm:table-cell">Imagem</TableHead>
            <TableHead>Produto (SKU)</TableHead>
            <TableHead>SKU Interno</TableHead>
            <TableHead>Marca</TableHead> {/* Nova Coluna */}
            <TableHead>Marketplaces</TableHead>
            <TableHead className="text-center">Sellers</TableHead>
            <TableHead className="text-right">Menor Preço</TableHead>
            <TableHead className="text-right">Maior Preço</TableHead>
            <TableHead className="text-right">Última Raspagem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow key={summary.sku}>
              <TableCell className="hidden sm:table-cell">
                <Image
                  src={summary.imagem || "https://placehold.co/60x60.png"}
                  alt={summary.descricao}
                  width={60}
                  height={60}
                  className="rounded"
                  data-ai-hint="product thumbnail"
                />
              </TableCell>
              <TableCell>
                <div className="font-medium max-w-xs truncate" title={summary.descricao}>{summary.descricao}</div>
                <div className="text-xs text-muted-foreground">SKU: {summary.sku}</div>
              </TableCell>
              <TableCell>
                <Input
                  value={summary.internalSku || ''}
                  onChange={(e) => onInternalSkuChange(summary.sku, e.target.value)}
                  placeholder="Digitar SKU interno..."
                  className="text-sm h-8 w-32"
                />
              </TableCell>
              <TableCell> {/* Nova Célula para Marca */}
                <Input
                  value={summary.marca || ''}
                  onChange={(e) => onBrandChange(summary.sku, e.target.value)}
                  placeholder="Digitar marca..."
                  className="text-sm h-8 w-32"
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {summary.marketplaces.map(mp => (
                    <Badge key={mp} variant="secondary" className="text-xs">{mp}</Badge>
                  ))}
                   {summary.marketplaces.length === 0 && <span className="text-xs text-muted-foreground">N/A</span>}
                </div>
              </TableCell>
              <TableCell className="text-center">{summary.sellerCount}</TableCell>
              <TableCell className="text-right font-semibold text-green-600">R$ {summary.minPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold text-red-600">R$ {summary.maxPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">{formatSummaryTableDate(summary.latestScrapeDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
