import { Instagram } from "lucide-react";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.8a4.84 4.84 0 01-1-.11z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const Footer = () => {
  return (
    <footer>
      {/* Top section - white bg with logo + social + sections */}
      <div className="bg-background border-t border-border">
        <div className="container py-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 200 50" className="h-12 w-auto" aria-label="FRAN by Franciny Ehlke">
                <text x="100" y="36" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="42" letterSpacing="-1" fill="hsl(0 0% 12%)">
                  FRAN
                </text>
                <text x="100" y="48" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="500" fontSize="8" letterSpacing="3" fill="hsl(0 0% 45%)">
                  BY FRANCINY EHLKE
                </text>
              </svg>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-4 mb-10">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Instagram className="h-5 w-5" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <TikTokIcon />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FacebookIcon />
            </span>
          </div>

          {/* Sections */}
          <div className="space-y-0 border-t border-border">
            <div className="border-b border-border py-4 px-2">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-[0.08em]">
                Precisa de Ajuda?
              </h3>
            </div>
            <div className="border-b border-border py-4 px-2">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-[0.08em]">
                Acompanhar Minha Compra
              </h3>
            </div>
            <div className="border-b border-border py-4 px-2">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-[0.08em]">
                Institucional
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section - dark bg */}
      <div className="bg-foreground">
        <div className="container py-10">
          {/* Dark logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-foreground border border-muted-foreground/30 px-8 py-4 rounded">
              <svg viewBox="0 0 200 50" className="h-10 w-auto" aria-label="FRAN by Franciny Ehlke">
                <text x="100" y="36" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="42" letterSpacing="-1" fill="white">
                  FRAN
                </text>
                <text x="100" y="48" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="500" fontSize="8" letterSpacing="3" fill="rgba(255,255,255,0.7)">
                  BY FRANCINY EHLKE
                </text>
              </svg>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-background/60 mt-4">
              © {new Date().getFullYear()} FRAN BY FR - Todos os direitos reservados.
            </p>
            <p className="text-xs text-background/40 mt-1">
              Preços e estoque sujeitos a alteração sem aviso prévio.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
