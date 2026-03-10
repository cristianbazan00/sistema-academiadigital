import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CsvImporter, CsvRow } from "@/components/institution/CsvImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

const InstitutionImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async (rows: CsvRow[]) => {
    if (!user) return;
    setImporting(true);
    setResult(null);

    try {
      const { data: instId } = await supabase.rpc("get_user_institution_id", { _user_id: user.id });
      if (!instId) {
        toast({ title: "Instituição não encontrada", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("import-students", {
        body: {
          institution_id: instId as string,
          students: rows.map((r) => ({ cpf: r.cpf, full_name: r.full_name, class_name: r.class_name })),
        },
      });

      if (error) {
        toast({ title: "Erro na importação", description: String(error), variant: "destructive" });
      } else {
        const res = data as ImportResult;
        setResult(res);
        toast({ title: `Importação concluída: ${res.created} criados, ${res.skipped} ignorados` });
      }
    } catch {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Importar Alunos</h1>
        <CsvImporter onImport={handleImport} importing={importing} />

        {result && (
          <Card>
            <CardHeader><CardTitle>Resultado da Importação</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-3">
                <Badge variant="secondary">{result.created} criados</Badge>
                <Badge variant="outline">{result.skipped} ignorados</Badge>
                {result.errors.length > 0 && <Badge variant="destructive">{result.errors.length} erros</Badge>}
              </div>
              {result.errors.length > 0 && (
                <ul className="text-sm text-destructive space-y-1 mt-2">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstitutionImport;
