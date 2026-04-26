import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Clock, Star, MapPin, Phone, Instagram, Facebook, Menu, X,
  Smartphone, Building2, Scissors, Award, Users,
} from "lucide-react";

import heroBarbearia from "@/assets/hero-barbearia.jpg";
import aboutBarbearia from "@/assets/about-barbearia.jpg";
import cutLowFade from "@/assets/cut-low-fade.jpg";
import cutHighFade from "@/assets/cut-high-fade.jpg";
import cutTaperFade from "@/assets/cut-taper-fade.jpg";
import cutAfro from "@/assets/cut-afro.jpg";
import cutDreadlocks from "@/assets/cut-dreadlocks.jpg";
import cutCornrows from "@/assets/cut-cornrows.jpg";
import cutBaldFade from "@/assets/cut-bald-fade.jpg";
import cutDesign from "@/assets/cut-design.jpg";
import cutTwists from "@/assets/cut-twists.jpg";
import cutMohawk from "@/assets/cut-mohawk.jpg";
import cutBoxBraids from "@/assets/cut-box-braids.jpg";

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

const gallery = [
  { src: cutLowFade, nome: "Low Fade" },
  { src: cutHighFade, nome: "High Fade + Barba" },
  { src: cutTaperFade, nome: "Taper Fade" },
  { src: cutAfro, nome: "Afro Natural" },
  { src: cutDreadlocks, nome: "Dreadlocks" },
  { src: cutCornrows, nome: "Cornrows / Tranças Nagô" },
  { src: cutBaldFade, nome: "Bald Fade + Barba" },
  { src: cutDesign, nome: "Design / Hair Tattoo" },
  { src: cutTwists, nome: "Mini Twists" },
  { src: cutMohawk, nome: "Mohawk Africano" },
  { src: cutBoxBraids, nome: "Box Braids" },
];

const testimonials = [
  {
    nome: "Ivandro Sitoe",
    texto: "Melhor fade da cidade. Saio sempre com a barba no ponto e o cabelo perfeito.",
    rating: 5,
  },
  {
    nome: "Helton Macamo",
    texto: "Marquei pela app, paguei via M-Pesa e fui buscar o corte. Tudo organizado.",
    rating: 5,
  },
  {
    nome: "Délcio Nhantumbo",
    texto: "Os designs ficam impecáveis. Já é o meu sítio favorito em Maputo.",
    rating: 5,
  },
];

const paymentMethods = [
  {
    icon: Smartphone,
    nome: "M-Pesa",
    sub: "Vodacom",
    color: "text-red-500",
    desc: "Pague rapidamente com a sua carteira M-Pesa.",
  },
  {
    icon: Smartphone,
    nome: "e-Mola",
    sub: "Movitel",
    color: "text-yellow-500",
    desc: "Use a sua carteira e-Mola da Movitel.",
  },
  {
    icon: Building2,
    nome: "Transferência",
    sub: "BCI / Millennium BIM",
    color: "text-blue-400",
    desc: "Transferência bancária com envio do comprovativo.",
  },
];

function LandingPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [lightbox, setLightbox] = useState<{ src: string; nome: string } | null>(null);
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
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#sobre" className="font-display text-xs hover:text-primary transition-colors">Sobre</a>
            <a href="#servicos" className="font-display text-xs hover:text-primary transition-colors">Cortes</a>
            <a href="#galeria" className="font-display text-xs hover:text-primary transition-colors">Galeria</a>
            <a href="#pagamentos" className="font-display text-xs hover:text-primary transition-colors">Pagamentos</a>
            <a href="#testemunhos" className="font-display text-xs hover:text-primary transition-colors">Clientes</a>
            <Button asChild size="sm">
              <Link to={ctaTarget}>{user ? "A minha conta" : "Marcar Corte"}</Link>
            </Button>
          </nav>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-border/40 bg-background md:hidden">
            <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
              <a href="#sobre" onClick={() => setMenuOpen(false)} className="py-2 font-display text-sm">Sobre</a>
              <a href="#servicos" onClick={() => setMenuOpen(false)} className="py-2 font-display text-sm">Cortes</a>
              <a href="#galeria" onClick={() => setMenuOpen(false)} className="py-2 font-display text-sm">Galeria</a>
              <a href="#pagamentos" onClick={() => setMenuOpen(false)} className="py-2 font-display text-sm">Pagamentos</a>
              <a href="#testemunhos" onClick={() => setMenuOpen(false)} className="py-2 font-display text-sm">Clientes</a>
              <Button asChild className="mt-2">
                <Link to={ctaTarget}>{user ? "A minha conta" : "Marcar Corte"}</Link>
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-center pt-16">
        <img
          src={heroBarbearia}
          alt="Interior da barbearia"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/70 to-background/40" />
        <div className="container relative z-10 mx-auto px-4 py-20 text-center text-foreground">
          <p className="mb-4 font-display text-xs tracking-[0.4em] text-primary">
            Barbearia [Nome] · Maputo, Moçambique
          </p>
          <h1 className="mx-auto max-w-4xl font-serif text-5xl leading-[1.05] md:text-7xl">
            Estilo. <em className="text-primary not-italic">Atitude.</em> Tradição.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Cortes africanos e moçambicanos executados por mestres da navalha. Fade, dreads, tranças, designs — o seu estilo, à sua medida.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-[200px] shadow-gold">
              <Link to={ctaTarget}>Marcar o meu corte</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-[200px]">
              <a href="#galeria">Ver catálogo</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-24">
        <div className="container mx-auto grid items-center gap-12 px-4 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <p className="font-display text-xs tracking-[0.3em] text-primary">Sobre Nós</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Onde cada corte conta uma história
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              No coração de Maputo, a nossa barbearia une técnica moderna ao orgulho africano.
              Fade limpo, dreads cuidados, tranças tradicionais, designs ousados — fazemos tudo o que define o estilo do homem moçambicano.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Equipa especializada, ambiente descontraído, e respeito pelo tempo do cliente. Marca, vens, sais com estilo.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="border-l-2 border-primary pl-3">
                <Award className="mb-1 h-4 w-4 text-primary" />
                <p className="font-display text-3xl text-foreground">+5</p>
                <p className="text-xs text-muted-foreground">Anos de bairro</p>
              </div>
              <div className="border-l-2 border-primary pl-3">
                <Scissors className="mb-1 h-4 w-4 text-primary" />
                <p className="font-display text-3xl text-foreground">+2K</p>
                <p className="text-xs text-muted-foreground">Cortes feitos</p>
              </div>
              <div className="border-l-2 border-primary pl-3">
                <Users className="mb-1 h-4 w-4 text-primary" />
                <p className="font-display text-3xl text-foreground">+15</p>
                <p className="text-xs text-muted-foreground">Estilos</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative">
              <img
                src={aboutBarbearia}
                alt="Barbeiro a trabalhar"
                width={1024}
                height={1024}
                loading="lazy"
                className="rounded-md shadow-elegant"
              />
              <div className="absolute -bottom-6 -left-6 hidden rounded-md bg-primary p-5 text-primary-foreground shadow-gold md:block">
                <p className="font-display text-xl tracking-widest">Brotherhood</p>
                <p className="mt-1 font-serif text-sm italic opacity-90">Desde 2019</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs tracking-[0.3em] text-primary">Os Nossos Cortes</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Tudo o que precisas, num só sítio</h2>
            <p className="mt-4 text-muted-foreground">Preços em meticais (MZN). Duração aproximada por sessão.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Card key={s.id} className="group overflow-hidden border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-gold">
                <CardContent className="p-6">
                  <h3 className="font-serif text-2xl">{s.nome}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{s.descricao}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" /> {s.duracao_min} min
                    </span>
                    <span className="font-display text-2xl text-primary">{s.preco_mzn} MZN</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link to={ctaTarget}>Marcar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs tracking-[0.3em] text-primary">Catálogo</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Cortes Africanos & Moçambicanos</h2>
            <p className="mt-4 text-muted-foreground">Inspira-te. Toca para ampliar.</p>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {gallery.map((item) => (
              <button
                key={item.nome}
                onClick={() => setLightbox(item)}
                className="group relative aspect-[4/5] overflow-hidden rounded-md border border-border/60 shadow-soft"
              >
                <img
                  src={item.src}
                  alt={item.nome}
                  width={800}
                  height={1024}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-90" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                  <p className="font-display text-sm tracking-wider text-primary">{item.nome}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative">
            <img src={lightbox.src} alt={lightbox.nome} className="max-h-[85vh] max-w-[90vw] rounded-md" />
            <p className="mt-3 text-center font-display text-lg text-primary">{lightbox.nome}</p>
          </div>
          <button className="absolute top-4 right-4 text-foreground" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* Pagamentos */}
      <section id="pagamentos" className="bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs tracking-[0.3em] text-primary">Pagamentos</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Paga como te der jeito</h2>
            <p className="mt-4 text-muted-foreground">
              Após marcar, escolhe o método e envia o comprovativo. Nós confirmamos.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.nome} className="border-border/60 bg-card transition-all hover:border-primary/60 hover:shadow-gold">
                  <CardContent className="p-6 text-center">
                    <Icon className={`mx-auto h-10 w-10 ${m.color}`} />
                    <h3 className="mt-4 font-display text-xl tracking-wider">{m.nome}</h3>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{m.sub}</p>
                    <p className="mt-4 text-sm text-muted-foreground">{m.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" variant="outline">
              <Link to={ctaTarget}>Marcar e pagar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testemunhos */}
      <section id="testemunhos" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xs tracking-[0.3em] text-primary">Clientes</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">O que dizem os mano</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.nome} className="border-border/60 bg-card">
                <CardContent className="p-8">
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 font-serif italic text-lg leading-relaxed">"{t.texto}"</p>
                  <p className="mt-6 font-display text-sm tracking-wider">— {t.nome}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary to-primary-glow py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl">Pronto para o teu próximo corte?</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">
            Marca em 30 segundos. Sem chamadas, sem esperas. Paga depois.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 min-w-[220px]">
            <Link to={ctaTarget}>Marcar Corte Agora</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background py-12">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Barbearia em Maputo, Moçambique. Cortes africanos, fade, dreads, tranças e designs.
            </p>
          </div>
          <div>
            <h3 className="font-display text-sm tracking-widest text-primary">Contacto</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Av. Julius Nyerere, Maputo</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +258 84 000 0000</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Seg–Sáb · 09:00–18:00</li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm tracking-widest text-primary">Redes</h3>
            <div className="mt-4 flex gap-3">
              <a href="#" className="rounded-sm border border-border/60 p-2.5 transition-colors hover:border-primary hover:text-primary" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-sm border border-border/60 p-2.5 transition-colors hover:border-primary hover:text-primary" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-10 border-t border-border/60 px-4 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Barbearia [Nome]. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}