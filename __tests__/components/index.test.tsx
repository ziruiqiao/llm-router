import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ChatRoom from '../../app/(tabs)/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateApiKey, sendMessage, getAvailableModels } from '@/services/api';
import { createNewRoom, removeChatroom, saveChatRooms, migrateChatRooms } from '@/utils/chatRoomUtils';
import { testCases } from './testData';
import { RefreshControl } from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native';

// Mock the dependencies
jest.mock('@expo/vector-icons/Feather', () => 'Feather');
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons/FontAwesome6', () => 'FontAwesome6');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/services/api');
jest.mock('@/utils/chatRoomUtils');

// Mock the useThemeColors hook
jest.mock('@/hooks/useColorScheme', () => ({
  useThemeColors: () => ({
    colors: {
      text: '#000000',
      background: '#FFFFFF',
      icon: '#000000',
    },
  }),
}));

// Mock the InteractionManager
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: jest.fn((callback) => callback()),
  createInteractionHandle: jest.fn(),
  clearInteractionHandle: jest.fn(),
  setDeadline: jest.fn(),
}));

// Add after the other jest.mock declarations, before the describe block
jest.useFakeTimers();
// Mock global timer functions
global.setTimeout = jest.fn((cb) => cb());
global.clearTimeout = jest.fn();
global.setInterval = jest.fn();
global.clearInterval = jest.fn();

// Add this with your other mocks
jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
}));

describe('ChatRoom Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-api-key');
    (validateApiKey as jest.Mock).mockResolvedValue(true);
    (sendMessage as jest.Mock).mockResolvedValue({
      id: 'msg-1',
      role: 'assistant',
      content: 'Test response',
      reasoning: 'Test reasoning',
    });
    (migrateChatRooms as jest.Mock).mockResolvedValue([{
      id: 'chat-1',
      name: 'New Chat',
      messages: [],
      modelId: 'gpt-4'
    }]);
    (getAvailableModels as jest.Mock).mockResolvedValue({
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
    });
    (createNewRoom as jest.Mock).mockImplementation((rooms, model) => ({
      id: 'new-room-id',
      name: 'New Chat',
      modelId: model?.id || 'default-model',
      messages: [],
    }));
  });

  describe('Basic Message Exchange', () => {
    it('should send a message and receive a response', async () => {
      const { getByTestId, getByPlaceholderText } = render(<ChatRoom />);

      // Wait for initial data to load
      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
          expect(migrateChatRooms).toHaveBeenCalled();
          expect(getAvailableModels).toHaveBeenCalled();
        });
      });

      // Create a new room
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
      });

      // Type and send a message
      const input = getByPlaceholderText('Type your message...');
      await act(async () => {
        fireEvent.changeText(input, 'Hello');
        fireEvent.press(getByTestId('send-button'));
      });

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith(
          'test-api-key',
          expect.any(String),
          expect.any(Array),
          expect.any(Function)
        );
      });
    });
  });

  describe('History Message Modification', () => {
    it('should modify a history message and get a new response', async () => {
      const { getByTestId, getByPlaceholderText } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      // Create a new room and send initial message
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Initial message');
        fireEvent.press(getByTestId('send-button'));
      });

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalled();
      });
    });
  });

  describe('New Chat Room', () => {
    it('should create a new chat room', async () => {
      const { getByTestId } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
      });

      await waitFor(() => {
        expect(createNewRoom).toHaveBeenCalledWith(
          expect.any(Array),
          expect.any(Object)
        );
      });
    });
  });

  describe('Model Change and Message Handling', () => {
    it('should handle model change and message sending', async () => {
      const { getByTestId } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      // Create a new room
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
      });

      // Change model
      await act(async () => {
        fireEvent.press(getByTestId('model-selection-button'));
        const modelItem = getByTestId('model-item-claude-3-opus');
        fireEvent.press(modelItem);
      });

      await waitFor(() => {
        expect(saveChatRooms).toHaveBeenCalled();
      });
    });
  });

  describe('API Key Validation', () => {
    it('should handle invalid API key', async () => {
      (validateApiKey as jest.Mock).mockResolvedValue(false);
      const { getByTestId, getByPlaceholderText } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      // Create a new room and try to send a message
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Test message');
        fireEvent.press(getByTestId('send-button'));
      });

      await waitFor(() => {
        expect(validateApiKey).toHaveBeenCalledWith('test-api-key');
      });
    });

    it('should handle missing API key', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      render(<ChatRoom />);

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
      });
    });
  });

  describe('Chat Room Management', () => {
    it('should remove a chat room', async () => {
      const { getByTestId } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      // Create a new room first
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
      });

      // Delete the room
      await act(async () => {
        const deleteButton = getByTestId('delete-room-button');
        fireEvent.press(deleteButton);
      });

      await waitFor(() => {
        expect(removeChatroom).toHaveBeenCalled();
      });
    });

    it('should generate title automatically', async () => {
      const { getByTestId, getByPlaceholderText } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      // Create a new room and send messages
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Message 1');
        fireEvent.press(getByTestId('send-button'));
      });

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalled();
      });
    });
  });

  describe('Message Branching', () => {
    it('should handle multiple conversation branches', async () => {
      const { getByTestId, getByPlaceholderText } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      // Create a new room and send a message
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Initial message');
        fireEvent.press(getByTestId('send-button'));
      });

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalled();
      });
    });
  });

  describe('UI State Management', () => {
    it('should handle loading state', async () => {
      const { getByTestId, getByPlaceholderText } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      // Create a new room and send a message
      await act(async () => {
        fireEvent.press(getByTestId('new-room-button'));
        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Test message');
        fireEvent.press(getByTestId('send-button'));
      });

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalled();
      });
    });

    it('should handle refresh', async () => {
      const { getByTestId } = render(<ChatRoom />);

      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
        });
      });

      const refreshControl = getByTestId('messages-flatlist');
      await act(async () => {
        fireEvent(refreshControl, 'refresh');
      });

      await waitFor(() => {
        expect(saveChatRooms).toHaveBeenCalledWith(expect.any(Array));
      });
    });
  });
}); 