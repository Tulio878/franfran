import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const Index = () => {
  return (
    <main className="container py-8 md:py-12">
      <h1 className="text-2xl font-bold text-foreground tracking-[-0.02em] mb-8">
        Todos os Produtos
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
};

export default Index;
