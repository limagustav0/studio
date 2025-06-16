
"use client";

import { useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, AlertTriangle, FileSpreadsheet, Landmark } from 'lucide-react';
import type { Product } from '@/lib/types';

interface SkuImportTabProps {
  onImport: (importedData: Record<string, { internalSku: string; marca: string }>) => void;
  allProducts: Product[];
  internalSkusMap: Record<string, { internalSku?: string; marca?: string }>;
}

const EXPECTED_PRIMARY_SKU_COLUMN = "SKU_Principal";
const EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE = "SKU_Interno";
const EXPECTED_INTERNAL_SKU_COLUMN_SPACE = "SKU Interno";
const EXPECTED_BRAND_COLUMN = "Marca";

export function SkuImportTab({ onImport, allProducts, internalSkusMap }: SkuImportTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel") {
        setSelectedFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Tipo de Arquivo Inválido",
          description: "Por favor, selecione um arquivo XLSX ou XLS.",
        });
        setSelectedFile(null);
        if (event.target) event.target.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleDownloadTemplate = () => {
    // Ensure SKUs from allProducts are strings for consistent processing
    const uniquePrincipalSkus = Array.from(new Set(allProducts.map(p => String(p.sku || '')).filter(Boolean)));
    
    let dataForSheet: Array<Record<string, string>>;

    if (uniquePrincipalSkus.length > 0) {
      dataForSheet = uniquePrincipalSkus.map(sku => ({
        [EXPECTED_PRIMARY_SKU_COLUMN]: sku, // sku is already a string here
        [EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE]: String(internalSkusMap[sku]?.internalSku || ""),
        [EXPECTED_BRAND_COLUMN]: String(internalSkusMap[sku]?.marca || ""), 
      }));
    } else {
      dataForSheet = [
        { [EXPECTED_PRIMARY_SKU_COLUMN]: "EXEMPLO_SKU_LOJA_1", [EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE]: "MEU_SKU_INTERNO_123", [EXPECTED_BRAND_COLUMN]: "Marca Exemplo A" },
        { [EXPECTED_PRIMARY_SKU_COLUMN]: "EXEMPLO_SKU_LOJA_2", [EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE]: "MEU_SKU_INTERNO_456", [EXPECTED_BRAND_COLUMN]: "Marca Exemplo B" },
      ];
    }
    
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet, {
      header: [EXPECTED_PRIMARY_SKU_COLUMN, EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE, EXPECTED_BRAND_COLUMN],
      skipHeader: false, // We want the headers
    });

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:C1');
    
    // Ensure headers are explicitly strings and set cell type
    const headers = [EXPECTED_PRIMARY_SKU_COLUMN, EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE, EXPECTED_BRAND_COLUMN];
    headers.forEach((headerText, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({c: colIndex, r: 0});
        if (worksheet[cellAddress]) {
            worksheet[cellAddress].v = String(headerText); // Ensure header value is string
            worksheet[cellAddress].t = 's'; // Set header cell type to string
        } else {
            worksheet[cellAddress] = { v: String(headerText), t: 's' };
        }
    });

    // Ensure data cells are explicitly strings (type and value)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Start from row 1 (data row)
      for (let C = 0; C < headers.length; ++C) { // Iterate through the defined header columns
        const cellAddress = XLSX.utils.encode_cell({c: C, r: R});
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].v = String(worksheet[cellAddress].v || ""); // Ensure value is string, default to empty string if undefined/null
          worksheet[cellAddress].t = 's'; // Set type to string
        } else {
          worksheet[cellAddress] = { t: 's', v: "" }; // Create empty string cell if it doesn't exist
        }
      }
    }
    
    const wscols = [
        { wch: Math.max(EXPECTED_PRIMARY_SKU_COLUMN.length, 25) + 5 }, 
        { wch: Math.max(EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE.length, 25) + 5 },
        { wch: Math.max(EXPECTED_BRAND_COLUMN.length, 20) + 5 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SKUs_Marcas"); 

    XLSX.writeFile(workbook, "modelo_importacao_sku_marca.xlsx");
     toast({
        title: "Download Iniciado",
        description: "O arquivo modelo_importacao_sku_marca.xlsx está sendo baixado.",
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Nenhum Arquivo Selecionado", description: "Por favor, selecione um arquivo XLSX para importar." });
      return;
    }
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        if (!binaryStr) throw new Error("Não foi possível ler o arquivo.");
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" }); 

        const importedData: Record<string, { internalSku: string; marca: string }> = {};
        let importedCount = 0;
        let skippedCount = 0;
        
        const columnErrorDesc = `Verifique se as colunas obrigatórias existem: "${EXPECTED_PRIMARY_SKU_COLUMN}", ("${EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE}" ou "${EXPECTED_INTERNAL_SKU_COLUMN_SPACE}"), e "${EXPECTED_BRAND_COLUMN}". Baixe o modelo para o formato correto.`;

        if (data.length === 0) {
           toast({ variant: "destructive", title: "Arquivo Vazio ou Inválido", description: `O arquivo parece vazio ou não contém dados. ${columnErrorDesc}` });
           setIsProcessing(false); return;
        }

        const headerKeys = Object.keys(data[0] || {});
        const getTrimmedKey = (expectedNames: string[]) => headerKeys.find(key => expectedNames.map(n => n.toLowerCase()).includes(key.trim().toLowerCase()));
        
        const actualPrimarySkuColumnName = getTrimmedKey([EXPECTED_PRIMARY_SKU_COLUMN]);
        const actualInternalSkuColumnName = getTrimmedKey([EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE, EXPECTED_INTERNAL_SKU_COLUMN_SPACE]);
        const actualBrandColumnName = getTrimmedKey([EXPECTED_BRAND_COLUMN]);

        let missingColumns = [];
        if (!actualPrimarySkuColumnName) missingColumns.push(EXPECTED_PRIMARY_SKU_COLUMN);
        if (!actualInternalSkuColumnName) missingColumns.push(`${EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE} ou ${EXPECTED_INTERNAL_SKU_COLUMN_SPACE}`);
        if (!actualBrandColumnName) missingColumns.push(EXPECTED_BRAND_COLUMN);

        if (missingColumns.length > 0) {
          toast({ variant: "destructive", title: "Coluna(s) Não Encontrada(s)", description: `As seguintes colunas não foram encontradas no arquivo: ${missingColumns.join(', ')}. ${columnErrorDesc}` });
          setIsProcessing(false); return;
        }

        data.forEach(row => {
          const principalSku = row[actualPrimarySkuColumnName!] !== undefined ? String(row[actualPrimarySkuColumnName!]).trim() : "";
          const internalSku = row[actualInternalSkuColumnName!] !== undefined ? String(row[actualInternalSkuColumnName!]).trim() : "";
          const marca = row[actualBrandColumnName!] !== undefined ? String(row[actualBrandColumnName!]).trim() : "";

          if (principalSku && internalSku && marca ) {
            importedData[principalSku] = { internalSku, marca };
            importedCount++;
          } else if (principalSku || internalSku || marca) { 
            skippedCount++;
          }
        });

        if (importedCount > 0) {
            onImport(importedData);
        } else {
            toast({ variant: "destructive", title: "Nenhum SKU/Marca Válido Encontrado", description: `Nenhuma linha com SKU Principal, SKU Interno e Marca preenchidos foi encontrada. ${skippedCount > 0 ? `${skippedCount} linha(s) foram ignoradas por dados ausentes.` : 'Verifique os dados.'}` });
        }
        
        if (skippedCount > 0 && importedCount > 0) { // Only show separate toast if some were successful
             toast({ variant: "default", title: "Linhas Ignoradas", description: `${skippedCount} linha(s) ignorada(s) por dados ausentes (SKU Principal, SKU Interno e Marca são obrigatórios).` });
        }


      } catch (error) {
        console.error("Erro ao processar o arquivo XLSX:", error);
        toast({ variant: "destructive", title: "Erro na Importação", description: error instanceof Error ? error.message : "Erro desconhecido." });
      } finally {
        setIsProcessing(false);
        setSelectedFile(null); 
        const fileInput = document.getElementById('sku-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.onerror = () => {
        toast({ variant: "destructive", title: "Erro de Leitura", description: "Não foi possível ler o arquivo." });
        setIsProcessing(false); setSelectedFile(null);
        const fileInput = document.getElementById('sku-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };
    reader.readAsBinaryString(selectedFile);
  };

  return (
    <Card className="shadow-lg p-2 sm:p-6">
      <CardHeader className="pb-4 px-2 sm:px-6">
        <CardTitle className="flex items-center justify-center sm:justify-start text-center sm:text-left">
          <Landmark className="mr-2 h-6 w-6 text-primary" />
          Importar Mapeamento de SKUs e Marcas
        </CardTitle>
        <CardDescription className="text-center sm:text-left">
          Faça upload de um arquivo XLSX (.xlsx ou .xls) para associar SKUs principais aos seus SKUs internos e Marcas.
          O arquivo deve conter as colunas: <strong>{EXPECTED_PRIMARY_SKU_COLUMN}</strong>, (<strong>{EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE}</strong> ou <strong>{EXPECTED_INTERNAL_SKU_COLUMN_SPACE}</strong>), e <strong>{EXPECTED_BRAND_COLUMN}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 py-6">
        <div className="mx-auto flex flex-col items-center space-y-6 max-w-lg">
            <div className="w-full space-y-2">
                <Input
                    id="sku-file-input" type="file" accept=".xlsx, .xls" onChange={handleFileChange}
                    className="text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    disabled={isProcessing}
                />
                {selectedFile && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center">
                        <FileText className="mr-2 h-4 w-4" /> Arquivo: {selectedFile.name}
                    </p>
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button onClick={handleImport} disabled={!selectedFile || isProcessing} className="w-full sm:w-auto">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processando...' : 'Importar Arquivo'}
                </Button>
                <Button variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Baixar Modelo
                </Button>
            </div>

            <Card className="bg-muted/50 w-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                        Instruções Importantes
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>1. Formato: XLSX ou XLS.</p>
                    <p>2. Primeira planilha será utilizada.</p>
                    <p>3. Cabeçalhos obrigatórios: <strong>{EXPECTED_PRIMARY_SKU_COLUMN}</strong>, (<strong>{EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE}</strong> ou <strong>{EXPECTED_INTERNAL_SKU_COLUMN_SPACE}</strong>), e <strong>{EXPECTED_BRAND_COLUMN}</strong>. Os nomes das colunas no arquivo devem corresponder exatamente (maiúsculas/minúsculas não importam, mas a escrita sim).</p>
                    <p>4. Todos os três campos (SKU Principal, SKU Interno, Marca) são obrigatórios por linha para importação. Linhas incompletas serão ignoradas.</p>
                    <p>5. SKUs principais duplicados no arquivo? O último encontrado prevalecerá.</p>
                    <p>6. A importação mesclará/atualizará os dados existentes.</p>
                    <p>7. "Baixar Modelo" fornece um arquivo pré-formatado. Para melhor compatibilidade com `PROCV`/`VLOOKUP`, certifique-se que os SKUs na sua planilha de origem também estão formatados como texto.</p>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}

