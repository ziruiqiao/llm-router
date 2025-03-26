import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import Sidebar from "@/components/SideBarAnim";
import MessageComponent from "@/components/MessageComponent";
import { useThemeColors } from "@/hooks/useColorScheme";
import { Message, LLMModel, ChatRoomInterface, ModelLookup } from "@/types/chat";
import { validateApiKey, getAvailableModels, sendMessage } from "@/services/api";
import { convertToSendMsg, getAllRelatedMessages, findPeers, formatModelName } from "@/utils/messageUtils";
import { migrateChatRooms, saveChatRooms, updateChatTitle, 
  createNewRoom, removeChatroom, updateRoomModel } from "@/utils/chatRoomUtils";
import tw from "twrnc";
import ModelSelectionModal from "@/components/ModelSelectionModal";
import { ChatInput } from "@/components/ChatInput";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const SUMMARY_URL = "https://openrouter.ai/api/v1/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models/";

export default function ChatRoom() {
  const [chatRooms, setChatRooms] = useState<ChatRoomInterface[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelLookup>({});
  const [apiKey, setApiKey] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectedItem, setSelectedItem] = useState<LLMModel | null>();
  const [modalVisible, setModalVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useThemeColors();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setCurrentMessages(getAllRelatedMessages(selectedBranch, chatRooms.find(room => room.id === currentChatId)?.messages || [], currentChatId));
  }, [selectedBranch, currentChatId]);

  const loadInitialData = async () => {
    const key = await AsyncStorage.getItem("API_KEY");
    if (key) setApiKey(key);
    
    const migratedRooms = await migrateChatRooms();
    setChatRooms(migratedRooms);
    
    const models = await getAvailableModels();
    setAvailableModels(models);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentMessages(
      getAllRelatedMessages(
        selectedBranch, 
        chatRooms.find(room => room.id === currentChatId)?.messages || [], currentChatId
      )
    );
    setRefreshing(false);
  };

  const handleSendMessage = async (messageToSend?: Message) => {
    if (!apiKey || !currentChatId) {
      if (!apiKey) console.log("Missing API key");
      if (!currentChatId) console.log("Missing current chat ID"); 
      return;
    }

    if (!messageToSend && !inputText.trim()) {
      console.log("Missing input text");
      return;
    }

    const currentRoom = chatRooms.find((room) => room.id === currentChatId);
    if (!currentRoom) return;

    let newMessage: Message;
    if (messageToSend) {
      newMessage = {
        ...messageToSend,
        branchNum: messageToSend.branchNum || 1,
      };
    } else {
      newMessage = {
        id: Date.now().toString(),
        role: "user",
        content: inputText,
        parentId: selectedBranch,
        branchNum: 1,
      };
      setInputText("");
    }

    const updatedChats = await updateChat(newMessage);

    try {
      setLoading(true);
      const isValidKey = await validateApiKey(apiKey);
      if (!isValidKey) {
        throw new Error("Invalid API key");
      }

      const newCurrentRoom = updatedChats.find((room) => room.id === currentChatId);
      if (!newCurrentRoom) return;

      const messagesToSend = convertToSendMsg(
        getAllRelatedMessages(newMessage.id, newCurrentRoom.messages, currentChatId)
      );
      if (messagesToSend.length === 0) return;

      const botMessage = await sendMessage(
        apiKey,
        currentRoom.modelId,
        messagesToSend,
        (content, reason) => {
          setCurrentMessages(prev => {
            const messageExists = prev.some(m => m.id === botMessage.id);
            if (messageExists) {
              return prev.map(m => m.id === botMessage.id ? { ...m, content, reasoning: reason } : m);
            } else {
              return [...prev, { ...botMessage, content, reasoning: reason }];
            }
          });
        }
      );
      botMessage.parentId = newMessage.id;
      botMessage.branchNum = newMessage.branchNum;

      await updateChat(botMessage, updatedChats);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const updateChat = async (newMessage: Message, currentRooms: ChatRoomInterface[] = chatRooms): Promise<ChatRoomInterface[]> => {
    const updatedRooms = currentRooms.map(chat => {
      if (chat.id === currentChatId) {
        console.log(`updateChat newMessage: ${JSON.stringify(newMessage)}`);
        console.log(`updateChat chat.messages: ${JSON.stringify(chat.messages)}`);
        const updatedMessages = [...chat.messages, newMessage];
        // console.log('Updated messages:', updatedMessages);
        return { ...chat, messages: updatedMessages };
      }
      return chat;
    });

    const currentRoom = updatedRooms.find(chat => chat.id === currentChatId);
    if (currentRoom && currentRoom.messages.length > 4 && currentRoom.name.startsWith("Chat")) {
      await updateChatTitle(apiKey, currentRoom.messages, currentChatId, updatedRooms);
    }

    setChatRooms(updatedRooms);
    await saveChatRooms(updatedRooms);
    setSelectedBranch(newMessage.id);
    setCurrentMessages(
      getAllRelatedMessages(
        newMessage.id, 
        updatedRooms.find(room => room.id === currentChatId)?.messages || [], currentChatId
      )
    );
    return updatedRooms;
  };

  const handleCreateNewRoom = (model?: LLMModel) => {
    const newRoom = createNewRoom(chatRooms, model);
    const updatedRooms = [...chatRooms, newRoom];
    setChatRooms(updatedRooms);
    setCurrentChatId(newRoom.id);
    setSelectedBranch(newRoom.id);
    saveChatRooms(updatedRooms);
    setModalVisible(false);
  };

  const handleRemoveChatroom = (roomId: string) => {
    const updatedRooms = removeChatroom(chatRooms, roomId);
    setChatRooms(updatedRooms);
    saveChatRooms(updatedRooms);
    
    if (roomId === currentChatId) {
      if (updatedRooms.length > 0) {
        setCurrentChatId(updatedRooms[0].id);
        const rootMsgs = updatedRooms[0].messages.filter((msg) => msg.parentId === updatedRooms[0].id) ?? [];
        const newBranchId = rootMsgs.find((msg) => msg.branchNum === 1)?.id;
        setSelectedBranch(newBranchId || updatedRooms[0].id);
      } else {
        setCurrentChatId("");
        setSelectedBranch("");
      }
    }
  };

  const handleSelectModel = (model: LLMModel) => {
    if (chatRooms.length === 0 || currentChatId === "") {
      handleCreateNewRoom(model);
    } else {
      const updatedRooms = updateRoomModel(chatRooms, currentChatId, model.id);
      setChatRooms(updatedRooms);
      saveChatRooms(updatedRooms);
      setModalVisible(false);
    }
  };

  const handleChangeRoom = (room: ChatRoomInterface) => {
    setCurrentChatId(room.id);
    setSidebarExpanded(false);
    
    const messages = room.messages;
    const rootMsgs = messages.filter((msg) => msg.parentId === room.id) ?? [];
    
    if (rootMsgs.length > 0) {
      const newBranchId = rootMsgs.find((msg) => msg.branchNum === 1)?.id;
      setSelectedBranch(newBranchId || room.id);
    } else {
      setSelectedBranch(room.id);
      setCurrentMessages([]);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 p-4`}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={tw`flex-1 flex-row`}>
        {/* Left Sidebar */}
        <Sidebar sidebarExpanded={sidebarExpanded} closeSidebar={() => setSidebarExpanded(false)}>
          <SafeAreaView style={tw`absolute w-full h-full p-3 z-10`}>
            <View style={tw`flex flex-row justify-between py-1 px-1.5 bg-black`}>
              <TouchableOpacity 
                onPress={() => handleCreateNewRoom()}
                testID="new-room-button"
              >
                <AntDesign name="plus" size={28} color={colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSidebarExpanded(false)}>
                <Feather name="arrow-right" size={28} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={chatRooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleChangeRoom(item)}
                  style={tw`p-2 m-2 mx-2 rounded-lg flex flex-row
                    ${item.id === currentChatId ? `bg-[${colors.background}]` : ``}
                  `}
                >
                  <Text style={tw`text-center px-10 text-base text-[${colors.text}]`}>
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    style={tw`absolute right-5 pt-2 opacity-25`}
                    onPress={() => handleRemoveChatroom(item.id)}
                    testID="delete-room-button"
                  >
                    <AntDesign name="delete" size={24} color={colors.icon} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Sidebar>

        {/* Chat Window */}
        <View style={tw`flex-grow ${Platform.OS === "ios" ? "" : "mt-5"}`}>
          {/* Header */}
          <View style={tw`flex flex-row justify-between`}>
            <TouchableOpacity style={tw`p-3 rounded mb-4`} onPress={() => setSidebarExpanded(true)}>
              <Feather name="sidebar" size={24} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={tw`px-3 py-4 rounded mb-4`} 
              onPress={() => setModalVisible(true)}
              testID="model-selection-button"
            >
              <Text style={tw`text-center text-[${colors.text}]`}>
                Model: {formatModelName(chatRooms.find(room => room.id === currentChatId)?.modelId || "")} {">"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            data={currentMessages}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            testID="messages-flatlist"
            renderItem={({ item }) => (
              <MessageComponent
                key={item.id}
                item={item}
                updateMessage={(id, text) => {
                  const newMsg = { ...item, id: Date.now().toString(), content: text, branchNum: (item.branchNum || 0) + 1 };
                  handleSendMessage(newMsg);
                }}
                switchBranch={setSelectedBranch}
                peers={findPeers(item.id, chatRooms.find(room => room.id === currentChatId)?.messages || [])}
              />
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />

          {/* Chat Input */}
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            onSend={handleSendMessage}
            loading={loading}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
            testID="send-button"
          />
        </View>
      </KeyboardAvoidingView>

      {/* Model Selection Modal */}
      <ModelSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        availableModels={availableModels}
        onSelectModel={handleSelectModel}
      />
    </SafeAreaView>
  );
}
