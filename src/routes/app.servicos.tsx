import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/app/servicos")({
  component: ServicesPage,
});

interface Service {
  id: string;
  nome: string;
  descricao: string;
  preco_mzn: number;
  duracao_min: number;
}

function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, nome, descricao, preco_mzn, duracao_min")
      .eq("ativo", true)
      .order("preco_mzn", { ascending: true })
      .then(({ data }) => setServices(data ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-4xl">Serviços</h1>
        <p className="mt-2 text-muted-foreground">Escolha um serviço para agendar</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.id} className="border-border/60 transition-all hover:shadow-elegant">
            <CardContent className="p-6">
              <h3 className="font-serif text-2xl">{s.nome}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.descricao}</p>
              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {s.duracao_min} min
                </span>
                <span className="font-serif text-2xl text-primary">{s.preco_mzn} MZN</span>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => navigate({ to: "/app/agenda", search: { service: s.id } })}
              >
                Agendar este serviço
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
