import { Message, ChatRoomInterface, LLMModel, ModelLookup } from '@/types/chat';

// Mock LLM Models
export const mockModels: ModelLookup = {
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable GPT-4 model',
    pricing: {
      input: 0.03,
      output: 0.06
    }
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Most capable Claude model',
    pricing: {
      input: 0.015,
      output: 0.075
    }
  }
};

// Test case inputs and states
export interface TestCase {
  input: {
    message?: string;
    modelId?: string;
    apiKey?: string;
    parentMessageId?: string;
    name?: string;
    oldModelId?: string;
    newModelId?: string;
    roomId?: string;
    action?: string;
  };
  before: {
    chatRoom?: ChatRoomInterface;
    chatRooms?: ChatRoomInterface[];
    currentChatId?: string;
    sidebarExpanded?: boolean;
    modalVisible?: boolean;
    loading?: boolean;
    refreshing?: boolean;
    currentMessages?: Message[];
  };
  after: {
    chatRoom?: ChatRoomInterface;
    chatRooms?: ChatRoomInterface[];
    currentChatId?: string;
    sidebarExpanded?: boolean;
    modalVisible?: boolean;
    loading?: boolean;
    refreshing?: boolean;
    currentMessages?: Message[];
    error?: string;
  };
}

export interface TestCases {
  basicMessage: TestCase;
  historyModification: TestCase;
  newChatRoom: TestCase;
  modelChange: TestCase;
  apiKeyValidation: {
    invalidKey: TestCase;
    missingKey: TestCase;
  };
  chatRoomManagement: {
    removeRoom: TestCase;
    autoTitleGeneration: TestCase;
  };
  messageBranching: {
    multipleBranches: TestCase;
  };
  uiStateManagement: {
    sidebarToggle: TestCase;
    modalVisibility: TestCase;
    loadingState: TestCase;
    refresh: TestCase;
  };
}

