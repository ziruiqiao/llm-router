import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { ChatInput } from '../../components/ChatInput';

// Mock the useThemeColors hook
jest.mock('@/hooks/useColorScheme', () => ({
  useThemeColors: () => ({
    colors: {
      text: '#000000',
      text2: '#666666',
      icon: '#999999'
    }
  })
}));

describe('ChatInput', () => {
  const mockSetInputText = jest.fn();
  const mockOnSend = jest.fn();
  const mockSetIsFocused = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('renders input field and send button', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatInput
        inputText=""
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={false}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    // Check if input field is rendered
    expect(getByPlaceholderText('Type your message...')).toBeTruthy();

    // Check if send button is rendered
    expect(getByTestId('send-button')).toBeTruthy();
  });

  it('handles text input changes', () => {
    const { getByPlaceholderText } = render(
      <ChatInput
        inputText=""
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={false}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    const input = getByPlaceholderText('Type your message...');
    fireEvent.changeText(input, 'Hello, world!');
    expect(mockSetInputText).toHaveBeenCalledWith('Hello, world!');
  });

  it('handles focus and blur events', () => {
    const { getByPlaceholderText } = render(
      <ChatInput
        inputText=""
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={false}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    const input = getByPlaceholderText('Type your message...');

    // Test focus
    fireEvent(input, 'focus');
    expect(mockSetIsFocused).toHaveBeenCalledWith(true);

    // Test blur
    fireEvent(input, 'blur');
    expect(mockSetIsFocused).toHaveBeenCalledWith(false);
  });

  it('disables send button when input is empty', () => {
    const { getByTestId } = render(
      <ChatInput
        inputText=""
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={false}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    const sendButton = getByTestId('send-button');
    expect(sendButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables send button when input has text', () => {
    const { getByTestId } = render(
      <ChatInput
        inputText="Hello"
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={false}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    const sendButton = getByTestId('send-button');
    expect(sendButton.props.accessibilityState.disabled).toBe(false);
  });

  it('calls onSend when send button is pressed', () => {
    const { getByTestId } = render(
      <ChatInput
        inputText="Hello"
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={false}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);
    expect(mockOnSend).toHaveBeenCalled();
  });

  it('applies correct margin bottom on iOS when not focused', () => {
    const { getByTestId } = render(
      <ChatInput
        inputText=""
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={false}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    const buttonContainer = getByTestId('button-container');
    const styleString = buttonContainer.props.style[1];
    expect(styleString).toBeTruthy();
  });

  it('does not apply margin bottom when focused', () => {
    const { getByTestId } = render(
      <ChatInput
        inputText=""
        setInputText={mockSetInputText}
        onSend={mockOnSend}
        loading={false}
        isFocused={true}
        setIsFocused={mockSetIsFocused}
        testID="send-button"
      />
    );

    const buttonContainer = getByTestId('button-container');
    const styleString = buttonContainer.props.style[1];
    expect(styleString).toBeFalsy();
  });
}); 