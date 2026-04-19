import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar")({
  component: RecoverPage,
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir`,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Email enviado");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/40 via-background to-accent/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl">Recuperar palavra-passe</CardTitle>
            <CardDescription>Receba um link para redefinir</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <p className="text-center text-sm text-muted-foreground">
                Verifique o seu email <strong>{email}</strong>. Se a conta existir, receberá um link para redefinir a palavra-passe.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "A enviar..." : "Enviar link"}
                </Button>
              </form>
            )}
            <p className="mt-6 text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">← Voltar ao login</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
