import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import PromoBanner from "./PromoBanner";

const Header = () => {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <>
      <PromoBanner />
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="container flex h-[72px] items-center justify-between">
          <div className="w-10" />
          <Link to="/loja" className="flex flex-col items-center">
            <svg viewBox="0 0 200 50" className="h-10 w-auto" aria-label="FRAN by Franciny Ehlke">
              <text x="100" y="36" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="42" letterSpacing="-1" fill="hsl(0 0% 12%)">
                FRAN
              </text>
              <text x="100" y="48" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="500" fontSize="8" letterSpacing="3" fill="hsl(0 0% 45%)">
                BY FRANCINY EHLKE
              </text>
            </svg>
          </Link>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 transition-colors duration-200 hover:text-primary"
            aria-label="Abrir sacola"
          >
            <ShoppingBag className="h-6 w-6 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </button>
        </div>
        <nav className="border-t border-border">
          <div className="container flex justify-center py-3">
            <Link
              to="/loja"
              className="text-xs font-semibold uppercase tracking-[0.06em] text-foreground hover:text-primary transition-colors duration-200"
            >
              Todos os Produtos
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
