import { convertToSendMsg, getAllRelatedMessages, findPeers, formatModelName } from '@/utils/messageUtils';
import { Message } from '@/types/chat';

describe('Message Utilities', () => {
  describe('convertToSendMsg', () => {
    it('should convert messages to SendMessage format', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', parentId: '0', branchNum: 1 },
        { id: '2', role: 'assistant', content: 'Hi', parentId: '1', branchNum: 1 }
      ];

      const result = convertToSendMsg(messages);
      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' }
      ]);
    });

    it('should handle empty array', () => {
      const result = convertToSendMsg([]);
      expect(result).toEqual([]);
    });
  });

  describe('getAllRelatedMessages', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hello', parentId: '0', branchNum: 1 },
      { id: '2', role: 'assistant', content: 'Hi', parentId: '1', branchNum: 1 },
      { id: '3', role: 'user', content: 'How are you?', parentId: '2', branchNum: 1 },
      { id: '4', role: 'assistant', content: 'I am good', parentId: '3', branchNum: 1 }
    ];

    it('should get all related messages for a given message ID', () => {
      const result = getAllRelatedMessages('3', messages, '0');
      expect(result).toEqual([
        { id: '1', role: 'user', content: 'Hello', parentId: '0', branchNum: 1 },
        { id: '2', role: 'assistant', content: 'Hi', parentId: '1', branchNum: 1 },
        { id: '3', role: 'user', content: 'How are you?', parentId: '2', branchNum: 1 },
        { id: '4', role: 'assistant', content: 'I am good', parentId: '3', branchNum: 1 }
      ]);
    });

    it('should handle message with no ancestors', () => {
      const result = getAllRelatedMessages('1', messages, '0');
      expect(result).toEqual([
        { id: '1', role: 'user', content: 'Hello', parentId: '0', branchNum: 1 },
        { id: '2', role: 'assistant', content: 'Hi', parentId: '1', branchNum: 1 },
        { id: '3', role: 'user', content: 'How are you?', parentId: '2', branchNum: 1 },
        { id: '4', role: 'assistant', content: 'I am good', parentId: '3', branchNum: 1 }
      ]);
    });

    it('should handle message with no descendants', () => {
      const result = getAllRelatedMessages('4', messages, '0');
      expect(result).toEqual([
        { id: '1', role: 'user', content: 'Hello', parentId: '0', branchNum: 1 },
        { id: '2', role: 'assistant', content: 'Hi', parentId: '1', branchNum: 1 },
        { id: '3', role: 'user', content: 'How are you?', parentId: '2', branchNum: 1 },
        { id: '4', role: 'assistant', content: 'I am good', parentId: '3', branchNum: 1 }
      ]);
    });

    it('should handle non-existent message ID', () => {
      const result = getAllRelatedMessages('999', messages, '0');
      expect(result).toEqual([]);
    });
  });

  describe('findPeers', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hello', parentId: '0', branchNum: 1 },
      { id: '2', role: 'assistant', content: 'Hi', parentId: '1', branchNum: 1 },
      { id: '3', role: 'user', content: 'How are you?', parentId: '1', branchNum: 2 },
      { id: '4', role: 'assistant', content: 'I am good', parentId: '3', branchNum: 1 }
    ];

    it('should find all peer messages', () => {
      const result = findPeers('2', messages);
      expect(result).toEqual([
        { id: '2', role: 'assistant', content: 'Hi', parentId: '1', branchNum: 1 },
        { id: '3', role: 'user', content: 'How are you?', parentId: '1', branchNum: 2 }
      ]);
    });

    it('should handle message with no peers', () => {
      const result = findPeers('1', messages);
      expect(result).toEqual([
        { id: '1', role: 'user', content: 'Hello', parentId: '0', branchNum: 1 }
      ]);
    });

    it('should handle non-existent message ID', () => {
      const result = findPeers('999', messages);
      expect(result).toEqual([]);
    });

    it('should handle empty messages array', () => {
      const result = findPeers('1', []);
      expect(result).toEqual([]);
    });
  });

  describe('formatModelName', () => {
    it('should format model name correctly', () => {
      const result = formatModelName('deepseek/deepseek-r1-zero:free');
      expect(result).toBe('deepseek-r1-zero');
    });

    it('should handle empty model ID', () => {
      const result = formatModelName('');
      expect(result).toBe('Select a Model');
    });

    it('should truncate long model names', () => {
      const result = formatModelName('very/long-model-name-that-needs-truncation:free', 10);
      expect(result).toBe('long-mo...');
    });

    it('should handle model ID without slash', () => {
      const result = formatModelName('simple-model');
      expect(result).toBe('simple-model');
    });
  });
}); 