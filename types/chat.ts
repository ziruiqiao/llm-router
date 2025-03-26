export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parentId: string;
  branchNum?: number;
  modelName?: string;
  reasoning?: string;
}

export interface SendMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMModel {
  id: string;
  name: string;
  description: string;
  pricing: Record<string, any>;
}

export interface ChatRoomInterface {
  id: string;
  name: string;
  modelId: string;
  messages: Message[];
}

export interface ModelLookup {
  [key: string]: LLMModel;
} 