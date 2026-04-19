import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Clock, Star, MapPin, Phone, Instagram, Facebook, Menu, X } from "lucide-react";

import heroSalon from "@/assets/hero-salon.jpg";
import aboutSalon from "@/assets/about-salon.jpg";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

interface Service {
  id: string;
  nome: string;
  descricao: string;
  preco_mzn: number;
  duracao_min: number;
}

const gallery = [g1, g2, g3, g4, g5, g6];

const testimonials = [
  {
    nome: "Aline Macuácua",
    texto: "Atendimento maravilhoso! Saí do salão a sentir-me uma rainha. Recomendo a todas.",
    rating: 5,
  },
  {
    nome: "Tânia Mondlane",
    texto: "As tranças ficaram impecáveis e duraram bastante. Ambiente acolhedor e profissional.",
    rating: 5,
  },
  {
    nome: "Belita Cossa",
    texto: "O melhor salão de Maputo! Marquei pela app, super prático. Já voltei várias vezes.",
    rating: 5,
  },
];

function LandingPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, nome, descricao, preco_mzn, duracao_min")
      .eq("ativo", true)
      .order("preco_mzn", { ascending: true })
      .then(({ data }) => setServices(data ?? []));
  }, []);

  const ctaTarget = user ? "/app" : "/login";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#sobre" className="text-sm hover:text-primary transition-colors">Sobre</a>
            <a href="#servicos" className="text-sm hover:text-primary transition-colors">Serviços</a>
            <a href="#galeria" className="text-sm hover:text-primary transition-colors">Galeria</a>
            <a href="#testemunhos" className="text-sm hover:text-primary transition-colors">Testemunhos</a>
            <Button asChild size="sm">
              <Link to={ctaTarget}>{user ? "Minha conta" : "Agendar"}</Link>
            </Button>
          </nav>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-border/40 bg-background md:hidden">
            <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
              <a href="#sobre" onClick={() => setMenuOpen(false)} className="py-2">Sobre</a>
              <a href="#servicos" onClick={() => setMenuOpen(false)} className="py-2">Serviços</a>
              <a href="#galeria" onClick={() => setMenuOpen(false)} className="py-2">Galeria</a>
              <a href="#testemunhos" onClick={() => setMenuOpen(false)} className="py-2">Testemunhos</a>
              <Button asChild className="mt-2">
                <Link to={ctaTarget}>{user ? "Minha conta" : "Agendar Agora"}</Link>
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-center pt-16">
        <img
          src={heroSalon}
          alt="Interior do salão"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/40 to-primary/40" />
        <div className="container relative z-10 mx-auto px-4 py-20 text-center text-white">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/80">
            Salão [Nome do Salão] · Maputo
          </p>
          <h1 className="mx-auto max-w-3xl font-serif text-5xl leading-tight md:text-7xl">
            Realce a sua <em className="text-primary-glow">beleza</em> natural
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/90">
            Cuidamos do seu cabelo e das suas unhas com profissionalismo, carinho e a elegância que você merece.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-[180px] shadow-elegant">
              <Link to={ctaTarget}>Agendar Agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-[180px] bg-white/10 text-white border-white/40 backdrop-blur hover:bg-white/20 hover:text-white">
              <a href="#servicos">Ver Serviços</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-24">
        <div className="container mx-auto grid items-center gap-12 px-4 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">Sobre o Salão</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Um espaço pensado para si
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              No coração de Maputo, o nosso salão combina técnicas modernas com o calor moçambicano.
              Trabalhamos com produtos de qualidade e uma equipa apaixonada por realçar a beleza única de cada cliente.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Tranças, cortes, alisamentos, manicure, pedicure e muito mais — tudo num ambiente acolhedor e profissional.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <div>
                <p className="font-serif text-3xl text-primary">+5</p>
                <p className="text-sm text-muted-foreground">Anos de experiência</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-primary">+1000</p>
                <p className="text-sm text-muted-foreground">Clientes satisfeitas</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-primary">+10</p>
                <p className="text-sm text-muted-foreground">Serviços disponíveis</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative">
              <img
                src={aboutSalon}
                alt="Interior do salão"
                width={1200}
                height={1200}
                loading="lazy"
                className="rounded-2xl shadow-elegant"
              />
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-elegant md:block">
                <p className="font-serif text-2xl">Beleza & Elegância</p>
                <p className="mt-1 text-sm opacity-90">Desde 2019</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="bg-secondary/40 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">Os Nossos Serviços</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Tudo o que precisa, num só lugar</h2>
            <p className="mt-4 text-muted-foreground">Preços em meticais (MZN). Duração aproximada por sessão.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Card key={s.id} className="group overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-elegant">
                <CardContent className="p-6">
                  <h3 className="font-serif text-2xl">{s.nome}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{s.descricao}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" /> {s.duracao_min} min
                    </span>
                    <span className="font-serif text-2xl text-primary">{s.preco_mzn} MZN</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link to={ctaTarget}>Agendar um serviço</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">Trabalhos Realizados</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Galeria</h2>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {gallery.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightbox(src)}
                className="group relative aspect-square overflow-hidden rounded-xl shadow-soft"
              >
                <img
                  src={src}
                  alt={`Trabalho ${i + 1}`}
                  width={800}
                  height={1024}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/20" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* Testemunhos */}
      <section id="testemunhos" className="bg-secondary/40 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">Testemunhos</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">O que dizem as nossas clientes</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.nome} className="border-border/60">
                <CardContent className="p-8">
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 font-serif italic text-lg leading-relaxed">"{t.texto}"</p>
                  <p className="mt-6 font-medium">— {t.nome}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary to-primary-glow py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl">Pronta para se sentir incrível?</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">
            Agende o seu próximo cuidado em poucos cliques. Sem chamadas, sem esperas.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 min-w-[200px]">
            <Link to={ctaTarget}>Agendar Agora</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background py-12">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Salão de beleza em Maputo, Moçambique. Cuidamos da sua beleza com paixão e profissionalismo.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg">Contacto</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Av. Julius Nyerere, Maputo</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +258 84 000 0000</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Seg–Sáb · 09:00–18:00</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg">Siga-nos</h3>
            <div className="mt-4 flex gap-3">
              <a href="#" className="rounded-full bg-secondary p-2.5 transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-full bg-secondary p-2.5 transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-10 border-t border-border/60 px-4 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Salão [Nome do Salão]. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
