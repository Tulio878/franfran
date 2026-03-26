import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { getUtmSearch } from "@/lib/utm";

const CartDrawer = () => {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, subtotal } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      <div className="fixed right-0 top-0 z-[60] h-full w-full max-w-md bg-background shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">SACOLA</h2>
              {items.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground mt-12">Sua sacola está vazia.</p>
            ) : (
              <div className="space-y-5">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 border-b border-border pb-5">
                    <img src={item.product.images[0]} alt={item.product.name} className="h-20 w-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground uppercase">{item.product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {item.product.originalPrice && item.product.originalPrice > 0 && (
                          <span className="text-xs text-muted-foreground line-through">
                            R$ {item.product.originalPrice.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                        <span className="text-sm font-bold text-accent">GRÁTIS</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-semibold text-foreground w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border px-6 py-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total estimado</span>
                <span className="text-xl font-bold text-accent">GRÁTIS</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-lg border border-foreground bg-background py-3 text-xs font-semibold uppercase tracking-[0.06em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Continuar Comprando
                </button>
                <button
                  onClick={() => { setIsCartOpen(false); navigate(`/loja/checkout${getUtmSearch()}`); }}
                  className="rounded-lg bg-buy-button py-3 text-xs font-semibold uppercase tracking-[0.06em] text-buy-button-foreground transition-colors hover:opacity-90"
                >
                  Finalizar a Compra
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