export const testCases: TestCases = {
  basicMessage: {
    input: {
      message: 'Hello, how are you?'
    },
    before: {
      chatRooms: [{
        id: 'chat-1',
        name: 'New Chat',
        messages: [],
        modelId: 'gpt-4'
      }],
      currentChatId: 'chat-1',
      currentMessages: []
    },
    after: {
      chatRooms: [{
        id: 'chat-1',
        name: 'New Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello, how are you?',
            parentId: 'chat-1',
            branchNum: 1
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'I am doing well, thank you for asking! How can I help you today?',
            parentId: 'msg-1',
            branchNum: 1
          }
        ],
        modelId: 'gpt-4'
      }],
      currentChatId: 'chat-1',
      currentMessages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello, how are you?',
          parentId: 'chat-1',
          branchNum: 1
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'I am doing well, thank you for asking! How can I help you today?',
          parentId: 'msg-1',
          branchNum: 1
        }
      ]
    }
  },
  historyModification: {
    input: {
      message: 'Can you tell me more about Paris?',
      parentMessageId: 'msg-2'
    },
    before: {
      chatRooms: [{
        id: 'chat-2',
        name: 'Geography Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'I want to learn about geography',
            parentId: 'chat-2',
            branchNum: 1
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Of course! I\'d be happy to help you with geography questions. What would you like to know?',
            parentId: 'msg-1',
            branchNum: 1
          },
          {
            id: 'msg-3',
            role: 'user',
            content: 'What is the capital of France?',
            parentId: 'msg-2',
            branchNum: 1
          },
          {
            id: 'msg-4',
            role: 'assistant',
            content: 'Paris is the capital of France.',
            parentId: 'msg-3',
            branchNum: 1
          }
        ],
        modelId: 'gpt-4'
      }],
      currentChatId: 'chat-2',
      currentMessages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'I want to learn about geography',
          parentId: 'chat-2',
          branchNum: 1
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Of course! I\'d be happy to help you with geography questions. What would you like to know?',
          parentId: 'msg-1',
          branchNum: 1
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'What is the capital of France?',
          parentId: 'msg-2',
          branchNum: 1
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: 'Paris is the capital of France.',
          parentId: 'msg-3',
          branchNum: 1
        }
      ]
    },
    after: {
      chatRooms: [{
        id: 'chat-2',
        name: 'Geography Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'I want to learn about geography',
            parentId: 'chat-2',
            branchNum: 1
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Of course! I\'d be happy to help you with geography questions. What would you like to know?',
            parentId: 'msg-1',
            branchNum: 1
          },
          {
            id: 'msg-3',
            role: 'user',
            content: 'What is the capital of France?',
            parentId: 'msg-2',
            branchNum: 1
          },
          {
            id: 'msg-4',
            role: 'assistant',
            content: 'Paris is the capital of France.',
            parentId: 'msg-3',
            branchNum: 1
          },
          {
            id: 'msg-5',
            role: 'user',
            content: 'Can you tell me more about Paris?',
            parentId: 'msg-2',
            branchNum: 2
          },
          {
            id: 'msg-6',
            role: 'assistant',
            content: 'Paris is the capital and largest city of France. Located in the north of the country on the river Seine, Paris has been one of Europe\'s major centers of finance, diplomacy, commerce, fashion, art, and science for centuries. The city is home to iconic landmarks like the Eiffel Tower, Notre-Dame Cathedral, and the Louvre Museum. As of 2023, the city proper has a population of about 2.1 million people, while the greater Paris metropolitan area has over 12 million inhabitants, making it one of the largest urban areas in Europe.',
            parentId: 'msg-5',
            branchNum: 2
          }
        ],
        modelId: 'gpt-4'
      }],
      currentChatId: 'chat-2',
      currentMessages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'I want to learn about geography',
          parentId: 'chat-2',
          branchNum: 1
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Of course! I\'d be happy to help you with geography questions. What would you like to know?',
          parentId: 'msg-1',
          branchNum: 1
        },
        {
          id: 'msg-5',
          role: 'user',
          content: 'Can you tell me more about Paris?',
          parentId: 'msg-2',
          branchNum: 2
        },
        {
          id: 'msg-6',
          role: 'assistant',
          content: 'Paris is the capital and largest city of France. Located in the north of the country on the river Seine, Paris has been one of Europe\'s major centers of finance, diplomacy, commerce, fashion, art, and science for centuries. The city is home to iconic landmarks like the Eiffel Tower, Notre-Dame Cathedral, and the Louvre Museum. As of 2023, the city proper has a population of about 2.1 million people, while the greater Paris metropolitan area has over 12 million inhabitants, making it one of the largest urban areas in Europe.',
          parentId: 'msg-5',
          branchNum: 2
        }
      ]
    }
  },
  newChatRoom: {
    input: {
      name: 'New Chat Room'
    },
    before: {
      chatRooms: [{
        id: 'chat-1',
        name: 'Existing Chat',
        messages: [],
        modelId: 'gpt-4'
      }],
      currentChatId: 'chat-1'
    },
    after: {
      chatRooms: [
        {
          id: 'chat-1',
          name: 'Existing Chat',
          messages: [],
          modelId: 'gpt-4'
        },
        {
          id: 'chat-2',
          name: 'New Chat Room',
          messages: [],
          modelId: 'gpt-4'
        }
      ],
      currentChatId: 'chat-2'
    }
  },
  modelChange: {
    input: {
      newModelId: 'claude-3-opus',
      message: 'Can you explain quantum computing in simple terms?'
    },
    before: {
      chatRooms: [{
        id: 'chat-3',
        name: 'Science Chat',
        messages: [],
        modelId: 'gpt-4'
      }],
      currentChatId: 'chat-3',
      currentMessages: []
    },
    after: {
      chatRooms: [{
        id: 'chat-3',
        name: 'Science Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Can you explain quantum computing in simple terms?',
            parentId: 'chat-3',
            branchNum: 1
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Quantum computing is like a super-powered computer that uses quantum mechanics to process information. Instead of regular bits (0s and 1s), it uses quantum bits (qubits) that can be both 0 and 1 at the same time.',
            parentId: 'msg-1',
            branchNum: 1
          }
        ],
        modelId: 'claude-3-opus'
      }],
      currentChatId: 'chat-3',
      currentMessages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Can you explain quantum computing in simple terms?',
          parentId: 'chat-3',
          branchNum: 1
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Quantum computing is like a super-powered computer that uses quantum mechanics to process information. Instead of regular bits (0s and 1s), it uses quantum bits (qubits) that can be both 0 and 1 at the same time.',
          parentId: 'msg-1',
          branchNum: 1
        }
      ]
    }
  },
  apiKeyValidation: {
    invalidKey: {
      input: {
        apiKey: 'invalid-key'
      },
      before: {
        chatRooms: [{
          id: 'chat-1',
          name: 'New Chat',
          messages: [],
          modelId: 'gpt-4'
        }],
        currentChatId: 'chat-1'
      },
      after: {
        error: 'Invalid API key'
      }
    },
    missingKey: {
      input: {},
      before: {
        chatRooms: [{
          id: 'chat-1',
          name: 'New Chat',
          messages: [],
          modelId: 'gpt-4'
        }],
        currentChatId: 'chat-1'
      },
      after: {
        error: 'Missing API key'
      }
    }
  },
  chatRoomManagement: {
    removeRoom: {
      input: {
        roomId: 'chat-1'
      },
      before: {
        chatRooms: [
          {
            id: 'chat-1',
            name: 'To Be Removed',
            messages: [],
            modelId: 'gpt-4'
          },
          {
            id: 'chat-2',
            name: 'Remaining Chat',
            messages: [],
            modelId: 'gpt-4'
          }
        ],
        currentChatId: 'chat-1'
      },
      after: {
        chatRooms: [{
          id: 'chat-2',
          name: 'Remaining Chat',
          messages: [],
          modelId: 'gpt-4'
        }],
        currentChatId: 'chat-2'
      }
    },
    autoTitleGeneration: {
      input: {
        message: 'Let\'s discuss various topics'
      },
      before: {
        chatRooms: [{
          id: 'chat-1',
          name: 'Chat',
          messages: [],
          modelId: 'gpt-4'
        }],
        currentChatId: 'chat-1',
        currentMessages: []
      },
      after: {
        chatRooms: [{
          id: 'chat-1',
          name: 'Discussion about various topics',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Let\'s discuss various topics',
              parentId: 'chat-1',
              branchNum: 1
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Response to message 1',
              parentId: 'msg-1',
              branchNum: 1
            }
          ],
          modelId: 'gpt-4'
        }],
        currentChatId: 'chat-1',
        currentMessages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Let\'s discuss various topics',
            parentId: 'chat-1',
            branchNum: 1
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Response to message 1',
            parentId: 'msg-1',
            branchNum: 1
          }
        ]
      }
    }
  },
  messageBranching: {
    multipleBranches: {
      input: {
        message: 'What are some alternative approaches?',
        parentMessageId: 'msg-1'
      },
      before: {
        chatRooms: [{
          id: 'chat-1',
          name: 'Branching Chat',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'How can we solve this problem?',
              parentId: 'chat-1',
              branchNum: 1
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Here are a few approaches we could consider...',
              parentId: 'msg-1',
              branchNum: 1
            }
          ],
          modelId: 'gpt-4'
        }],
        currentChatId: 'chat-1',
        currentMessages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'How can we solve this problem?',
            parentId: 'chat-1',
            branchNum: 1
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Here are a few approaches we could consider...',
            parentId: 'msg-1',
            branchNum: 1
          }
        ]
      },
      after: {
        chatRooms: [{
          id: 'chat-1',
          name: 'Branching Chat',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'How can we solve this problem?',
              parentId: 'chat-1',
              branchNum: 1
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Here are a few approaches we could consider...',
              parentId: 'msg-1',
              branchNum: 1
            },
            {
              id: 'msg-3',
              role: 'user',
              content: 'What are some alternative approaches?',
              parentId: 'msg-1',
              branchNum: 2
            },
            {
              id: 'msg-4',
              role: 'assistant',
              content: 'Alternative answer to the question',
              parentId: 'msg-3',
              branchNum: 2
            }
          ],
          modelId: 'gpt-4'
        }],
        currentChatId: 'chat-1',
        currentMessages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'How can we solve this problem?',
            parentId: 'chat-1',
            branchNum: 1
          },
          {
            id: 'msg-3',
            role: 'user',
            content: 'What are some alternative approaches?',
            parentId: 'msg-1',
            branchNum: 2
          },
          {
            id: 'msg-4',
            role: 'assistant',
            content: 'Alternative answer to the question',
            parentId: 'msg-3',
            branchNum: 2
          }
        ]
      }
    }
  },
  uiStateManagement: {
    sidebarToggle: {
      input: {},
      before: {
        sidebarExpanded: false
      },
      after: {
        sidebarExpanded: true
      }
    },
    modalVisibility: {
      input: {},
      before: {
        modalVisible: false
      },
      after: {
        modalVisible: true
      }
    },
    loadingState: {
      input: {
        message: 'Loading test message'
      },
      before: {
        loading: false
      },
      after: {
        loading: false
      }
    },
    refresh: {
      input: {},
      before: {
        refreshing: false
      },
      after: {
        refreshing: false
      }
    }
  }
};

