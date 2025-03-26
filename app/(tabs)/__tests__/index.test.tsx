import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import ChatRoom from '../index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateApiKey, getAvailableModels, sendMessage } from '@/services/api';
import { Message, ChatRoomInterface, LLMModel } from '@/types/chat';

// Mock the external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/services/api');
jest.mock('@/utils/chatRoomUtils', () => ({
  migrateChatRooms: jest.fn(),
  saveChatRooms: jest.fn(),
  updateChatTitle: jest.fn(),
  createNewRoom: jest.fn(),
  removeChatroom: jest.fn(),
  updateRoomModel: jest.fn(),
}));

// Mock Expo dependencies
jest.mock('@expo/vector-icons/Feather', () => 'Feather');
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

describe('ChatRoom Component', () => {
  const mockApiKey = 'test-api-key';
  const mockChatRooms: ChatRoomInterface[] = [
    {
      id: '1',
      name: 'Test Chat',
      modelId: 'test-model',
      messages: [
        {
          id: 'msg1',
          role: 'user',
          content: 'Hello',
          parentId: '1',
          branchNum: 1,
        },
      ],
    },
  ];

  const mockModel: LLMModel = {
    id: 'test-model',
    name: 'Test Model',
    description: 'Test Description',
    pricing: {
      prompt: 0.1,
      completion: 0.2,
    },
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'API_KEY') return Promise.resolve(mockApiKey);
      if (key === 'chatRooms') return Promise.resolve(JSON.stringify(mockChatRooms));
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (validateApiKey as jest.Mock).mockResolvedValue(true);
    (getAvailableModels as jest.Mock).mockResolvedValue({ 'test-model': mockModel });
    (sendMessage as jest.Mock).mockResolvedValue({
      id: 'msg2',
      role: 'assistant',
      content: 'Hi there!',
      parentId: 'msg1',
      modelName: 'test-model',
    });
  });

  describe('loadInitialData', () => {
    it('should load API key and chat rooms on mount', async () => {
      const { getByText } = render(<ChatRoom />);
      
      await act(async () => {
        await waitFor(() => {
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('API_KEY');
          expect(AsyncStorage.getItem).toHaveBeenCalledWith('chatRooms');
          expect(getByText('Test Chat')).toBeTruthy();
        });
      });
    });
  });

  describe('handleSendMessage', () => {
    it('should not send message without API key', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'API_KEY') return Promise.resolve(null);
        if (key === 'chatRooms') return Promise.resolve(JSON.stringify(mockChatRooms));
        return Promise.resolve(null);
      });

      const { getByPlaceholderText, getByTestId } = render(<ChatRoom />);
      
      await act(async () => {
        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Hello');
        
        const sendButton = getByTestId('send-button');
        fireEvent.press(sendButton);
        
        await waitFor(() => {
          expect(sendMessage).not.toHaveBeenCalled();
        });
      });
    });

    it('should send message successfully', async () => {
      const { getByPlaceholderText, getByTestId, getByText } = render(<ChatRoom />);
      
      await act(async () => {
        await waitFor(() => {
          expect(getByText('Test Chat')).toBeTruthy();
        });

        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Hello');
        
        const sendButton = getByTestId('send-button');
        fireEvent.press(sendButton);
        
        await waitFor(() => {
          expect(sendMessage).toHaveBeenCalledWith(
            mockApiKey,
            'test-model',
            expect.any(Array),
            expect.any(Function)
          );
        });
      });
    });
  });

  describe('handleCreateNewRoom', () => {
    it('should create a new chat room', async () => {
      const { getByTestId } = render(<ChatRoom />);
      
      await act(async () => {
        const newRoomButton = getByTestId('new-room-button');
        fireEvent.press(newRoomButton);
        
        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'chatRooms',
            expect.any(String)
          );
        });
      });
    });
  });

  describe('handleRemoveChatroom', () => {
    it('should remove a chat room', async () => {
      const { getByTestId } = render(<ChatRoom />);
      
      await act(async () => {
        await waitFor(() => {
          const deleteButton = getByTestId('delete-room-button');
          fireEvent.press(deleteButton);
        });
        
        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'chatRooms',
            expect.any(String)
          );
        });
      });
    });
  });

  describe('handleSelectModel', () => {
    it('should create new room when no rooms exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'API_KEY') return Promise.resolve(mockApiKey);
        if (key === 'chatRooms') return Promise.resolve('[]');
        return Promise.resolve(null);
      });

      const { getByTestId } = render(<ChatRoom />);
      
      await act(async () => {
        const modelButton = getByTestId('model-selection-button');
        fireEvent.press(modelButton);
        
        await waitFor(() => {
          const modelItem = getByTestId('model-item-test-model');
          fireEvent.press(modelItem);
        });
        
        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'chatRooms',
            expect.any(String)
          );
        });
      });
    });

    it('should update existing room model', async () => {
      const { getByTestId } = render(<ChatRoom />);
      
      await act(async () => {
        const modelButton = getByTestId('model-selection-button');
        fireEvent.press(modelButton);
        
        await waitFor(() => {
          const modelItem = getByTestId('model-item-test-model');
          fireEvent.press(modelItem);
        });
        
        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'chatRooms',
            expect.any(String)
          );
        });
      });
    });
  });

  describe('handleChangeRoom', () => {
    it('should switch to selected chat room', async () => {
      const { getByText } = render(<ChatRoom />);
      
      await act(async () => {
        await waitFor(() => {
          const roomButton = getByText('Test Chat');
          fireEvent.press(roomButton);
        });
        
        await waitFor(() => {
          expect(getByText('Hello')).toBeTruthy();
        });
      });
    });
  });

  describe('onRefresh', () => {
    it('should refresh messages', async () => {
      const { getByTestId, getByText } = render(<ChatRoom />);
      
      await act(async () => {
        await waitFor(() => {
          const flatList = getByTestId('messages-flatlist');
          const refreshControl = flatList.props.refreshControl;
          refreshControl.props.onRefresh();
        });
        
        await waitFor(() => {
          expect(getByText('Hello')).toBeTruthy();
        });
      });
    });
  });
}); 