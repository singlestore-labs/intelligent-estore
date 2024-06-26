import { toChunks } from "@repo/helpers";
import { writeFile } from "fs/promises";
import path from "path";

export async function writeDataset<T extends any[]>(
  name: string,
  data: T,
  options: { index?: number; length?: number } = {},
) {
  const { index = 0, length = 100_000 } = options;
  let i = index;

  const write = async (data: T) => {
    await writeFile(
      path.join(process.cwd(), `export/${name}${i > 0 ? `-${i}` : ""}.json`),
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  };

  if (data.length > length) {
    for await (const chunk of toChunks(data, length)) {
      i++;
      await write(chunk as T);
    }
  } else {
    return write(data);
  }
}
