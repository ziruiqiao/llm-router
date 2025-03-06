import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, TextInput, Button, Text, View, FlatList, ActivityIndicator, 
    Alert, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
    Keyboard, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {AxiosError} from 'axios';
import { Ionicons } from '@expo/vector-icons'
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import Sidebar from "@/components/SideBarAnim";
import MessageComponent from "@/components/MessageComponent";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import tw from 'twrnc';


interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    parentId?: string;
    branchNum?: number;
    modelName?: string;
}

interface SendMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMModel {
    id: string,
    name: string,
    description: string,
    pricing: {
      prompt?: number,
      completion?: number
    }
}

interface ChatRoom {
    id: string;
    name: string;
    model: LLMModel;
    messages: Message[];
}

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_URL = 'https://openrouter.ai/api/v1/models/';


export default function ChatRoom() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [curremtMessages, setCurremtMessages] = useState<Message[]>();
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);

  const [apiKey, setApiKey] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedItem, setSelectedItem] = useState<LLMModel | null>();

  const [modalVisible, setModalVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    const loadChatRooms = async () => {
        const storedChats = await AsyncStorage.getItem('chatRooms');
        if (storedChats) setChatRooms(JSON.parse(storedChats));
      };
    const getApiKey = async () => {
        const key = await AsyncStorage.getItem('API_KEY');
      if (!key) {
        Alert.alert('Error', 'API key not found');
        return;
      }
      setApiKey(key);
    };
    const getAvailableModels = async () => {
      const response = await axios.get(MODELS_URL);
      setAvailableModels(response.data.data);
    }
    loadChatRooms();
    getApiKey();
    getAvailableModels();
  }, []);

  useEffect(() => {
    setCurremtMessages(getAllRelatedMessages(selectedBranch, chatRooms))
  }, [selectedBranch]);

  const onRefresh = async () => {
    setRefreshing(true);
    setCurremtMessages(getAllRelatedMessages(selectedBranch, chatRooms))
    setRefreshing(false);
  };

  const saveChatRooms = async (rooms: ChatRoom[]) => {
    await AsyncStorage.setItem('chatRooms', JSON.stringify(rooms));
  };

  const sendMsg = async () => {
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      parentId: selectedBranch,
      branchNum: 1
    };
    handleSendAPI(newMsg)
  }
 
  function covertToSendMsg(mess: Message[]): SendMessage[] {
    return mess.map(({ role, content }) => ({ role, content }));
  }

  function getAllRelatedMessages(msgId: string, newChatRooms: ChatRoom[] = chatRooms): Message[]{
    const messages: Message[] | undefined = newChatRooms.find(chat => chat.id === currentChatId)?.messages;
    if (!messages) return []
    const messageMap = new Map(messages.map(msg => [msg.id, msg]));

    const currentMessage = messageMap.get(msgId);
    if (!currentMessage) return [];
    
    function getAncestors(id: string): Message[] {
        const ancestors: Message[] = [];
        let current = messageMap.get(id);
        while (current?.parentId && current?.parentId !== currentChatId) {
            current = messageMap.get(current.parentId);
            if (current) ancestors.push(current);
        }
        return ancestors.reverse(); // order from oldest to newest
    }

    function getDescendants(id: string): Message[] {
      const descendants: Message[] = [];
      let queue: Message[] = messages!.filter(
        msg => msg.parentId === id && (msg.branchNum === 1 || msg.role === 'assistant'));

      while (queue.length > 0) {
          let current = queue.shift()!;
          descendants.push(current);
          queue.push(...messages!.filter(
            msg => msg.parentId === current.id && (msg.branchNum === 1 || msg.role === 'assistant')));
      }

      return descendants;
    }
    let result: Message[] = [...getAncestors(msgId), currentMessage, ...getDescendants(msgId)];
    return result;
  };

  function findPeers(msgId: string, newChatRooms: ChatRoom[] = chatRooms): Message[] {
    const messages = newChatRooms.find(chat => chat.id === currentChatId)?.messages ?? [];
    if (!messages.length) return [];

    // Create message maps in a single pass
    const messageMap = new Map<string, Message>();
    const messageParentMap = new Map<string, string[]>();

    messages.forEach(msg => {
        messageMap.set(msg.id, msg);
        if (msg.parentId) {
            messageParentMap.set(msg.parentId, [...(messageParentMap.get(msg.parentId) || []), msg.id]);
        }
    });

    // Get peer messages
    const parentId = messageMap.get(msgId)?.parentId;
    return parentId ? (messageParentMap.get(parentId) ?? []).map(id => messageMap.get(id)!).filter(Boolean) : [];
  }

  function editMessage(msgId: string, newText: string) {
    const messages: Message[] | undefined = chatRooms.find(chat => chat.id === currentChatId)?.messages;
    const msg: Message | undefined = messages?.find(m => m.id == msgId);
    if (!msg) return
    let newMsg = {
      ...msg,
      id: Date.now().toString(),
      content: newText,
      branchNum: msg.branchNum + 1
    };
    handleSendAPI(newMsg);
  }

  function switchBranch(branchId: string) {
    console.log(`switch to ${branchId}`);
    setSelectedBranch(branchId);
  }

  const updateChat = (msg: Message, newChatRooms: ChatRoom[] = chatRooms): ChatRoom[] =>  {
    const updatedChats = newChatRooms.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, msg] } 
          : chat
    );
    setChatRooms(updatedChats);
    saveChatRooms(updatedChats);
    setSelectedBranch(msg.id);
    return updatedChats;
  }

  const processStreamedResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>, botMessage: Message) => {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Process each complete line
            while (true) {
                const lineEnd = buffer.indexOf('\n');
                if (lineEnd === -1) break;
                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);

                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            botMessage.content += content;
                        }
                    } catch {
                        // Ignore invalid JSON
                    }
                }
            }
        }
    } finally {
        reader.cancel();
    }
  };

  const handleSendAPI = async (newMessage: Message) => {
    if (!apiKey || !currentChatId) return;
    if (!inputText.trim() && newMessage.branchNum === 1) return;

    const updatedChats = updateChat(newMessage);
    setInputText('');
    const selectedModel: LLMModel | undefined = chatRooms.find(room => room.id == currentChatId)?.model;
    if (!selectedModel) return;
    
    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: covertToSendMsg(getAllRelatedMessages(newMessage.id, updatedChats)),
          stream: true,
        }),
      });
      // const data = await response.json();
      // console.log(data);

      if (!response.ok) {
        console.error("Failed to fetch response:", response.status, response.statusText);
        return;
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        parentId: newMessage.id,
        modelName: selectedModel.id.split("/")[1]
      };

      if (!response.body) {
        const fullText = await response.text();
        // If the API returns SSE format (data: prefixed lines)
        const lines = fullText.split('\n').filter(line => line.startsWith('data: '));
        let content = '';
        
        for (const line of lines) {
          try {
            const jsonString = line.split('data:')[1].trim()
            // console.log(jsonString);
            if (jsonString === "[DONE]") break;
            const data = JSON.parse(jsonString); // Remove 'data: ' prefix
            if (data.choices?.[0]?.delta?.content) {
              content += data.choices[0].delta.content;
              // Update your UI here with incremental content
              botMessage.content = content;
              // Call your update function here
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      } else {
        // Solution 2: For environments where response.body is available
        const reader = response.body?.getReader();
        if (!reader) {
          console.log({...response});
          throw new Error('Response body is not readable');
        }
        await processStreamedResponse(reader, botMessage);
      }
      updateChat(botMessage, updatedChats);
      
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message || 'Failed to fetch response');
      } else {
        Alert.alert('Error', 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const createNewRoom = (model?:LLMModel) => {
    const newChatroom: ChatRoom = { 
        id: Date.now().toString(), 
        name: `Chat ${chatRooms.length + 1}`,
        model: model? model : availableModels.filter(item => item.id === 'deepseek/deepseek-r1')[0],

        messages: [] 
    };
    const updatedChatrooms = [...chatRooms, newChatroom];
    setChatRooms(updatedChatrooms);
    setCurrentChatId(newChatroom.id);
    setSelectedBranch(newChatroom.id);
    saveChatRooms(updatedChatrooms);
  };

  const removeChatroom = (roomId: string) => {
    const updatedChatrooms = chatRooms.filter(room => room.id !== roomId);
    setChatRooms(updatedChatrooms);
    saveChatRooms(updatedChatrooms);
    if (updatedChatrooms.length > 0) {
      setCurrentChatId(updatedChatrooms[0].id);
      const rootMsgs = updatedChatrooms[0].messages.filter(msg => msg.parentId === updatedChatrooms[0].id) ?? [];
      const newBranchId = rootMsgs.find(msg => msg.branchNum === 1)!.id;
      setSelectedBranch(newBranchId);
    } else {
      setCurrentChatId('');
      setSelectedBranch('');
    }
  };

  const selectModel = (model: LLMModel) => {
    if (chatRooms.length === 0 || currentChatId === '') {
        createNewRoom(model);
        setModalVisible(false);
    } else {
        const updatedChatroom = chatRooms.map(chat => 
            chat.id === currentChatId 
            ? { ...chat, model: model } 
            : chat
        );
        setChatRooms(updatedChatroom);
        saveChatRooms(updatedChatroom);
        setModalVisible(false);
    }
  };

  const changeRoom = (room: ChatRoom) => {
    setCurrentChatId(room.id);
    setSidebarExpanded(false);
    
    const messages = room.messages;
    const rootMsgs = messages.filter(msg => msg.parentId === room.id) ?? [];
    console.log(rootMsgs);
    if (rootMsgs.length > 0) {
      const newBranchId = rootMsgs.find(msg => msg.branchNum === 1)!.id;
      setSelectedBranch(newBranchId);
      setCurremtMessages(getAllRelatedMessages(newBranchId, chatRooms))
    } else {
      setSelectedBranch(room.id);
      setCurremtMessages([]);
    }
  }

  const formatModelName = (maxLength: number = 25) => {
    const modelId = chatRooms.filter(room => room.id == currentChatId)[0]?.model?.id.split("/")[1];
    return modelId && modelId.length > maxLength ? modelId.substring(0, maxLength) + "..." : modelId;
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100 p-4`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={tw`flex-1 flex-row`}
      >
        {/* Left Sidebar */}
        <Sidebar 
          sidebarExpanded={sidebarExpanded} 
          closeSidebar={() => setSidebarExpanded(false)}
        >
            <SafeAreaView style={tw`absolute w-full h-full bg-gray-200 p-3 z-10`}>
                <View style={tw`flex flex-row justify-between py-1 px-1.5`}>
                    <AntDesign name="plus" size={28} color="black" onPress={() => createNewRoom()}/>
                    <Feather name="arrow-right" size={28} color="black" onPress={() => setSidebarExpanded(false)}/>
                </View>
                <FlatList
                    data={chatRooms}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                    <TouchableOpacity 
                        onPress={() => {changeRoom(item)}} 
                        style={
                            tw`p-2 ${item.id === currentChatId ? 'bg-blue-400' : 'bg-white'} 
                            rounded-lg m-2 flex flex-row`
                        }
                    >
                        <Text style={tw`text-center px-10`}>{item.name}</Text>
                        <Feather 
                            style={tw`absolute right-5 pt-1 opacity-25`} 
                            name="delete" size={24} color="black"
                            onPress={() => removeChatroom(item.id)}
                        />
                    </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </Sidebar>

        {/* Chat Window */}
        <View style={tw`flex-grow`}>
            {/* Button to Open Model Selection Modal */}
            <View style={tw`flex flex-row justify-between`}>
                <TouchableOpacity 
                    style={tw`p-3 rounded mb-4`} 
                    onPress={() => setSidebarExpanded(true)}
                >
                    <Feather name="sidebar" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={tw`px-3 py-4 rounded mb-4`} onPress={() => setModalVisible(true)}>
                    <Text style={tw`text-black text-center font-bold`}>
                    Model: {
                        formatModelName() || "Select a Model"
                    } >
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <FlatList
                data={curremtMessages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <MessageComponent 
                    key={item.id} 
                    item={item} 
                    updateMessage={editMessage}
                    switchBranch={switchBranch}
                    peers={findPeers(item.id)}
                  />
                )} 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

            {/* Input Field & Send Button */}
            {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}> */}
            <View style={tw`flex-row items-center p-2 bg-white max-h-1/2 rounded-t-3xl`}> 
              <TextInput
                  style={tw`p-3 flex-1 mr-2`}
                  value={inputText}
                  multiline={true}
                  onChangeText={setInputText}
                  placeholderTextColor="gray"
                  placeholder="Type your message..."
                  editable={!loading}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
              />
              {loading ? (<ActivityIndicator />) : (<></>)}
            </View>
            <View style={tw`${!isFocused && Platform.OS === 'ios' ? 'mb-13' : ''} 
              h-10 bg-white flex flex-row items-center px-3 pb-2 justify-between`}>

              {/* Left Side Icons */}
              <View style={tw`flex flex-row`}>
                <TouchableOpacity style={tw`px-3 mt-0.5`} onPress={() => {}}>
                  <AntDesign name="pluscircleo" size={24} color="dimgray" />
                </TouchableOpacity>
                <TouchableOpacity style={tw`px-3`} onPress={() => {}}>
                  <MaterialCommunityIcons name="web" size={28} color="dimgray" />
                </TouchableOpacity>
              </View>

              {/* Right Side Icon - Arrow */}
              <TouchableOpacity 
                style={tw`${!inputText ? 'opacity-50' : ''}`}
                onPress={sendMsg} 
                disabled={!inputText}
              >
                <AntDesign name="arrowright" size={24} color="dimgray" />
              </TouchableOpacity>

            </View>
            {/* </TouchableWithoutFeedback> */}
        </View>
      </KeyboardAvoidingView>

      {/* Right SideBar */}
      <Sidebar sidebarExpanded={modalVisible} closeSidebar={() => setModalVisible(false)} slideFrom="right">
        <SafeAreaView style={tw`flex-1 bg-white p-4 ${Platform.OS === 'ios' ? 'mb-8' : ''}`}>
          {selectedItem ? (
            // Full-screen description view
            <View style={tw`flex-1 p-4`}>
              <TouchableOpacity onPress={() => setSelectedItem(null)} style={tw`mb-4`}>
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <TextInput
                style={tw`text-xl font-bold mb-2 p-2 rounded-lg`}
                value={selectedItem.name}
                editable={false}
                multiline
              />
              <TextInput
                style={tw`text-sm text-gray-400 mb-2 p-2 rounded-lg`}
                value={`ID: ${selectedItem.id}`}
                editable={false}
                multiline
              />
              <TextInput
                style={tw`text-gray-600 bg-gray-100 p-2 rounded-lg`}
                value={selectedItem.description}
                editable={false}
                multiline
              />
            </View>
          ) : (
            // Model List with Info Icon
            <>
            <View style={tw`flex flex-row justify-start pt-10 pb-1 px-1.5`}>
                <Feather name="arrow-left" size={28} color="black" onPress={() => setModalVisible(false)}/>
            </View>
              <FlatList
                data={availableModels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
                    <TouchableOpacity onPress={() => selectModel(item)} style={tw`flex-1`}>
                      <Text style={tw`text-lg font-bold`}>{item.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedItem(item)}>
                      <Ionicons name="information-circle-outline" size={24} color="blue" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          )}
        </SafeAreaView>
      </Sidebar>
    </SafeAreaView>
  );
}