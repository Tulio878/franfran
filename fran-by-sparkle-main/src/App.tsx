import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { captureUtmParams } from "@/lib/utm";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import QuizPage from "./pages/QuizPage";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

/** Re-capture URL params on every route change */
const LojaLayout = () => {
  const location = useLocation();
  useEffect(() => {
    captureUtmParams();
  }, [location.search]);
  return (
    <>
      <CartDrawer />
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/produto/:slug" element={<ProductPage />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
      <Footer />
    </>
  );
};


// Capture UTM/ad params on app load and persist to localStorage
captureUtmParams();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
          <Routes>
            {/* Quiz as landing page — no header/footer */}
            <Route path="/" element={<QuizPage />} />
            {/* Store routes with header/footer */}
            <Route
              path="/loja/*"
              element={
                <LojaLayout />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
