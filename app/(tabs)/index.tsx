import React, { useState, useEffect, useRef } from "react";
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
import { convertToSendMsg, getAllRelatedMessages, findPeers, 
  formatModelName, getLastChildMessage } from "@/utils/messageUtils";
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
  const streamingMessageRef = useRef<Message | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [inputText, setInputText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useThemeColors();
  const hasRunRef = useRef(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('currentChatId changed:', currentChatId);
    console.log('apiKey:', apiKey);
  }, [currentChatId]);

  useEffect(() => {
    console.log('selectedBranch changed:', selectedBranch); 
  }, [selectedBranch]);

  useEffect(() => {
    if (autoScrollEnabled && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [autoScrollEnabled]);

  useEffect(() => {
    // console.log('currentMessages changed:', JSON.stringify(currentMessages[currentMessages.length - 1])); 
    if (autoScrollEnabled && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [currentMessages]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    updateBranchMessages();
  }, [currentChatId]);

  useEffect(() => {
    if (hasRunRef.current) return;
    const currentRoom = chatRooms.find(chat => chat.id === currentChatId);
    if (currentRoom && currentRoom.messages.length > 4 && currentRoom.name.startsWith("Chat")) {
      const updateTitle = async () => {
        await updateChatTitle(apiKey, currentRoom.messages, currentChatId, chatRooms);
      };
  
      updateTitle();
      hasRunRef.current = true;
    }
  }, [currentMessages]);

  const updateBranchMessages = async (newBranchId?: string) => {
    if (!newBranchId) newBranchId = selectedBranch;
    const currentRoom = chatRooms.find(room => room.id === currentChatId);
    const currentRoomMsgs = currentRoom?.messages || [];
    const relatedMessages = getAllRelatedMessages(newBranchId, currentRoomMsgs)
    console.log('roomMessages:\n' + chatRooms.find(room => room.id === currentChatId)?.messages
    .map(m => JSON.stringify({ ...m, content: m.content.slice(0, 10) }))
    .join('\n\n'));
    if (relatedMessages.length > 0 || currentRoomMsgs.length === 0)
      setCurrentMessages(relatedMessages);
    if (currentRoomMsgs.length > 0) {
      setSelectedBranch(getLastChildMessage(newBranchId, relatedMessages)?.id || newBranchId);
    } else {
      setSelectedBranch(currentRoom?.id || "");
    }
  };

  const loadInitialData = async () => {
    const key = await AsyncStorage.getItem("API_KEY");
    if (key) setApiKey(key);
    console.log(`loadInitialData key: ${key}`);
    
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
        chatRooms.find(room => room.id === currentChatId)?.messages || []
      )
    );
    setRefreshing(false);
  };

  const SendMessage = async (msg?: Message) => {
    const currentRoom = chatRooms.find((room) => room.id === currentChatId);
    console.log('Found current room:', currentRoom?.id);
    if (!currentRoom) return;

    let newMessage: Message;
    if (msg) {
      console.log('Using provided message:', msg);
      newMessage = {
        ...msg,
        branchNum: msg.branchNum || 1,
      };
    } else {
      console.log('Creating new message from input text:', inputText);
      newMessage = {
        id: Date.now().toString(),
        role: "user",
        content: inputText,
        parentId: selectedBranch,
        branchNum: 1,
      };
      setInputText("");
    }

    console.log('Adding new message to room:', newMessage);
    currentRoom.messages.push(newMessage);
    // setSelectedBranch(newMessage.id);
    setCurrentMessages(
      getAllRelatedMessages(newMessage.id, currentRoom.messages)
    );

    try {
      setLoading(true);
      console.log('Validating API key...');
      const isValidKey = await validateApiKey(apiKey);
      if (!isValidKey) {
        console.log('API key validation failed');
        throw new Error("Invalid API key");
      }
      console.log('API key validated successfully');

      const messagesToSend = convertToSendMsg(
        getAllRelatedMessages(newMessage.id, currentRoom.messages)
      );
      console.log('Messages to send:', messagesToSend);
      if (messagesToSend.length === 0) return;

      console.log('Sending message to API with model:', currentRoom.modelId);
      const botId = Date.now().toString();
      const botMessage: Message = {
        id: botId,
        role: "assistant",
        content: "",
        parentId: newMessage.id,
        modelName: currentRoom.modelId.split("/")[1],
        branchNum: 1,
      };
      
      setCurrentMessages(prev => [...prev, botMessage]);
      setSelectedBranch(botId);
      const { content, reasoning } = await sendMessage(
        apiKey,
        currentRoom.modelId,
        messagesToSend,
        (content, reason) => {
          if (!streamingMessageRef.current) {
            streamingMessageRef.current = {
              ...botMessage,
              content,
              reasoning: reason,
            };
          } else {
            streamingMessageRef.current.content = content;
            streamingMessageRef.current.reasoning = reason;
          }

          // console.log('🌀 Stream update:', {
          //   content: streamingMessageRef.current.content.slice(-50),
          //   reasoning: streamingMessageRef.current.reasoning?.slice(-50),
          // });
        
          setCurrentMessages(prev => {
            const updated = prev.map(m => m.id === botId
              ? { ...m, content, reasoning: reason }
              : m
            );
            return [...updated]; // ensure a new array reference
          });
        }
      );
      // console.log('Received complete bot response:', botMessage);

      const finalBotMessage: Message = {
        ...botMessage,
        parentId: newMessage.id,
        content,
        reasoning,
      };
      // botMessage.branchNum = newMessage.branchNum;
      console.log('Adding bot message to room:', 
        { ...finalBotMessage, content: finalBotMessage.content.slice(0, 10) }
      );
      currentRoom.messages.push(finalBotMessage);
      setCurrentMessages(
        getAllRelatedMessages(botId, currentRoom.messages)
      );

      const updatedRooms = chatRooms.map(room =>
        room.id === currentRoom.id ? { ...currentRoom } : room
      );
      setChatRooms(updatedRooms);
      saveChatRooms(updatedRooms);
      
      // await updateChat(botMessage, updatedChats);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send message");
    } finally {
      console.log('Message handling completed');
      setLoading(false);
    }
  }

  const handleSendMessage = async () => {
    if (currentChatId === "") {
      handleCreateNewRoom();
    }
    if (!apiKey || !inputText.trim()) {
      if (!apiKey) console.log("Missing API key");
      if (!inputText.trim()) console.log("Missing input text");
      return;
    }

    await SendMessage();
  };

  const changeHistoryMessage = async (msg: Message) => {
    if (!apiKey || !currentChatId || !msg) {
      if (!apiKey) console.log("Missing API key");
      if (!currentChatId) console.log("Missing current chat ID"); 
      if (!msg) console.log("Missing input message");
      return;
    }

    await SendMessage(msg);
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
                onPress={() => {
                  setSidebarExpanded(false);
                  handleCreateNewRoom()
                }}
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
                  onPress={() => {
                    setSidebarExpanded(false);
                    handleChangeRoom(item)
                  }}
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
                Model: {formatModelName(
                  chatRooms.find(room => room.id === currentChatId)?.modelId || "deepseek/deepseek-chat-v3-0324:free"
                )} {">"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={currentMessages}
            keyExtractor={(item) => item.id}
            onScrollBeginDrag={() => setAutoScrollEnabled(false)}
            extraData={currentMessages}
            showsVerticalScrollIndicator={false}
            testID="messages-flatlist"
            renderItem={({ item }) => {
              const peers = findPeers(item.id, chatRooms.find(room => room.id === currentChatId)?.messages || []);
              const branchNum = peers.length + 1;
            
              return (
                <MessageComponent
                  item={item}
                  updateMessage={(id, text) => {
                    const msg = { ...item, id: Date.now().toString(), content: text, branchNum };
                    changeHistoryMessage(msg);
                  }}
                  switchBranch={(newBranchId) => {
                    setSelectedBranch(newBranchId);
                    updateBranchMessages(newBranchId);
                  }}
                  peers={peers}
                />
              );
            }}
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
      <TouchableOpacity
        onPress={() => setAutoScrollEnabled(prev => !prev)}
        style={tw`absolute bottom-32 right-6 border border-gray-500 rounded-full p-2 opacity-30`}
      >
        <Feather
          name={autoScrollEnabled ? "arrow-down" : "arrow-down-left"}
          size={18}
          color="white"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

