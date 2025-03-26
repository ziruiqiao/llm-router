import { getAllRelatedMessages } from './messageUtils'; // adjust this path
import { Message } from '@/types/chat'; // or define Message inline if needed

const mockMessages: Message[] = [
  { id: 'msg-1', role: 'user', content: 'I want to learn about geography', parentId: 'chat-1', branchNum: 1 },
  { id: 'msg-2', role: 'assistant', content: 'Great! What area?', parentId: 'msg-1', branchNum: 1 },
  { id: 'msg-3', role: 'user', content: 'Capital of France?', parentId: 'msg-2', branchNum: 1 },
  { id: 'msg-4', role: 'assistant', content: 'Paris.', parentId: 'msg-3', branchNum: 1 },
  { id: 'msg-5', role: 'user', content: 'Germany?', parentId: 'msg-4', branchNum: 1 },
  { id: 'msg-6', role: 'assistant', content: 'Berlin.', parentId: 'msg-5', branchNum: 1 },
  { id: 'msg-7', role: 'user', content: 'Switch to history.', parentId: 'msg-2', branchNum: 2 },
  { id: 'msg-8', role: 'assistant', content: 'Which period?', parentId: 'msg-7', branchNum: 1 },
  { id: 'msg-9', role: 'user', content: 'Renaissance?', parentId: 'msg-8', branchNum: 1 },
  { id: 'msg-10', role: 'assistant', content: 'It was a cultural revival.', parentId: 'msg-9', branchNum: 1 },
];


describe('getAllRelatedMessages', () => {
    it('should return parent and child messages on main branch sorted correctly', () => {
      const result = getAllRelatedMessages('msg-3', mockMessages);
      const ids = result.map(m => m.id);
  
      expect(ids).toEqual(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6']);
    });
  
    it('should return empty array for invalid id', () => {
      const result = getAllRelatedMessages('invalid-id', mockMessages);
      expect(result).toEqual([]);
    });
  
    it('should return only the message itself if it has no parent or child', () => {
      const result = getAllRelatedMessages('msg-10', mockMessages); // child of a non-main branch
      const ids = result.map(m => m.id);
  
      expect(ids).toEqual(['msg-1', 'msg-2', 'msg-7', 'msg-8', 'msg-9', 'msg-10']);
    });
  });