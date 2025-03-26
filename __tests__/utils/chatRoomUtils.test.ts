import AsyncStorage from "@react-native-async-storage/async-storage";
import { migrateChatRooms, saveChatRooms, updateChatTitle, createNewRoom, removeChatroom, updateRoomModel } from '@/utils/chatRoomUtils';
import { ChatRoomInterface, LLMModel, Message } from '@/types/chat';
import { generateTitle } from '@/services/api';
import { convertToSendMsg } from '@/utils/messageUtils';

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock API functions
jest.mock('@/services/api', () => ({
  generateTitle: jest.fn(),
}));

// Mock message utils
jest.mock('@/utils/messageUtils', () => ({
  convertToSendMsg: jest.fn(),
}));

describe('Chat Room Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('migrateChatRooms', () => {
    const mockOldChats = [
      {
        id: '1',
        name: 'Chat 1',
        model: { id: 'model1', name: 'Model 1' },
        messages: []
      }
    ];

    const mockNewChats = [
      {
        id: '1',
        name: 'Chat 1',
        modelId: 'model1',
        messages: []
      }
    ];

    it('should migrate chat rooms from old format to new format', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockOldChats));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null); // No existing backup

      const result = await migrateChatRooms();

      expect(result).toEqual(mockNewChats);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'chatRooms_backup_v1',
        JSON.stringify(mockOldChats)
      );
    });

    it('should not migrate if no migration needed', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockNewChats))
        .mockResolvedValueOnce(JSON.stringify(mockNewChats)); // Mock backup check

      const result = await migrateChatRooms();

      expect(result).toEqual(mockNewChats);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle empty storage', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // Mock backup check

      const result = await migrateChatRooms();

      expect(result).toEqual([]);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('{"invalid": true')
        .mockResolvedValueOnce(null); // Mock backup check

      const result = await migrateChatRooms();

      expect(result).toEqual([]);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('saveChatRooms', () => {
    it('should save chat rooms to AsyncStorage', async () => {
      const rooms: ChatRoomInterface[] = [
        { id: '1', name: 'Chat 1', modelId: 'model1', messages: [] }
      ];

      await saveChatRooms(rooms);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'chatRooms',
        JSON.stringify(rooms)
      );
    });
  });

  describe('updateChatTitle', () => {
    const mockApiKey = 'test-key';
    const mockMessages: Message[] = [
      { id: '1', role: 'user' as const, content: 'Hello', parentId: '0', branchNum: 1 }
    ];
    const mockChatRooms: ChatRoomInterface[] = [
      { id: '1', name: 'Old Title', modelId: 'model1', messages: mockMessages }
    ];

    it('should update chat title successfully', async () => {
      (generateTitle as jest.Mock).mockResolvedValueOnce('New Title');
      (convertToSendMsg as jest.Mock).mockReturnValueOnce([{ role: 'user', content: 'Hello' }]);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await updateChatTitle(mockApiKey, mockMessages, '1', mockChatRooms);

      expect(result).toEqual([
        { id: '1', name: 'New Title', modelId: 'model1', messages: mockMessages }
      ]);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'chatRooms',
        JSON.stringify([{ id: '1', name: 'New Title', modelId: 'model1', messages: mockMessages }])
      );
    });

    it('should handle error and return original rooms', async () => {
      (generateTitle as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      (convertToSendMsg as jest.Mock).mockReturnValueOnce([{ role: 'user', content: 'Hello' }]);

      const result = await updateChatTitle(mockApiKey, mockMessages, '1', mockChatRooms);

      expect(result).toEqual(mockChatRooms);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('createNewRoom', () => {
    const existingRooms: ChatRoomInterface[] = [
      { id: '1', name: 'Chat 1', modelId: 'model1', messages: [] }
    ];

    it('should create new room with default model', () => {
      const result = createNewRoom(existingRooms);

      expect(result).toMatchObject({
        name: 'Chat 2',
        modelId: 'deepseek/deepseek-chat-v3-0324:free',
        messages: []
      });
    });

    it('should create new room with specified model', () => {
      const model: LLMModel = {
        id: 'custom-model',
        name: 'Custom Model',
        description: 'Test model',
        pricing: { prompt: 0, completion: 0 }
      };

      const result = createNewRoom(existingRooms, model);

      expect(result).toMatchObject({
        name: 'Chat 2',
        modelId: 'custom-model',
        messages: []
      });
    });
  });

  describe('removeChatroom', () => {
    const rooms: ChatRoomInterface[] = [
      { id: '1', name: 'Chat 1', modelId: 'model1', messages: [] },
      { id: '2', name: 'Chat 2', modelId: 'model2', messages: [] }
    ];

    it('should remove specified chat room', () => {
      const result = removeChatroom(rooms, '1');

      expect(result).toEqual([
        { id: '2', name: 'Chat 2', modelId: 'model2', messages: [] }
      ]);
    });

    it('should return original array if room not found', () => {
      const result = removeChatroom(rooms, '999');

      expect(result).toEqual(rooms);
    });
  });

  describe('updateRoomModel', () => {
    const rooms: ChatRoomInterface[] = [
      { id: '1', name: 'Chat 1', modelId: 'model1', messages: [] },
      { id: '2', name: 'Chat 2', modelId: 'model2', messages: [] }
    ];

    it('should update model ID for specified chat room', () => {
      const result = updateRoomModel(rooms, '1', 'new-model');

      expect(result).toEqual([
        { id: '1', name: 'Chat 1', modelId: 'new-model', messages: [] },
        { id: '2', name: 'Chat 2', modelId: 'model2', messages: [] }
      ]);
    });

    it('should return original array if room not found', () => {
      const result = updateRoomModel(rooms, '999', 'new-model');

      expect(result).toEqual(rooms);
    });
  });
}); 