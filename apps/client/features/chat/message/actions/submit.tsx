"use server";

import { createStreamableUI, createStreamableValue } from "ai/rsc";

import { forwardActionError } from "@/action/error/lib/forward";
import { createChatLLM } from "@/chat/llm/lib/create";
import { createChatMessage } from "@/chat/message/lib/create";

export async function submitChatMessage(content: string) {
  try {
    const chatLLM = await createChatLLM();
    let isLoading = true;

    const textStream: ReturnType<typeof createStreamableValue<string>> = createStreamableValue("");
    const { node, ...message } = createChatMessage({ role: "assistant", content: textStream.value, isLoading });

    const nodeStream = createStreamableUI(node);

    (async () => {
      try {
        await chatLLM.sendMessage(content, {
          onContent: async (content) => {
            if (content && isLoading) {
              isLoading = false;
              nodeStream.done(createChatMessage({ ...message, isLoading }).node);
            }
            textStream.update(content);
          },

          onNode: async (node) => {
            isLoading = false;
            if (node) nodeStream.done(createChatMessage({ ...message, isLoading, node }).node);
          },

          onError: async (error) => {
            isLoading = false;
            nodeStream.done(
              createChatMessage({
                ...message,
                isLoading,
                error: error instanceof Error ? error.message : "UnknownError",
              }).node,
            );
          },
        });
      } catch (error) {
        console.error(error);
      }

      textStream.done();
    })();

    return { ...message, node: nodeStream.value };
  } catch (error) {
    return forwardActionError(error);
  }
}
