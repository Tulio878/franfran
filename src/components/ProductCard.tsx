import { Link, useNavigate } from "react-router-dom";
import type { Product } from "@/data/products";
import { getUtmSearch } from "@/lib/utm";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/loja/produto/${product.slug}${getUtmSearch()}`);
  };

  return (
    <div className="group rounded-xl bg-card shadow-[0_0_0_1px_rgba(0,0,0,.05),0_2px_6px_rgba(0,0,0,.05)] transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(0,0,0,.08),0_8px_24px_rgba(0,0,0,.1)]">
      <Link to={`/loja/produto/${product.slug}${getUtmSearch()}`}>
        <div className="aspect-square overflow-hidden rounded-t-xl">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="px-3 md:px-4 pt-3 md:pt-4">
          <h3 className="text-[11px] md:text-sm font-semibold text-foreground leading-snug tracking-tight uppercase line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 md:gap-2 flex-wrap">
            {product.originalPrice && product.originalPrice > 0 && (
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                R$ {product.originalPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span className="text-sm md:text-base font-bold text-accent tracking-[-0.02em]">
              GRÁTIS
            </span>
          </div>
        </div>
      </Link>
      <div className="px-3 md:px-4 pb-3 md:pb-4 pt-2 md:pt-3">
        <button
          onClick={handleBuyNow}
          className="w-full rounded-lg bg-buy-button py-2 md:py-2.5 text-[10px] md:text-xs font-semibold uppercase tracking-[0.04em] md:tracking-[0.06em] text-buy-button-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          Comprar Agora
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
