import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/perfil")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nome, telefone, foto_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setNome(data?.nome ?? "");
        setTelefone(data?.telefone ?? "");
        setFotoUrl(data?.foto_url ?? null);
      });
  }, [user]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome: nome.trim(), telefone: telefone.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao guardar", { description: error.message });
      return;
    }
    toast.success("Perfil atualizado");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter menos de 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      toast.error("Erro a carregar", { description: upErr.message });
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase.from("profiles").update({ foto_url: url }).eq("id", user.id);
    setUploading(false);
    if (updErr) {
      toast.error("Erro a guardar foto", { description: updErr.message });
      return;
    }
    setFotoUrl(url);
    toast.success("Foto atualizada");
  };

  const initials = nome ? nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "U";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-4xl">Perfil</h1>
        <p className="mt-2 text-muted-foreground">Atualize as suas informações</p>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-background shadow-elegant">
                <AvatarImage src={fotoUrl ?? undefined} alt={nome} />
                <AvatarFallback className="bg-primary/10 font-serif text-2xl text-primary">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition-transform hover:scale-110"
                aria-label="Mudar foto"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            </div>
            {uploading && <p className="text-sm text-muted-foreground">A carregar...</p>}
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={20} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "A guardar..." : "Guardar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
