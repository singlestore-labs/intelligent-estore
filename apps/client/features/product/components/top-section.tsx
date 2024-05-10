import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ComponentProps } from "@/types";
import { Section, SectionProps } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ROUTES } from "@/constants/routes";
import { ProductInfoItem } from "@/product/components/info-item";
import { countProductSales } from "@/product/lib/count-sales";
import { getTopProducts } from "@/product/lib/get-top";
import { ProductSalesChart } from "@/product/sales/components/chart";
import { cn } from "@/ui/lib";

export type ProductTopSectionProps = ComponentProps<SectionProps>;

export async function ProductTopSection({ className, ...props }: ProductTopSectionProps) {
  const products = await getTopProducts();
  const productSales = await Promise.all(products.map(({ id }) => countProductSales(id)));

  return (
    <Section
      {...props}
      className={cn("overflow-hidden", className)}
      title="Top products"
      description="Best selling and most liked products"
      size="sm"
      contentProps={{ className: "p-0 max-h-[35rem] overflow-auto" }}
    >
      <ul className="flex flex-col text-sm">
        {products.map((product, i) => {
          const href = ROUTES.PRODUCT_BY_ID(product.id);

          return (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-4 border-b p-4"
            >
              <div className="flex flex-grow basis-32 items-center gap-4 max-md:basis-full max-md:flex-wrap max-md:justify-center">
                <Card className="relative size-20 shrink-0 overflow-hidden">
                  <Image
                    className="object-cover"
                    src={product.image}
                    alt="Glasses"
                    fill
                    unoptimized
                  />
                  <Link
                    href={href}
                    className="absolute z-[1] h-full w-full"
                  />
                </Card>

                <div className="max-md:basis-full max-md:text-center">
                  <Link
                    href={href}
                    className="hover:text-primary inline-block transition-colors"
                  >
                    <h4 className="line-clamp-2 text-base font-semibold capitalize">{product.description}</h4>
                  </Link>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <ProductInfoItem
                  className="h-auto"
                  label="Price"
                >
                  {`$${product.price}`}
                </ProductInfoItem>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <ProductInfoItem
                  className="h-auto"
                  label="Sales"
                  icon={ShoppingCart}
                  iconClassName="size-4 mb-0.5"
                >
                  {productSales[i]}
                </ProductInfoItem>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <ProductInfoItem
                  className="h-auto"
                  label="Likes"
                  icon={Heart}
                  iconClassName="size-4"
                >
                  {product.likes}
                </ProductInfoItem>
              </div>

              {!!product.sales.length && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ProductSalesChart
                        className="h-16 max-w-48 flex-1 max-md:max-w-full max-md:basis-full"
                        sales={product.sales}
                        withTooltip={false}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="text-center text-xs">
                      <p>
                        {product.sales.reduce((acc, i) => acc + i.value, 0)}
                        {` sales for the last ${product.sales.length} days`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}