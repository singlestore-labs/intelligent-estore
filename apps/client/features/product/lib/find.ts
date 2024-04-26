import { db } from "@repo/db";
import { PRODUCTS_TABLE_NAME } from "@repo/db/constants";

import { getProductByIds } from "@/product/lib/get-by-ids";
import { Product } from "@/product/types";

export async function findProducts(
  prompt: string,
  filter: {
    color?: string;
    priceMin?: number;
    priceMax?: number;
    gender?: "women" | "unisex";
    size?: "xxxs" | "xxs" | "xs" | "s" | "m" | "l" | "xl";
    limit?: number;
  },
) {
  const { color, priceMin, priceMax, gender, size, limit } = filter;
  console.log({ prompt, filter });

  const promptV = (await db.ai.createEmbedding(prompt))[0];

  let query = `\
    SELECT id, imageText_v <*> '${JSON.stringify(promptV)}' :> VECTOR(${promptV.length}) as similarity
    FROM ${PRODUCTS_TABLE_NAME}
  `;

  const whereDefinitions = [];

  if (priceMin && priceMax) whereDefinitions.push(`price BETWEEN ${priceMin} AND ${priceMax}`);
  if (priceMin) whereDefinitions.push(`price >= ${priceMin}`);
  if (priceMax) whereDefinitions.push(`price <= ${priceMax}`);
  if (gender) whereDefinitions.push(`gender = '${gender}'`);

  if (whereDefinitions.length) {
    query += ` WHERE ${whereDefinitions.join(" AND ")}`;
  }

  query += ` ORDER BY similarity DESC`;

  if (limit) query += ` LIMIT ${limit}`;

  console.log(query);

  const result = await db.controllers.query<{ id: Product["id"]; similarity: number }[]>({ query });

  return getProductByIds(result.map((i) => i.id));
}
