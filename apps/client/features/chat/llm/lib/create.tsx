import { db } from "@repo/db";
import { CHAT_MESSAGES_TABLE_NAME } from "@repo/db/constants";
import OpenAI from "openai";
import { ReactNode } from "react";
import zodToJsonSchema from "zod-to-json-schema";

import { createChatLLMMessage } from "@/chat/llm/message/lib/create";
import { normalizeChatLLMMessage } from "@/chat/llm/message/lib/normalize";
import { ChatLLMMessage } from "@/chat/llm/message/types";
import { chatLLMTools } from "@/chat/llm/tool";
import { createChatLLMToolHandler } from "@/chat/llm/tool/lib/create-handler";
import { OPENAI_API_KEY } from "@/constants/env";
import { getUserId } from "@/user/lib/get-id";

export async function createChatLLM() {
  const userId = await getUserId();

  const llm = new OpenAI({ apiKey: OPENAI_API_KEY });

  async function getMessages() {
    const chatLLMMessage = await db.controllers.findMany<ChatLLMMessage[]>({
      collection: CHAT_MESSAGES_TABLE_NAME,
      where: `userId = ${userId}`,
      extra: "ORDER BY createdAt ASC",
    });
    return chatLLMMessage.map(normalizeChatLLMMessage);
  }

  function clearMessages() {
    return db.controllers.deleteMany({
      collection: CHAT_MESSAGES_TABLE_NAME,
      where: `userId = ${userId}`,
    });
  }

  async function sendMessage(
    content: string,
    {
      onContent,
      onNode,
    }: {
      onContent?: (content: string) => Promise<void>;
      onNode?: (node: ReactNode) => Promise<void>;
    } = {},
  ) {
    if (!userId) throw new Error("userId is undefined");

    const [stream] = await Promise.all([
      llm.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        stream: true,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content },
        ],
        tools: Object.values(chatLLMTools).map(({ name, description, schema }) => ({
          type: "function",
          function: { name, description, parameters: zodToJsonSchema(schema) },
        })),
      }),

      createChatLLMMessage({ role: "user", userId, content: JSON.stringify(content) }),
    ]);

    const { handleDeltaTool, callTool } = createChatLLMToolHandler();

    let llmContent = "";
    for await (const chunk of stream) {
      const tool = chunk.choices[0].delta.tool_calls?.[0]?.function;
      const content = chunk.choices[0].delta.content || "";
      if (tool) handleDeltaTool(tool);
      if (content) {
        llmContent += content;
        await onContent?.(content);
      }
    }

    await Promise.all([
      (async () => {
        if (!llmContent) return;
        return createChatLLMMessage({
          role: "assistant",
          userId,
          content: JSON.stringify(llmContent),
        });
      })(),
      callTool({
        onResult: async (result) => {
          await createChatLLMMessage({ role: "function", userId, content: JSON.stringify(result) });
        },
        onNode: onNode,
      }),
    ]);
  }

  return { getMessages, clearMessages, sendMessage };
}