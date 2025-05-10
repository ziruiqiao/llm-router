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

export interface ChatRoomInterface {
    id: string;
    name: string;
    model: LLMModel;
    messages: Message[];
}