import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorScheme';
import tw from 'twrnc';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  /** Current text value of the input */
  inputText: string;
  /** Function to update the input text */
  setInputText: (text: string) => void;
  /** Function to call when sending a message */
  onSend: () => void;
  /** Whether the input is in a loading state */
  loading: boolean;
  /** Whether the input is currently focused */
  isFocused: boolean;
  /** Function to update the focus state */
  setIsFocused: (focused: boolean) => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Input component for the chat interface
 * Provides a text input field with send button and additional action buttons
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  onSend,
  loading,
  isFocused,
  setIsFocused,
  testID,
}) => {
  const { colors } = useThemeColors();

  return (
    <>
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
        {loading && <ActivityIndicator />}
      </View>
      <View style={tw`${!isFocused && Platform.OS === 'ios' ? 'mb-12' : ''} 
        h-10 bg-white flex flex-row items-center px-3 pb-2 justify-between`}
        testID="button-container"
      >
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
          onPress={onSend} 
          disabled={!inputText}
          testID={testID}
        >
          <AntDesign name="arrowup" size={24} color="dimgray" />
        </TouchableOpacity>
      </View>
    </>
  );
}; 