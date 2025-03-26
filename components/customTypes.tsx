export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    reasoning?: string;
    parentId?: string;
    branchNum?: number;
    modelName?: string;
}

export interface SendMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMModel {
    id: string,
    name: string,
    description: string,
    pricing: {
      prompt?: number,
      completion?: number
    }
}

export type ModelLookup = Record<string, LLMModel>;

export interface ChatRoomInterface {
    id: string;
    name: string;
    modelId: string;
    messages: Message[];
}
