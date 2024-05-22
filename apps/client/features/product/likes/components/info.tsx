"use client";

import { useAtomValue } from "jotai/react";
import { Heart } from "lucide-react";

import { ComponentProps } from "@/types";
import { ProductInfoItem, ProductInfoItemProps } from "@/product/components/info-item";
import { Product } from "@/product/types";
import { store } from "@/store";
import { cn } from "@/ui/lib";
import { userProdcutLikesAtom } from "@/user/product/atoms/likes";

export type ProductLikesInfoProps = ComponentProps<
  ProductInfoItemProps,
  { value: Product["likes"] | string; productId: Product["id"] }
>;

export function ProductLikesInfo({ className, value, productId, ...props }: ProductLikesInfoProps) {
  const likes = useAtomValue(userProdcutLikesAtom, { store });
  const isLiked = likes.find((i) => i.product_id === productId);

  return (
    <ProductInfoItem
      {...props}
      className={cn("", isLiked && "[&_[fill]]:fill-primary [&_[stroke]]:stroke-primary", className)}
      icon={Heart}
      label="Likes"
    >
      {value}
    </ProductInfoItem>
  );
}
