import { writeFile } from "fs/promises";
import { inspect } from "util";

import { db } from "@repo/db";
import { PRODUCTS_TABLE_NAME, PRODUCT_SIZES_TABLE_NAME, PRODUCT_SKU_TABLE_NAME } from "@repo/db/constants";

import { IS_DEV } from "@/constants/env";
import { getProductByIds } from "@/product/lib/get-by-ids";

export async function findProducts(
  prompt: string,
  filter: {
    color?: string;
    priceMin?: number;
    priceMax?: number;
    gender?: "women" | "unisex";
    size?: "xxxs" | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "oneSize";
    limit?: number;
  },
) {
  if (IS_DEV) console.log({ prompt, filter });

  const { color, priceMin, priceMax, gender, size, limit = 1 } = filter;
  const promptV = prompt ? (await db.ai.createEmbedding(prompt))[0] : undefined;
  const promptVJSON = promptV ? JSON.stringify(promptV) : "";
  const whereConditions: string[] = [];
  const joins: string[] = [];

  if (gender) whereConditions.push(`gender = '${gender}'`);
  if (priceMin && priceMax) whereConditions.push(`price BETWEEN ${priceMin} AND ${priceMax}`);
  else if (priceMin) whereConditions.push(`price >= ${priceMin}`);
  else if (priceMax) whereConditions.push(`price <= ${priceMax}`);

  if (size) {
    joins.push(`${PRODUCT_SKU_TABLE_NAME} sku ON p.id = sku.product_id`);
    joins.push(`${PRODUCT_SIZES_TABLE_NAME} size ON sku.product_size_id = size.id AND size.value = '${size}'`);
  }

  const where = whereConditions.join(" AND ");
  const join = joins.length ? `JOIN ${joins.join(" JOIN ")}` : "";

  let query = `\
    ${promptVJSON ? `SET @promptV = '${promptVJSON}' :> vector(${promptV!.length}) :> blob;` : ""}
    SELECT ft_result.id, ft_score, v_score, v_score2, 0.5 * IFNULL(ft_score, 0) + 0.5 * IFNULL(v_score + v_score2, 0) AS score
    FROM (
      SELECT p.id, ${color ? `MATCH(p.image_text) AGAINST ('${color}')` : "1"} AS ft_score
      FROM ${PRODUCTS_TABLE_NAME} p
      ${join}
      WHERE ft_score
      ${where ? `AND ${where}` : ""}
    ) ft_result FULL OUTER JOIN (
      SELECT
        p.id,
        ${promptVJSON ? `p.image_text_v <*> @promptV` : "1"} AS v_score,
        ${promptVJSON ? `p.description_v <*> @promptV` : "1"} AS v_score2
      FROM ${PRODUCTS_TABLE_NAME} p
      ${join}
      WHERE v_score >= 0.9 OR v_score2 >= 0.9
      ${where ? `AND ${where}` : ""}
      ORDER BY v_score + v_score2 DESC
      LIMIT 100
    ) v_result
    ON ft_result.id = v_result.id
    WHERE ft_score AND (v_score OR v_score2)
    ORDER BY score DESC
    LIMIT ${limit};
  `;

  const result = await db.controllers.query<[object, { id: number }[]]>({ query });

  if (IS_DEV) {
    console.log(inspect({ query, result }, true, 10, true));
    await writeFile("export/findProducts.txt", query);
  }

  return getProductByIds(result[1].map((i) => i.id));
}
