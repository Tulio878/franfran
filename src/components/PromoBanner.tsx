const PromoBanner = () => {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-accent py-2 text-center">
      <p className="text-sm font-semibold tracking-wide text-accent-foreground">
        PROMOÇÃO OFICIAL DA FRAN: Válida até {today} por tempo ilimitado!
      </p>
    </div>
  );
};

export default PromoBanner;
