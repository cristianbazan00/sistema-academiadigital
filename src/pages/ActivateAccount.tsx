import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CpfInput } from "@/components/CpfInput";
import { PasswordStrength, isStrongPassword } from "@/components/PasswordStrength";
import { isValidCpf } from "@/lib/cpf";
import { Loader2, Rocket, CheckCircle } from "lucide-react";

const ActivateAccount = () => {
  const [step, setStep] = useState<"cpf" | "password" | "done">("cpf");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidCpf(cpf)) {
      setError("CPF inválido.");
      return;
    }

    setLoading(true);

    const { data: email } = await supabase.rpc("get_email_by_cpf", { _cpf: cpf });

    setLoading(false);

    if (!email) {
      setError("CPF não encontrado. Contate sua instituição para ser cadastrado.");
      return;
    }

    if (!email.endsWith("@aluno.plataforma.local")) {
      setError("Esta conta já foi ativada. Faça login com seu CPF.");
      return;
    }

    setStep("password");
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError("A senha não atende aos requisitos mínimos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await supabase.functions.invoke("activate-account", {
        body: { action: "activate_csv_student", cpf, password },
      });

      if (res.error) {
        setError(res.error.message || "Erro ao ativar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      if (res.data?.error) {
        setError(res.data.error);
        setLoading(false);
        return;
      }

      setStep("done");
    } catch {
      setError("Erro inesperado. Tente novamente.");
    }

    setLoading(false);
  };

  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-fade-in border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success">
              <CheckCircle className="h-7 w-7 text-success-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">Conta Ativada!</CardTitle>
            <CardDescription>
              Sua conta foi ativada com sucesso. Agora você pode fazer login com seu CPF e a nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full font-semibold">Ir para o Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md animate-fade-in border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Rocket className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Ativar Conta</CardTitle>
          <CardDescription>
            {step === "cpf"
              ? "Digite o CPF cadastrado pela sua instituição"
              : "Defina sua senha de acesso"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "cpf" ? (
            <form onSubmit={handleCheckCpf} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <CpfInput id="cpf" value={cpf} onValueChange={setCpf} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar CPF"}
              </Button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  Voltar ao login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordStrength password={password} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ativar Conta"}
              </Button>
              <div className="text-center text-sm">
                <button type="button" onClick={() => { setStep("cpf"); setError(""); }} className="text-primary hover:underline">
                  Voltar
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccount;
