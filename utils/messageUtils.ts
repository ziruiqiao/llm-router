import { Message, SendMessage } from '@/types/chat';

/**
 * Converts an array of Message objects to SendMessage format for API requests
 * @param messages - Array of Message objects to convert
 * @returns SendMessage[] - Array of messages in API format
 */
export function convertToSendMsg(messages: Message[]): SendMessage[] {
  return messages.map(({ role, content }) => ({ role, content }));
}

/**
 * Gets all messages related to a specific message ID, including ancestors and descendants
 * @param msgId - ID of the message to get relations for
 * @param messages - Array of all messages
 * @returns Message[] - Array of related messages in chronological order
 */
export function getAllRelatedMessages(id: string, messages: Message[]): Message[] {
  const result: Message[] = [];

  const msg = messages.find(m => m.id === id);
  if (!msg) return [];

  let parentId: string | undefined = id;
  let childId: string | undefined = id;

  while (parentId || childId) {
    if (parentId) {
      const parentMsg = messages.find(m => m.id === parentId);
      if (parentMsg) {
        result.push(parentMsg);
        parentId = parentMsg.parentId;
      } else parentId = undefined;
    }

    if (childId) {
      const childMsg = messages.find(m => m.parentId === childId && m.branchNum === 1);
      if (childMsg) {
        result.push(childMsg);
        childId = childMsg.id;
      } else childId = undefined;
    }
  }

  // Sort so that parent always appears before child
  const idToMessage = new Map(result.map(m => [m.id, m]));
  const getDepth = (m: Message): number => {
    let depth = 0;
    while (m.parentId && idToMessage.has(m.parentId)) {
      depth++;
      m = idToMessage.get(m.parentId)!;
    }
    return depth;
  };

  result.sort((a, b) => getDepth(a) - getDepth(b));

  return result;
}

/**
 * Finds all peer messages that share the same parent ID
 * @param msgId - ID of the message to find peers for
 * @param messages - Array of all messages
 * @returns Message[] - Array of peer messages
 */
export function findPeers(msgId: string, messages: Message[]): Message[] {
  if (!messages.length) return [];
  const message = messages.find(m => m.id === msgId);
  if (!message) return [];
  return messages.filter(m => m.parentId === message.parentId);
}

/**
 * Formats a model ID into a display-friendly name
 * @param modelId - The model ID to format
 * @param maxLength - Maximum length of the formatted name
 * @returns string - Formatted model name
 */
export function formatModelName(modelId: string, maxLength: number = 25): string {
  if (!modelId) return 'Select a Model';
  
  // Remove provider prefix and :free suffix
  const name = modelId.split('/').pop()?.split(':')[0] || modelId;
  
  if (name.length > maxLength) {
    return name.substring(0, maxLength - 3) + '...';
  }
  return name;
} 