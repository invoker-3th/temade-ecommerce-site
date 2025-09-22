
export type ColorImage = {
  src: string;
  alt: string;
};

export type ColorVariant = {
  colorName: string;
  images: ColorImage[];
  price?: number; // Optional price for specific color variants
};

export type CategoryImage = {
  id: string;
  name: string;
  colorVariants: ColorVariant[];
  price: number;
  description: string;
  sizes: string[];
};

const defaultSizes = ["S", "M", "L", "XL"];

export const baseCategoryImages: Record<string, CategoryImage[]> = {
  "TOPS": [
    {
      id: "column-dress",
      name: "Column Dress",
      price: 115000,
      description: "A vibrant floral dress perfect for spring and summer outings. Light and breezy with a flattering fit.",
      sizes: defaultSizes,
      colorVariants: [
         {
          colorName: "Pink",
          images: [
            { src: "/coloumn-Stretch-Woven2.jpg", alt: "Column Stretch Pink Front" },
            { src: "/coloumn-Stretch-Woven3.jpg", alt: "Column Stretch Pink Side" },
          ],
        },
        {
          colorName: "Black",
          images: [
            { src: "/coloumn-Cotton-Adire.jpg", alt: "column dress black  Front" },
            { src: "/coloumn-Cotton-Adire3.jpg", alt: "column dress black back" },
          ],
        }
       
      ],
    },
    {
      id: "clarinet-dress",
      name: "Clarinet Dress",
      price: 125000,
      description: "Comfortable and stylish casual maxi dress, perfect for everyday wear or a relaxed evening out.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "white",
          images: [
            { src: "/clarinet-Cotton-Adire.jpg", alt: "clarinet cotton adire white Front" },
            { src: "/clarinet-Cotton-Adire3.jpg", alt: "clarinet cotton adire white Back" },
          ],
        },
        {
          colorName: "Blue",
          images: [
            { src: "/clarinet-Stretch-Woven.jpg", alt: "clarinet stretch Front" },
            { src: "/clarinet-Stretch-Woven3.jpg", alt: "clarinet stretch back" },
          ],
          price: 115000,
        },
      ],
    },
  ],
  SKIRTS: [
    {
      id: "flute-skirt",
      name: "Flute Skirt",
      price: 90000,
      description: "A charming floral skirt that pairs well with any top, designed for a feminine and fresh look.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "white",
          images: [
            { src: "/clarinet-Cotton-Adire.jpg", alt: "clarinet cotton adire white Front" },
            { src: "/clarinet-Cotton-Adire3.jpg", alt: "clarinet cotton adire white Back" },
          ],
        },
        {
          colorName: "Blue",
          images: [
            { src: "/clarinet-Stretch-Woven.jpg", alt: "clarinet stretch Front" },
            { src: "/clarinet-Stretch-Woven3.jpg", alt: "clarinet stretch back" },
          ],
          price: 115000,
        },
      ],
    },
   
  ],
  PANTS: [
 {
      id: "loop-top",
      name: "Loop Top",
      price: 60000,
      description: "A versatile casual maxi skirt, perfect for both casual days and dressier occasions.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "Black",
          images: [
            { src: "/loop-Cotton-Adire.png", alt: "loop-top Front" },
            { src: "/loop-Cotton-Adire3.png", alt: "loop-top side" },
          ],
        },
        {
          colorName: "Red",
          images: [
            { src: "/loop-Cotton-Adire.png", alt: "loop-top Front" },
            { src: "/loop-Cotton-Adire3.png", alt: "loop-top side" },
          ],
        },
      ],
    },
    {
      id: "step-top",
      name: "Step Top",
      price: 70000,
      description: "Simple and chic casual top that pairs well with jeans or skirts for an effortless look.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "blue",
          images: [
            { src: "/step-Cotton-Adire-Blue.png", alt: "Casual Top White Front" },
            { src: "/step-Cotton-Adire-Blue2.jpg", alt: "Casual Top White Back" },
          ],
        },
        {
          colorName: "pink",
          images: [
            { src: "/step-Stretch-Woven.jpg", alt: "Casual Top Black Front" },

          ],
        },
      ],
    },
  ],
  DRESSES: [
    {
      id: "floral-dress-p",
      name: "Floral Dress",
      price: 45.99,
      description: "Comfortable floral dress designed for casual wear with a touch of elegance.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "Beige",
          images: [
            { src: "/Rectangle-2.jpg", alt: "Floral Pants Beige Front" },
            { src: "/Rectangle-2.jpg", alt: "Floral Pants Beige Back" },
          ],
        },
        {
          colorName: "Brown",
          images: [
            { src: "/Rectangle.jpg", alt: "Floral Pants Brown Front" },
            { src: "/Rectangle-2.jpg", alt: "Floral Pants Brown Side" },
          ],
        },
      ],
    },
    {
      id: "casual-maxi-p",
      name: "Casual Maxi",
      price: 39.99,
      description: "Classic casual pants suitable for everyday wear with a modern fit.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "Gray",
          images: [
            { src: "/Rectangle.jpg", alt: "Casual Pants Gray Front" },
            { src: "/Rectangle-2.jpg", alt: "Casual Pants Gray Side" },
          ],
        },
        {
          colorName: "Black",
          images: [
            { src: "/Rectangle.jpg", alt: "Casual Pants Black Front" },
            { src: "/Rectangle-2.jpg", alt: "Casual Pants Black Back" },
          ],
        },
      ],
    },
  ],
  JACKETS: [
    {
      id: "floral-dress",
      name: "Floral Dress",
      price: 45.99,
      description: "Comfortable floral dress designed for casual wear with a touch of elegance.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "Beige",
          images: [
            { src: "/Rectangle-2.jpg", alt: "Floral Pants Beige Front" },
            { src: "/Rectangle-2.jpg", alt: "Floral Pants Beige Back" },
          ],
        },
        {
          colorName: "Brown",
          images: [
            { src: "/Rectangle.jpg", alt: "Floral Pants Brown Front" },
            { src: "/Rectangle-2.jpg", alt: "Floral Pants Brown Side" },
          ],
        },
      ],
    },
    {
      id: "casual-maxi",
      name: "Casual Maxi",
      price: 39.99,
      description: "Classic casual pants suitable for everyday wear with a modern fit.",
      sizes: defaultSizes,
      colorVariants: [
        {
          colorName: "Gray",
          images: [
            { src: "/Rectangle.jpg", alt: "Casual Pants Gray Front" },
            { src: "/Rectangle-2.jpg", alt: "Casual Pants Gray Side" },
          ],
        },
        {
          colorName: "Black",
          images: [
            { src: "/Rectangle.jpg", alt: "Casual Pants Black Front" },
            { src: "/Rectangle-2.jpg", alt: "Casual Pants Black Back" },
          ],
        },
      ],
    },
  ],
};

// Flatten for "All" category
export const categoryImages: Record<string, CategoryImage[]> = {
  All: Object.values(baseCategoryImages).flat(),
  ...baseCategoryImages,
};

// List of categories for navigation/buttons
export const categories: string[] = Object.keys(categoryImages);
