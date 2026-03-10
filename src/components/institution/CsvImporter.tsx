import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { validateCPF } from "@/lib/cpf";

export interface CsvRow {
  cpf: string;
  full_name: string;
  class_name: string;
  valid: boolean;
}

interface Props {
  onImport: (rows: CsvRow[]) => void;
  importing: boolean;
}

export function CsvImporter({ onImport, importing }: Props) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return;

      // Skip header
      const parsed: CsvRow[] = lines.slice(1).map((line) => {
        const cols = line.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""));
        const cpf = cols[0] ?? "";
        const full_name = cols[1] ?? "";
        const class_name = cols[2] ?? "";
        const cleanCpf = cpf.replace(/\D/g, "");
        return { cpf: cleanCpf, full_name, class_name, valid: validateCPF(cleanCpf) && !!full_name && !!class_name };
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  }, []);

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O CSV deve ter as colunas: <code>cpf</code>, <code>nome</code>, <code>turma</code> (separados por vírgula ou ponto-e-vírgula).
          </p>
          <input type="file" accept=".csv,.txt" onChange={handleFile} className="text-sm" />
          {fileName && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>{fileName}</span>
              <Badge variant="secondary">{rows.length} linhas</Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {invalidRows.length} inválidas
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CPF</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r, i) => (
                    <TableRow key={i} className={!r.valid ? "bg-destructive/10" : ""}>
                      <TableCell className="font-mono text-sm">{r.cpf}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell>{r.class_name}</TableCell>
                      <TableCell>
                        <Badge variant={r.valid ? "secondary" : "destructive"}>
                          {r.valid ? "OK" : "Inválido"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => onImport(validRows)} disabled={importing || validRows.length === 0}>
                {importing ? "Importando..." : `Importar ${validRows.length} alunos`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
