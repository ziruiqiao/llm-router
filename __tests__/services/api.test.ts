import { validateApiKey, getAvailableModels, generateTitle, sendMessage } from '@/services/api';
import { Message, SendMessage, LLMModel } from '@/types/chat';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      const result = await validateApiKey('valid-key');
      expect(result).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const result = await validateApiKey('invalid-key');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await validateApiKey('error-key');
      expect(result).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    const mockModels = {
      data: [
        { id: 'model1', name: 'Model 1', description: 'Test model 1' },
        { id: 'model2', name: 'Model 2', description: 'Test model 2' }
      ]
    };

    it('should return formatted models', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockModels)
      });
      const result = await getAvailableModels();
      expect(result).toEqual({
        'model1': mockModels.data[0],
        'model2': mockModels.data[1]
      });
    });

    it('should return empty object on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await getAvailableModels();
      expect(result).toEqual({});
    });
  });

  describe('generateTitle', () => {
    const mockMessages: SendMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' }
    ];

    it('should generate title successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          choices: [{ text: 'Generated Title' }]
        })
      });
      const result = await generateTitle('test-key', mockMessages);
      expect(result).toBe('Generated Title');
    });

    it('should return default title on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await generateTitle('test-key', mockMessages);
      expect(result).toBe('New Chat');
    });
  });

  describe('sendMessage', () => {
    const mockMessages: SendMessage[] = [
      { role: 'user', content: 'Hello' }
    ];

    const mockStreamData = [
      { choices: [{ delta: { content: 'Hello', reasoning: 'Thinking' } }] },
      { choices: [{ delta: { content: ' there', reasoning: ' still thinking' } }] },
      { choices: [{ delta: { content: '!', reasoning: ' done' } }] }
    ];

    it('should handle streaming response successfully', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ value: new TextEncoder().encode('data: ' + JSON.stringify(mockStreamData[0]) + '\n') })
              .mockResolvedValueOnce({ value: new TextEncoder().encode('data: ' + JSON.stringify(mockStreamData[1]) + '\n') })
              .mockResolvedValueOnce({ value: new TextEncoder().encode('data: ' + JSON.stringify(mockStreamData[2]) + '\n') })
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const onStreamUpdate = jest.fn();
      const result = await sendMessage('test-key', 'test-model', mockMessages, onStreamUpdate);

      expect(result).toMatchObject({
        role: 'assistant',
        content: 'Hello there!',
        reasoning: 'Thinking still thinking done'
      });
      expect(onStreamUpdate).toHaveBeenCalledTimes(3);
    });

    it('should handle non-streaming response', async () => {
      const mockResponse = {
        ok: true,
        body: null,
        text: () => Promise.resolve(
          'data: ' + JSON.stringify({
            choices: [{ delta: { content: 'Hello there!', reasoning: 'Thinking still thinking done' } }]
          }) + '\n'
        )
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const onStreamUpdate = jest.fn();
      const result = await sendMessage('test-key', 'test-model', mockMessages, onStreamUpdate);

      expect(result).toMatchObject({
        role: 'assistant',
        content: 'Hello there!',
        reasoning: 'Thinking still thinking done'
      });
      expect(onStreamUpdate).toHaveBeenCalledWith('Hello there!', 'Thinking still thinking done');
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, statusText: 'Bad Request' });

      const onStreamUpdate = jest.fn();
      await expect(sendMessage('test-key', 'test-model', mockMessages, onStreamUpdate))
        .rejects
        .toThrow('Failed to fetch response: 400 Bad Request');
    });
  });
}); 