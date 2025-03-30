import { Message, SendMessage, LLMModel, ModelLookup } from '@/types/chat';

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const SUMMARY_URL = "https://openrouter.ai/api/v1/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models/";

/**
 * Validates the provided API key by making a request to the OpenRouter API
 * @param apiKey - The API key to validate
 * @returns Promise<boolean> - True if the API key is valid, false otherwise
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const creditsResponse = await fetch("https://openrouter.ai/api/v1/credits", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return creditsResponse.ok;
  } catch (error) {
    console.error("API key validation error:", error);
    return false;
  }
}

/**
 * Fetches available language models from the OpenRouter API
 * @returns Promise<ModelLookup> - Object mapping model IDs to their details
 */
export async function getAvailableModels(): Promise<ModelLookup> {
  try {
    const response = await fetch(MODELS_URL, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    
    const models = await response.json();
    return models.data.reduce((acc: ModelLookup, model: LLMModel) => {
      acc[model.id] = model;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching models:", error);
    return {};
  }
}

/**
 * Generates a title for a conversation using the Qwen model
 * @param apiKey - The API key for authentication
 * @param messages - Array of messages to summarize
 * @returns Promise<string> - Generated title for the conversation
 */
export async function generateTitle(apiKey: string, messages: SendMessage[]): Promise<string> {
  try {
    const response = await fetch(SUMMARY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-vl-72b-instruct:free",
        prompt: "avoid Punctuations, make a 9 words formal summary on this conversation: " + JSON.stringify(messages),
      }),
    });
    
    const data = await response.json();
    console.log('new title:', data.choices[0].text);
    return data.choices[0].text || "New Chat";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat";
  }
}

/**
 * Sends a message to the OpenRouter API and handles streaming response
 * @param apiKey - The API key for authentication
 * @param modelId - ID of the model to use
 * @param messages - Array of messages to send
 * @param onStreamUpdate - Callback function for handling streaming updates
 * @returns Promise<Message> - The complete bot message
 */
export async function sendMessage(
  apiKey: string,
  modelId: string,
  messages: SendMessage[],
  onStreamUpdate: (content: string, reason: string) => void
): Promise<{ content: string; reasoning: string }> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      stream: true
    }),
  });

  console.log('response:', JSON.stringify(response, null, 2));

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch response: ${response.status} ${response.statusText}`);
  }
  
  console.log('response has body:', response.body);
  if (!response.body) {
    const fullText = await response.text();
    const lines = fullText.split("\n").filter((line) => line.startsWith("data: "));
    let content = "";
    let reason = "";

    for (const line of lines) {
      try {
        const jsonString = line.split("data:")[1].trim();
        if (jsonString === "[DONE]") break;
        const data = JSON.parse(jsonString);
        if (data.choices?.[0]?.delta?.content) {
          content += data.choices[0].delta.content;
          onStreamUpdate(content, reason);
        }
        if (data.choices?.[0]?.delta?.reasoning) {
          reason += data.choices[0].delta.reasoning;
          onStreamUpdate(content, reason);
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
      }
    }
    return { content, reasoning: reason };
  } else {
    const reader = response.body.getReader();
    return await processStreamedResponse(reader, onStreamUpdate);
  }
}

/**
 * Processes the streamed response from the API
 * @param reader - ReadableStream reader for the response
 * @param botMessage - The message object to update
 * @param onStreamUpdate - Callback function for handling streaming updates
 * @returns Promise<void>
 */
async function processStreamedResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onStreamUpdate: (content: string, reason: string) => void
): Promise<{ content: string; reasoning: string }> {
  const decoder = new TextDecoder("utf-8");
  let done = false;
  let content = "";
  let reason = "";

  while (!done) {
    try {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
        for (const line of lines) {
          const dataStr = line.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") {
            done = true;
            break;
          }

          try {
            const data = JSON.parse(dataStr);
            const delta = data?.choices?.[0]?.delta;
            if (delta) {
              content += delta.content || "";
              reason += delta.reasoning || "";
              onStreamUpdate(content, reason);
            }
          } catch (e) {
            console.error("Failed to parse stream data chunk:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error while reading stream:", error);
      done = true;
    }
  }

  return { content, reasoning: reason };
} 