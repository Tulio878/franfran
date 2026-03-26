export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
}

export const products: Product[] = [
  {
    id: "1",
    slug: "gloss-franboesa",
    name: "Gloss Franboesa Fran by Franciny Ehlke",
    price: 0,
    originalPrice: 69.90,
    images: [
      "/images/gloss-franboesa-01.jpg",
      "/images/gloss-franboesa-02.jpg",
      "/images/gloss-franboesa-03.jpg",
      "/images/gloss-franboesa-04.jpg",
      "/images/gloss-franboesa-05.jpg",
      "/images/gloss-franboesa-06.jpg",
    ],
    description:
      "O gloss FRANboesa chegou pra dar aquele efeito de lábios macios que eu amo, com brilho vinílico na medida certa. A cor framboesa realça naturalmente a boca, enquanto a textura é confortável e hidratante. É aquele gloss que combina com todos os momentos do dia. E, claro, tem cheirinho de framboesa, aquela que dá vontade de reaplicar só pra sentir de novo.",
  },
  {
    id: "2",
    slug: "gloss-lip-bunny",
    name: "Gloss Lip Bunny Fran by Franciny Ehlke",
    price: 0,
    originalPrice: 65.90,
    images: [
      "/images/lip-bunny-01.jpg",
      "/images/lip-bunny-02.jpg",
      "/images/lip-bunny-03.jpg",
    ],
    description:
      "O LIP BUNNY é nosso gloss de chocolate, marrom cacau com brilhinhos que fica lindo em TODO tom de pele. Ele tem textura espelhada, super confortável, hidrata, suaviza as linhas e ainda vem numa embalagem colecionável mara. É pra usar, amar e carregar sempre com você! Peso líquido: 5g",
  },
  {
    id: "3",
    slug: "kit-fran-bride",
    name: "Bride Kit Fran by Franciny Ehlke",
    price: 0,
    originalPrice: 139.90,
    images: [
      "/images/kit-bride-01.jpg",
      "/images/kit-bride-02.jpg",
      "/images/kit-bride-03.jpg",
    ],
    description:
      "Esse é, sem dúvidas, o lançamento mais especial da minha vida! O Bride Kit nasceu do desejo de compartilhar um pedacinho desse dia tão especial. É uma edição limitada com os produtos que usei no meu grande dia, criados pensando na make dos meus sonhos! Inclui: Lip Bride (gloss transparente com efeito vinílico), Shine Bride (iluminador com brilho acetinado) e Blush Bride (blush com o tom de rosa perfeito).",
  },
  {
    id: "4",
    slug: "love-kit",
    name: "Love Kit Gloss Labial e Lápis Labial Fran by Franciny Ehlke",
    price: 0,
    originalPrice: 129.90,
    images: [
      "/images/love-kit-01.jpg",
      "/images/love-kit-02.jpg",
      "/images/love-kit-03.jpg",
    ],
    description:
      "O LOVE KIT é uma edição apaixonante, pensado para realçar sua beleza com charme e atitude. Ele chegou para transformar o seu jeito de viver o amor - com brilho, cor e sofisticação! Inclui: LOVECHILLI (best-seller rosado com brilhos multidimensionais e efeito chilli plump), LIPLOVE (gloss com ponteira chubby, ultra-hidratante com acabamento brilhoso) e LOVELINER (lápis apontável de alta pigmentação). Se é pra amar, que seja com o bocão perfeito!",
  },
];

export interface OrderBump {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
}

export const orderBumps: OrderBump[] = [
  {
    id: "bump-1",
    name: "Kit Fran Glosslicious",
    price: 33.56,
    originalPrice: 109.90,
    image: "/images/glosslicious-01.jpg",
  },
  {
    id: "bump-2",
    name: "Gloss LipHoney Fran",
    price: 24.48,
    originalPrice: 69.90,
    image: "/images/liphoney-01.jpg",
  },
  {
    id: "bump-3",
    name: "Kit Fran Chillicake",
    price: 29.90,
    originalPrice: 149.90,
    image: "/images/kit-chillicake-01.jpg",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
