import { embeddings } from "@/data/embeddings";
import { createFindProductIdsQuery } from "@/product/queries/find-ids";
import { createGetTopProductIdsQuery } from "@/product/queries/get-top-ids";
import { createGetProductSalesHistoryQuery } from "@/product/sales/queries/get-history";
import { QUERY_SLUGS } from "@/query/constants/slugs";
import { Query } from "@/query/type";

export const QUERY_LIST = [
  {
    slug: QUERY_SLUGS.find_products,
    title: "Find products",
    description: "Finds product ids based on filters using hybrid search",
    getQuery: () => {
      return createFindProductIdsQuery(embeddings.jeans, {
        color: "blue",
        priceMin: 100,
        priceMax: 1000,
        gender: "women",
        size: "xs",
        limit: 5,
      });
    },
  },

  {
    slug: QUERY_SLUGS.top_products,
    title: "Top products",
    description: "Retrieves the top product ids based on sales and likes",
    getQuery: () => createGetTopProductIdsQuery({ limit: 10 }),
  },

  {
    slug: QUERY_SLUGS.product_sales,
    title: "Product sales",
    description: "Retrieves the sales history of a product",
    getQuery: () => createGetProductSalesHistoryQuery({ id: 1 }, { daysInterval: 30 }),
  },
] satisfies Query[];