// Mock API responses
export interface ApiResponse {
  choices?: Array<{
    delta: {
      content: string;
      reasoning: string;
    };
  }>;
  error?: string;
}

export interface MockApiResponses {
  basicResponse: ApiResponse;
  historyModResponses: {
    initialResponse: ApiResponse;
    firstQuestionResponse: ApiResponse;
    detailedQuestionResponse: ApiResponse;
  };
  modelChangeResponse: ApiResponse;
  apiKeyResponses: {
    invalidKey: ApiResponse;
    missingKey: ApiResponse;
  };
  chatRoomResponses: {
    titleGeneration: ApiResponse;
    messageResponse: ApiResponse;
  };
  branchingResponses: {
    alternativeAnswer: ApiResponse;
  };
}

export const mockApiResponses: MockApiResponses = {
  basicResponse: {
    choices: [{
      delta: {
        content: 'I am doing well, thank you for asking! How can I help you today?',
        reasoning: 'Responding to a friendly greeting with appropriate courtesy'
      }
    }]
  },
  historyModResponses: {
    initialResponse: {
      choices: [{
        delta: {
          content: 'Of course! I\'d be happy to help you with geography questions. What would you like to know?',
          reasoning: 'Acknowledging the user\'s interest in geography and encouraging questions'
        }
      }]
    },
    firstQuestionResponse: {
      choices: [{
        delta: {
          content: 'Paris is the capital of France.',
          reasoning: 'Providing a direct answer to the capital city question'
        }
      }]
    },
    detailedQuestionResponse: {
      choices: [{
        delta: {
          content: 'Paris is the capital and largest city of France. Located in the north of the country on the river Seine, Paris has been one of Europe\'s major centers of finance, diplomacy, commerce, fashion, art, and science for centuries. The city is home to iconic landmarks like the Eiffel Tower, Notre-Dame Cathedral, and the Louvre Museum. As of 2023, the city proper has a population of about 2.1 million people, while the greater Paris metropolitan area has over 12 million inhabitants, making it one of the largest urban areas in Europe.',
          reasoning: 'Providing comprehensive information about Paris including its location, significance, landmarks, and population statistics'
        }
      }]
    }
  },
  modelChangeResponse: {
    choices: [{
      delta: {
        content: 'Quantum computing is like a super-powered computer that uses quantum mechanics to process information. Instead of regular bits (0s and 1s), it uses quantum bits (qubits) that can be both 0 and 1 at the same time.',
        reasoning: 'Explaining complex topic in simple terms using analogies'
      }
    }]
  },
  apiKeyResponses: {
    invalidKey: {
      error: 'Invalid API key'
    },
    missingKey: {
      error: 'Missing API key'
    }
  },
  chatRoomResponses: {
    titleGeneration: {
      choices: [{
        delta: {
          content: 'Discussion about various topics',
          reasoning: 'Generating a title based on conversation content'
        }
      }]
    },
    messageResponse: {
      choices: [{
        delta: {
          content: 'Response to message 1',
          reasoning: 'Providing a response to the user\'s message'
        }
      }]
    }
  },
  branchingResponses: {
    alternativeAnswer: {
      choices: [{
        delta: {
          content: 'Alternative answer to the question',
          reasoning: 'Providing a different perspective on the original question'
        }
      }]
    }
  }
};

// Mock API key for testing
export const mockApiKey = 'test-api-key-12345'; 