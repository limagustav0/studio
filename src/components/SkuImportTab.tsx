"use client";

import { useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface SkuImportTabProps {
  onImport: (importedSkus: Record<string, string>) => void;
}

// Define the expected column names from the XLSX file
const EXPECTED_PRIMARY_SKU_COLUMN = "SKU_Principal";
const EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE = "SKU_Interno";
const EXPECTED_INTERNAL_SKU_COLUMN_SPACE = "SKU Interno";

export function SkuImportTab({ onImport }: SkuImportTabProps) {
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
        if (event.target) {
            event.target.value = ''; // Reset file input
        }
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleDownloadTemplate = () => {
    const sampleData = [
      { [EXPECTED_PRIMARY_SKU_COLUMN]: "EXEMPLO_SKU_LOJA_1", [EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE]: "MEU_SKU_INTERNO_123" },
      { [EXPECTED_PRIMARY_SKU_COLUMN]: "EXEMPLO_SKU_LOJA_2", [EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE]: "MEU_SKU_INTERNO_456" },
      { [EXPECTED_PRIMARY_SKU_COLUMN]: "OUTRO_SKU_DA_LOJA", [EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE]: "MEU_SKU_XYZ" },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SKUs"); // "SKUs" is the sheet name
    
    // Attempt to set column widths (optional, might not work perfectly in all Excel versions)
    const wscols = [
        { wch: (EXPECTED_PRIMARY_SKU_COLUMN.length > 25 ? EXPECTED_PRIMARY_SKU_COLUMN.length : 25) + 5 }, // SKU_Principal
        { wch: (EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE.length > 25 ? EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE.length : 25) + 5 }  // SKU_Interno
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "modelo_importacao_sku.xlsx");
     toast({
        title: "Download Iniciado",
        description: "O arquivo modelo_importacao_sku.xlsx está sendo baixado.",
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Nenhum Arquivo Selecionado",
        description: "Por favor, selecione um arquivo XLSX para importar.",
      });
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        if (!binaryStr) {
          throw new Error("Não foi possível ler o arquivo.");
        }
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json<any>(worksheet);

        const importedSkus: Record<string, string> = {};
        let importedCount = 0;
        let skippedCount = 0;

        const columnNotFoundDescription = `Verifique se o arquivo XLSX contém as colunas "${EXPECTED_PRIMARY_SKU_COLUMN}" e uma das seguintes para o SKU interno: "${EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE}" ou "${EXPECTED_INTERNAL_SKU_COLUMN_SPACE}". Verifique também se não há espaços extras nos nomes dos cabeçalhos no arquivo Excel. Você pode baixar um modelo com os cabeçalhos corretos.`;
        
        if (data.length === 0) {
           toast({
            variant: "destructive",
            title: "Arquivo Vazio ou Inválido",
            description: `O arquivo parece estar vazio ou não contém dados nas linhas esperadas. ${columnNotFoundDescription}`,
          });
          setIsProcessing(false);
          return;
        }

        const firstRow = data[0];
        const headerKeys = Object.keys(firstRow);

        let actualPrimarySkuColumnName: string | undefined = undefined;
        for (const key of headerKeys) {
            if (key.trim() === EXPECTED_PRIMARY_SKU_COLUMN) {
                actualPrimarySkuColumnName = key;
                break;
            }
        }

        let actualInternalSkuColumnName: string | undefined = undefined;
        for (const key of headerKeys) {
            const trimmedKey = key.trim();
            if (trimmedKey === EXPECTED_INTERNAL_SKU_COLUMN_SPACE || trimmedKey === EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE) {
                actualInternalSkuColumnName = key;
                break;
            }
        }

        if (!actualPrimarySkuColumnName || !actualInternalSkuColumnName) {
          toast({
            variant: "destructive",
            title: "Colunas Não Encontradas",
            description: columnNotFoundDescription,
          });
          setIsProcessing(false);
          return;
        }


        data.forEach(row => {
          const primarySku = row[actualPrimarySkuColumnName!];
          const internalSku = row[actualInternalSkuColumnName!];

          if (primarySku && (typeof primarySku === 'string' || typeof primarySku === 'number') &&
              internalSku && (typeof internalSku === 'string' || typeof internalSku === 'number')) {
            importedSkus[String(primarySku).trim()] = String(internalSku).trim();
            importedCount++;
          } else {
            skippedCount++;
          }
        });

        if (importedCount > 0) {
          onImport(importedSkus);
          // The success toast is now handled in the main page component after onImport
        } else {
           toast({
            variant: "destructive",
            title: "Nenhum SKU Válido Encontrado",
            description: `Nenhuma associação válida de SKU Principal para SKU Interno foi encontrada. Verifique os dados nas colunas "${actualPrimarySkuColumnName}" e "${actualInternalSkuColumnName}".`,
          });
        }
        if (skippedCount > 0) {
           toast({
            variant: "default",
            title: "Linhas Ignoradas",
            description: `${skippedCount} linha(s) foram ignoradas devido a dados ausentes ou inválidos para SKU Principal ou SKU Interno.`,
          });
        }

      } catch (error) {
        console.error("Erro ao processar o arquivo XLSX:", error);
        toast({
          variant: "destructive",
          title: "Erro na Importação",
          description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao processar o arquivo.",
        });
      } finally {
        setIsProcessing(false);
        setSelectedFile(null); 
        const fileInput = document.getElementById('sku-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };

    reader.onerror = () => {
        console.error("Erro ao ler o arquivo.");
        toast({
          variant: "destructive",
          title: "Erro de Leitura",
          description: "Não foi possível ler o arquivo selecionado.",
        });
        setIsProcessing(false);
        setSelectedFile(null);
         const fileInput = document.getElementById('sku-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    reader.readAsBinaryString(selectedFile);
  };

  return (
    <Card className="shadow-lg p-2 sm:p-6">
      <CardHeader className="pb-4 px-2 sm:px-6">
        <CardTitle className="flex items-center justify-center sm:justify-start text-center sm:text-left">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" />
          Importar Mapeamento de SKUs Internos
        </CardTitle>
        <CardDescription className="text-center sm:text-left">
          Faça o upload de um arquivo XLSX (.xlsx ou .xls) para associar SKUs principais aos seus SKUs internos.
          O arquivo deve conter as colunas: <strong>{EXPECTED_PRIMARY_SKU_COLUMN}</strong> e (<strong>{EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE}</strong> ou <strong>{EXPECTED_INTERNAL_SKU_COLUMN_SPACE}</strong>).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 py-6">
        <div className="mx-auto flex flex-col items-center space-y-6 max-w-lg">
            <div className="w-full space-y-2">
                <Input
                    id="sku-file-input"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    disabled={isProcessing}
                />
                {selectedFile && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center">
                        <FileText className="mr-2 h-4 w-4" /> Arquivo selecionado: {selectedFile.name}
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
                    <p>1. Certifique-se de que o arquivo é do formato XLSX ou XLS.</p>
                    <p>2. A primeira planilha do arquivo será utilizada.</p>
                    <p>3. Os cabeçalhos da primeira linha devem ser <strong>{EXPECTED_PRIMARY_SKU_COLUMN}</strong> e (<strong>{EXPECTED_INTERNAL_SKU_COLUMN_UNDERSCORE}</strong> ou <strong>{EXPECTED_INTERNAL_SKU_COLUMN_SPACE}</strong>). Verifique se não há espaços extras.</p>
                    <p>4. SKUs principais duplicados no arquivo? O último encontrado prevalecerá.</p>
                    <p>5. A importação mesclará os dados com os SKUs internos já existentes. Se um SKU Principal do arquivo já existir no sistema, seu SKU Interno será atualizado.</p>
                     <p>6. Clique em "Baixar Modelo" para obter um arquivo com os cabeçalhos e formato corretos.</p>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}
