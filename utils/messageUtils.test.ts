import { getAllRelatedMessages, getLastChildMessage } from './messageUtils'; // adjust this path
import { Message } from '@/types/chat'; // or define Message inline if needed

const mockMessages: Message[] = [
    // Main Thread in chat-1
    { id: 'msg-1', role: 'user', content: 'Tell me about space.', parentId: 'chat-1', branchNum: 1 },
    { id: 'msg-2', role: 'assistant', content: 'Sure! Planets, stars, or galaxies?', parentId: 'msg-1', branchNum: 1 },
    { id: 'msg-3', role: 'user', content: 'Start with planets.', parentId: 'msg-2', branchNum: 1 },
    { id: 'msg-4', role: 'assistant', content: 'Earth is a planet, third from the Sun.', parentId: 'msg-3', branchNum: 1 },
    { id: 'msg-5', role: 'user', content: 'Tell me about Mars.', parentId: 'msg-4', branchNum: 1 },
    { id: 'msg-6', role: 'assistant', content: 'Mars is the 4th planet, known as the Red Planet.', parentId: 'msg-5', branchNum: 1 },
  
    // Branch off from msg-2 (user wants stars instead)
    { id: 'msg-7', role: 'user', content: 'No, tell me about stars instead.', parentId: 'msg-2', branchNum: 2 },
    { id: 'msg-8', role: 'assistant', content: 'Stars are huge balls of burning gas.', parentId: 'msg-7', branchNum: 1 },
  
    // Another alternative branch (user changes topic to black holes)
    { id: 'msg-9', role: 'user', content: 'Wait, what about black holes?', parentId: 'msg-2', branchNum: 3 },
    { id: 'msg-10', role: 'assistant', content: 'Black holes are regions of space with intense gravity.', parentId: 'msg-9', branchNum: 1 },
  
    // An orphaned message (wrong parentId or standalone)
    { id: 'msg-11', role: 'user', content: 'Unrelated message', parentId: 'non-existent', branchNum: 1 },
  
    // A second chat thread
    { id: 'msg-12', role: 'user', content: 'Tell me a joke.', parentId: 'msg-4', branchNum: 2 },
    { id: 'msg-13', role: 'assistant', content: 'Why don’t scientists trust atoms?', parentId: 'msg-12', branchNum: 1 },
    { id: 'msg-14', role: 'user', content: 'Why?', parentId: 'msg-13', branchNum: 1 },
    { id: 'msg-15', role: 'assistant', content: 'Because they make up everything.', parentId: 'msg-14', branchNum: 1 }
  ];

const mockMessages2: Message[] = [{
  "id": "1743280023083", "parentId": "1743280017150", "branchNum": 1, "content": "Hello", "role": "user"
}, {
  "id": "1743280023398", "parentId": "1743280023083", "branchNum": 1, "content": "Hello! 😊 ", "role": "assistant", "modelName": "deepseek-chat-v3-0324:free", "reasoning": ""
}, {
  "id": "1743280053443", "parentId": "1743280023398", "branchNum": 1, "content": "Morning ", "role": "user"
}, {
  "id": "1743280053796", "parentId": "1743280053443", "branchNum": 1, "content": "Good morni", "role": "assistant", "modelName": "deepseek-chat-v3-0324:free", "reasoning": ""
}, {
  "id": "1743280070419", "parentId": "1743280053796", "branchNum": 1, "content": "Night", "role": "user"
}, {
  "id": "1743280071041", "parentId": "1743280070419", "branchNum": 1, "content": "Good night", "role": "assistant", "modelName": "deepseek-chat-v3-0324:free", "reasoning": ""
}, {
  "id": "1743280088277", "parentId": "1743280023398", "branchNum": 2, "content": "Noon", "role": "user"
}, {
  "id": "1743280088788", "parentId": "1743280088277", "branchNum": 1, "content": "Hello agai", "role": "assistant", "modelName": "deepseek-chat-v3-0324:free", "reasoning": ""
}, {
  "id": "1743280112299", "parentId": "1743280088277", "branchNum": 1, "content": "Hay", "role": "user"
}, {
  "id": "1743280112840", "parentId": "1743280112299", "branchNum": 1, "content": "I think yo", "role": "assistant", "modelName": "deepseek-chat-v3-0324:free", "reasoning": ""
}];


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
  
    it('should return branch 3 from msg-2', () => {
      const result = getAllRelatedMessages('msg-10', mockMessages); // child of a non-main branch
      const ids = result.map(m => m.id);
  
      expect(ids).toEqual(['msg-1', 'msg-2', 'msg-9', 'msg-10']);
    });

    it('should return branch 2 from msg-4', () => {
        const result = getAllRelatedMessages('msg-14', mockMessages); // child of a non-main branch
        const ids = result.map(m => m.id);
    
        expect(ids).toEqual(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-12', 'msg-13', 'msg-14', 'msg-15']);
    });

    // it('should return all messages in mockMessages2', () => {
    //     const result = getAllRelatedMessages('1743280112299', mockMessages2);
    //     // console.log(JSON.stringify(result, null, 2));
    //     const ids = result.map(m => m.id);

    //     expect(ids).toEqual(
    //       ['1743280023083', '1743280023398', '1743280088277', '1743280088788', 
    //         '1743280112299', '1743280112840']
    //       );
    // });
  });

describe('getLastChildMessage', () => {
  it('should return the last child for a message with multiple descendants in the main branch', () => {
    const result = getLastChildMessage('msg-1', mockMessages);
    expect(result).toBeDefined();
    // 'msg-1' → 'msg-2' → 'msg-3' → 'msg-4' → 'msg-5' → 'msg-6' is the final child
    expect(result?.id).toBe('msg-6');
  });

  it('should return undefined if the message has no direct child in branchNum=1', () => {
    // 'msg-6' doesn't have a child with branchNum=1
    const result = getLastChildMessage('msg-6', mockMessages);
    expect(result).toBeUndefined();
  });
});