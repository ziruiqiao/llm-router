import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatRoomInterface, LLMModel } from '@/types/chat';
import { generateTitle } from '@/services/api';
import { convertToSendMsg } from './messageUtils';

/**
 * Migrates chat rooms from old format to new format, handling model to modelId conversion
 * @returns Promise<ChatRoomInterface[]> - Array of migrated chat rooms
 */
export async function migrateChatRooms(): Promise<ChatRoomInterface[]> {
  const storedChats = await AsyncStorage.getItem("chatRooms");
  if (!storedChats) return [];

  try {
    const chats = JSON.parse(storedChats);
    
    // Create backup before migration
    const existingBackup = await AsyncStorage.getItem("chatRooms_backup_v1");
    if (!existingBackup) {
      await AsyncStorage.setItem("chatRooms_backup_v1", storedChats);
      console.log("Created backup of chat rooms");
    }

    // Check if migration is needed
    const needsMigration = chats.some((room: any) => room.model && !room.modelId);
    
    if (needsMigration) {
      console.log("Migrating chat rooms from model to modelId");
      const migrated = chats.map((room: any) => {
        if (room.model && !room.modelId) {
          return {
            ...room,
            modelId: room.model.id,
            model: undefined // Remove old model property
          };
        }
        return room;
      });
      
      return migrated;
    }
    return chats;
  } catch (error) {
    console.error("Error migrating chat rooms:", error);
    return [];
  }
}

/**
 * Saves chat rooms to AsyncStorage
 * @param rooms - Array of chat rooms to save
 * @returns Promise<void>
 */
export async function saveChatRooms(rooms: ChatRoomInterface[]): Promise<void> {
  await AsyncStorage.setItem("chatRooms", JSON.stringify(rooms));
}

/**
 * Updates the title of a chat room using AI-generated title
 * @param apiKey - API key for authentication
 * @param messages - Array of messages in the chat
 * @param currentChatId - ID of the chat to update
 * @param chatRooms - Array of all chat rooms
 * @returns Promise<ChatRoomInterface[]> - Updated array of chat rooms
 */
export async function updateChatTitle(
  apiKey: string,
  messages: any[],
  currentChatId: string,
  chatRooms: ChatRoomInterface[]
): Promise<ChatRoomInterface[]> {
  try {
    const title = await generateTitle(apiKey, convertToSendMsg(messages));
    const updatedChats = chatRooms.map((chat) =>
      chat.id === currentChatId ? { ...chat, name: title } : chat
    );
    await saveChatRooms(updatedChats);
    return updatedChats;
  } catch (error) {
    console.error("Error updating chat title:", error);
    return chatRooms;
  }
}

/**
 * Creates a new chat room with default or specified model
 * @param chatRooms - Array of existing chat rooms
 * @param model - Optional model to use for the new room
 * @returns ChatRoomInterface - Newly created chat room
 */
export function createNewRoom(
  chatRooms: ChatRoomInterface[],
  model?: LLMModel
): ChatRoomInterface {
  const defaultModelId = "deepseek/deepseek-chat-v3-0324:free";
  const modelId = model ? model.id : defaultModelId;
  
  return {
    id: Date.now().toString(),
    name: `Chat ${chatRooms.length + 1}`,
    modelId: modelId,
    messages: [],
  };
}

/**
 * Removes a chat room from the list
 * @param chatRooms - Array of existing chat rooms
 * @param roomId - ID of the room to remove
 * @returns ChatRoomInterface[] - Updated array of chat rooms
 */
export function removeChatroom(
  chatRooms: ChatRoomInterface[],
  roomId: string
): ChatRoomInterface[] {
  return chatRooms.filter((room) => room.id !== roomId);
}

/**
 * Updates the model ID for a specific chat room
 * @param chatRooms - Array of existing chat rooms
 * @param currentChatId - ID of the chat to update
 * @param modelId - New model ID to set
 * @returns ChatRoomInterface[] - Updated array of chat rooms
 */
export function updateRoomModel(
  chatRooms: ChatRoomInterface[],
  currentChatId: string,
  modelId: string
): ChatRoomInterface[] {
  return chatRooms.map((chat) => 
    chat.id === currentChatId ? { ...chat, modelId } : chat
  );
} 