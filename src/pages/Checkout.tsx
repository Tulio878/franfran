import { useState, useCallback, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { orderBumps, type OrderBump } from "@/data/products";
import { Plus, Check, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getUtmSearch, getUtmQueryString } from "@/lib/utm";

interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

interface ShippingOption {
  id: string;
  name: string;
  days: string;
  price: number;
}

const shippingOptions: ShippingOption[] = [
  { id: "sedex", name: "Sedex", days: "2 a 3 dias úteis", price: 35.20 },
  { id: "pac", name: "PAC - Correios", days: "7 a 10 dias úteis", price: 21.76 },
  { id: "jadlog", name: "JadLog Package", days: "4 a 6 dias úteis", price: 27.10 },
];

type CheckoutStep = "form" | "payment" | "confirmed";

const Checkout = () => {
  const { items, clearCart } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<AddressData | null>(null);
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);

  // Payment state
  const [step, setStep] = useState<CheckoutStep>("form");
  const [pixCode, setPixCode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loadingPix, setLoadingPix] = useState(false);
  const [pixError, setPixError] = useState("");
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAddress = useCallback(async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setLoadingCep(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado");
        setAddress(null);
      } else {
        setAddress({
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          localidade: data.localidade || "",
          uf: data.uf || "",
        });
      }
    } catch {
      setCepError("Erro ao buscar CEP");
      setAddress(null);
    } finally {
      setLoadingCep(false);
    }
  }, []);

  const handleCepChange = (value: string) => {
    const masked = value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
    setCep(masked);
    if (value.replace(/\D/g, "").length === 8) {
      fetchAddress(value);
    }
  };

  const toggleBump = (id: string) => {
    setSelectedBumps((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const bumpTotal = orderBumps
    .filter((b) => selectedBumps.includes(b.id))
    .reduce((sum, b) => sum + b.price, 0);

  const shippingPrice = shippingOptions.find((s) => s.id === selectedShipping)?.price || 0;
  const total = bumpTotal + shippingPrice;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid = name.trim() && isEmailValid && cpf.replace(/\D/g, "").length === 11 && phone.replace(/\D/g, "").length >= 10 && address && selectedShipping;

  // Create PIX charge via backend
  const handleCreatePix = async () => {
    if (!isFormValid || total <= 0) return;
    setLoadingPix(true);
    setPixError("");

    try {
      const amountCents = Math.round(total * 100);
      const selectedBumpItems = orderBumps.filter((b) => selectedBumps.includes(b.id));

      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCents,
          customer: {
            name: name.trim(),
            email: email.trim(),
            document: cpf.replace(/\D/g, ""),
            phone: phone.replace(/\D/g, ""),
          },
          items: [
            ...items.map((i) => ({ name: i.product.name, quantity: i.quantity, amount: 0 })),
            ...selectedBumpItems.map((b) => ({ name: b.name, quantity: 1, amount: Math.round(b.price * 100) })),
          ],
          utm: getUtmQueryString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao criar cobrança PIX");

      setPixCode(data.pixCode);
      setTransactionId(data.transactionId);
      setStep("payment");
    } catch (err: unknown) {
      setPixError(err instanceof Error ? err.message : "Erro ao criar cobrança PIX");
    } finally {
      setLoadingPix(false);
    }
  };

  // Poll for payment status
  useEffect(() => {
    if (step !== "payment" || !transactionId) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/pix/status?transactionId=${encodeURIComponent(transactionId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "COMPLETED") {
          setStep("confirmed");
          clearCart();
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        }
      } catch { /* next poll cycle handles it */ }
    };

    pollingRef.current = setInterval(pollStatus, 5000);
    pollStatus();

    // Stop polling after 15 minutes
    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setPixError("Tempo de pagamento expirado. Tente novamente.");
      setStep("form");
    }, 15 * 60 * 1000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [step, transactionId, clearCart]);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  // Confirmed screen
  if (step === "confirmed") {
    return (
      <main className="min-h-screen bg-background">
        <div className="container max-w-lg py-12 md:py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 mb-6">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground mb-6">
            Seu pedido foi processado com sucesso. Você receberá os detalhes no e-mail <strong>{email}</strong>.
          </p>
          <a href={`/${getUtmSearch()}`} className="inline-block rounded-lg bg-buy-button px-8 py-3 text-sm font-semibold text-buy-button-foreground uppercase tracking-wide hover:opacity-90 transition-opacity">
            Voltar à Loja
          </a>
        </div>
      </main>
    );
  }

  // Payment screen (QR Code)
  if (step === "payment") {
    return (
      <main className="min-h-screen bg-background">
        <div className="container max-w-lg py-8 md:py-12">
          <div className="rounded-xl border border-border p-6 md:p-8 text-center space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Pague com PIX</h2>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code ou copie o código abaixo
              </p>
            </div>

            <div className="flex justify-center">
              <div className="rounded-xl border-2 border-border p-4 bg-white">
                <QRCodeSVG value={pixCode} size={220} level="M" />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Código PIX Copia e Cola:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixCode}
                  className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs text-foreground truncate"
                />
                <button
                  onClick={handleCopyPix}
                  className="flex items-center gap-1.5 rounded-lg bg-buy-button px-4 py-2.5 text-xs font-semibold text-buy-button-foreground uppercase hover:opacity-90 transition-opacity shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguardando pagamento...</span>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-5xl py-6 md:py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 md:gap-12">
          {/* Left: Form */}
          <div className="space-y-6 md:space-y-8">
            {/* Contact */}
            <section>
              <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Contato</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="CPF (somente números)"
                    value={cpf}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => d ? `${a}.${b}.${c}-${d}` : v.length > 6 ? `${a}.${b}.${c}` : v.length > 3 ? `${a}.${b}` : a));
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Telefone (DDD + número)"
                    value={phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setPhone(v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : v.length > 2 ? `(${a}) ${b}` : v.length > 0 ? `(${a}` : ""));
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Delivery */}
            <section>
              <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Entrega</h2>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="CEP"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  {loadingCep && <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>}
                  {cepError && <p className="text-xs text-destructive mt-1">{cepError}</p>}
                </div>

                {address && (
                  <>
                    <div className="grid grid-cols-[1fr_100px] md:grid-cols-[1fr_120px] gap-3">
                      <input
                        type="text"
                        placeholder="Endereço"
                        value={address.logradouro}
                        onChange={(e) => setAddress({ ...address, logradouro: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Nº"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Complemento (opcional)"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Bairro"
                        value={address.bairro}
                        onChange={(e) => setAddress({ ...address, bairro: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={address.localidade}
                        onChange={(e) => setAddress({ ...address, localidade: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Estado"
                        value={address.uf}
                        onChange={(e) => setAddress({ ...address, uf: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Shipping */}
            {address && (
              <section>
                <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Forma de frete</h2>
                <div className="space-y-2.5">
                  {shippingOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between rounded-xl border-2 px-4 md:px-5 py-3 md:py-4 cursor-pointer transition-all ${
                        selectedShipping === opt.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedShipping === opt.id ? "border-primary" : "border-muted-foreground"
                        }`}>
                          {selectedShipping === opt.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{opt.name}</p>
                          <p className="text-xs text-muted-foreground">{opt.days}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary shrink-0">
                        R$ {opt.price.toFixed(2).replace(".", ",")}
                      </span>
                      <input
                        type="radio"
                        name="shipping"
                        value={opt.id}
                        checked={selectedShipping === opt.id}
                        onChange={() => setSelectedShipping(opt.id)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </section>
            )}

            {/* Order Bumps */}
            <section>
              <h2 className="text-base md:text-lg font-bold text-foreground mb-1.5">Aproveite e leve também!</h2>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">Ofertas exclusivas só nesta página</p>
              <div className="space-y-2.5 md:space-y-3">
                {orderBumps.map((bump) => (
                  <OrderBumpCard
                    key={bump.id}
                    bump={bump}
                    selected={selectedBumps.includes(bump.id)}
                    onToggle={() => toggleBump(bump.id)}
                  />
                ))}
              </div>
            </section>

            {/* Pay Button - Mobile */}
            <div className="md:hidden">
              <PayButton
                loading={loadingPix}
                disabled={!isFormValid || total <= 0}
                total={total}
                error={pixError}
                onClick={handleCreatePix}
              />
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="hidden md:block md:sticky md:top-24 self-start">
            <div className="rounded-xl border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase">Resumo do pedido</h3>
              <OrderSummaryItems items={items} selectedBumps={selectedBumps} />

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produtos</span>
                  <span className="text-accent font-bold">GRÁTIS</span>
                </div>
                {bumpTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Extras</span>
                    <span className="text-foreground font-bold">R$ {bumpTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-foreground font-medium">
                    {selectedShipping ? `R$ ${shippingPrice.toFixed(2).replace(".", ",")}` : "Inserir endereço"}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center">
                <span className="text-base font-bold text-foreground">Total</span>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground mr-1">BRL</span>
                  <span className="text-xl font-bold text-foreground">
                    R$ {total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              <PayButton
                loading={loadingPix}
                disabled={!isFormValid || total <= 0}
                total={total}
                error={pixError}
                onClick={handleCreatePix}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky summary */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 z-40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>
      <div className="md:hidden h-16" /> {/* spacer for sticky footer */}
    </main>
  );
};

function PayButton({ loading, disabled, total, error, onClick }: {
  loading: boolean;
  disabled: boolean;
  total: number;
  error: string;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className="w-full rounded-lg bg-accent py-3.5 text-sm font-bold uppercase tracking-wide text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando PIX...
          </>
        ) : (
          `Pagar R$ ${total.toFixed(2).replace(".", ",")} via PIX`
        )}
      </button>
      {error && <p className="text-xs text-destructive mt-2 text-center">{error}</p>}
    </div>
  );
}

function OrderSummaryItems({ items, selectedBumps }: { items: { product: { id: string; name: string; images: string[]; originalPrice?: number } ; quantity: number }[]; selectedBumps: string[] }) {
  return (
    <div className="space-y-3 max-h-[240px] overflow-y-auto">
      {items.map((item) => (
        <div key={item.product.id} className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img src={item.product.images[0]} alt={item.product.name} className="h-12 w-12 md:h-14 md:w-14 rounded-lg object-cover" />
            {item.quantity > 1 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                {item.quantity}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate uppercase">{item.product.name}</p>
          </div>
          <span className="text-xs font-bold text-accent shrink-0">GRÁTIS</span>
        </div>
      ))}
      {selectedBumps.map((bId) => {
        const bump = orderBumps.find((b) => b.id === bId);
        if (!bump) return null;
        return (
          <div key={bump.id} className="flex items-center gap-3">
            <img src={bump.image} alt={bump.name} className="h-12 w-12 md:h-14 md:w-14 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate uppercase">{bump.name}</p>
            </div>
            <span className="text-xs font-bold text-foreground shrink-0">
              R$ {bump.price.toFixed(2).replace(".", ",")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderBumpCard({ bump, selected, onToggle }: { bump: OrderBump; selected: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 md:gap-4 rounded-xl border-2 p-3 md:p-4 cursor-pointer transition-all ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
      }`}
    >
      <img src={bump.image} alt={bump.name} className="h-14 w-14 md:h-16 md:w-16 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm font-semibold text-foreground uppercase truncate">{bump.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs md:text-sm font-bold text-primary">
            R$ {bump.price.toFixed(2).replace(".", ",")}
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground line-through">
            R$ {bump.originalPrice.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>
      <button className={`flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-foreground"
      }`}>
        {selected ? <Check className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />}
      </button>
    </div>
  );
}

export default Checkout;
