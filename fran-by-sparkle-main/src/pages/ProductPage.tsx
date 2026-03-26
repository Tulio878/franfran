import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { getProductBySlug, products } from "@/data/products";
import { useCart } from "@/context/CartContext";

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  if (!product) {
    return (
      <main className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
      </main>
    );
  }

  const otherProducts = products.filter((p) => p.id !== product.id);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsCartOpen(true);
    }, 400);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) nextImage();
    else if (diff < -threshold) prevImage();
  };

  return (
    <main>
      <div className="container py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          {/* Image Gallery */}
          <div className="flex gap-3 md:gap-4">
            {/* Thumbnails - vertical on desktop */}
            <div className="hidden md:flex flex-col gap-2 w-[72px] shrink-0 max-h-[500px] overflow-y-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-[72px] h-[72px] overflow-hidden rounded border-2 transition-all duration-200 shrink-0 ${
                    selectedImage === i
                      ? "border-foreground"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image with swipe */}
            <div
              className="relative flex-1 aspect-square overflow-hidden rounded-lg bg-secondary touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover transition-opacity duration-300"
                draggable={false}
              />
              {product.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-background">
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-background">
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </>
              )}
              {/* Dots - mobile */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-2 rounded-full transition-all ${
                      selectedImage === i ? "bg-foreground w-5" : "bg-foreground/40 w-2"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-lg md:text-2xl font-bold text-foreground tracking-[-0.02em] uppercase">
              {product.name}
            </h1>
            <div className="mt-3 md:mt-4 flex items-center gap-3">
              {product.originalPrice && product.originalPrice > 0 && (
                <span className="text-base md:text-lg text-muted-foreground line-through">
                  R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                </span>
              )}
              <span className="text-lg md:text-xl font-bold text-accent">GRÁTIS</span>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-6 md:mt-8 flex gap-3">
              <div className="flex items-center border border-border rounded-md">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-11 md:h-12 w-9 md:w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 md:w-10 text-center text-sm font-medium text-foreground">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="flex h-11 md:h-12 w-9 md:w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 rounded-md bg-buy-button py-3 text-xs md:text-sm font-semibold uppercase tracking-[0.06em] text-buy-button-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              >
                {added ? "✓ ADICIONADO!" : "ADICIONAR AO CARRINHO"}
              </button>
            </div>

            <div className="mt-3 md:mt-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Em estoque</span>
            </div>

            <div className="mt-6 md:mt-8 border-t border-border pt-5 md:pt-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 md:mb-4">Descrição</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Other Products */}
      <section className="container pb-8 md:pb-12">
        <h2 className="text-base md:text-lg font-bold text-foreground tracking-[-0.02em] mb-4 md:mb-6 uppercase">Compre Junto</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {otherProducts.map((p) => (
            <div key={p.id} className="group rounded-xl bg-card shadow-[0_0_0_1px_rgba(0,0,0,.05),0_2px_6px_rgba(0,0,0,.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(0,0,0,.08),0_8px_24px_rgba(0,0,0,.1)]">
              <Link to={`/produto/${p.slug}`}>
                <div className="aspect-square overflow-hidden rounded-t-xl">
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="px-2.5 md:px-3 pt-2.5 md:pt-3">
                  <h3 className="text-[11px] md:text-sm font-semibold text-foreground leading-snug uppercase line-clamp-2">{p.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5 md:gap-2">
                    {p.originalPrice && p.originalPrice > 0 && (
                      <span className="text-[10px] md:text-xs text-muted-foreground line-through">
                        R$ {p.originalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span className="text-xs md:text-sm font-bold text-accent">GRÁTIS</span>
                  </div>
                </div>
              </Link>
              <div className="px-2.5 md:px-3 pb-2.5 md:pb-3 pt-2">
                <button
                  onClick={() => { addToCart(p); setIsCartOpen(true); }}
                  className="w-full rounded-md bg-buy-button py-2 text-[10px] md:text-xs font-semibold uppercase tracking-[0.04em] md:tracking-[0.06em] text-buy-button-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ProductPage;
