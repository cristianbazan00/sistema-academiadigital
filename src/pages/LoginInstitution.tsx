import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Building2, Loader2 } from "lucide-react";

const LoginInstitution = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError("Credenciais inválidas. Tente novamente.");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md animate-fade-in border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Acesso Institucional</CardTitle>
          <CardDescription>Entre com o e-mail e senha da sua instituição</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="instituicao@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>

            <div className="flex justify-between text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Esqueci minha senha
              </Link>
              <Link to="/login" className="text-primary hover:underline">
                Sou Facilitador/Aluno
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginInstitution;
