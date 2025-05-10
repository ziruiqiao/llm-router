import React, { useState, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal, Button, 
    GestureResponderEvent, ScrollView, Platform, StyleSheet, TextStyle} from 'react-native';
import tw from 'twrnc';
import * as Clipboard from 'expo-clipboard';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import {Message} from '@/components/customTypes'
import { useColorScheme } from '@/hooks/useColorScheme';
import { lightTheme, darkTheme } from '@/constants/theme';
import Markdown from 'react-native-markdown-display';
import { useFonts } from 'expo-font';
import { Paragraph } from 'react-native-paper';


const MessageComponent = ({ item, updateMessage, switchBranch, peers}: 
    { 
        item: Message, 
        updateMessage: (id: string, newContent: string) => void,
        switchBranch: (id: string) => void,
        peers: Message[]
    }
) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [newContent, setNewContent] = useState(item.content);
    const colorScheme = useColorScheme();
    const [showReasoning, setShowReasoning] = useState(false);
    const [dark, setDark] = useState(colorScheme === 'dark');

    const handleEdit = (event: GestureResponderEvent) => {
        setModalVisible(true);
    };

    const copyToClipboard = async (content?: any) => {
        if (content) {
            await Clipboard.setStringAsync(content);
        } else {
            await Clipboard.setStringAsync(item.content);
        }
        alert('Copied to clipboard!');
    };

    const switchNextBranch = async (currentBranchNum: number) => {
        if (item.branchNum === 0) return
        console.log(peers);
        if (item.branchNum === peers.length) return
        const target = peers.find(msg => msg.branchNum === currentBranchNum + 1);
        switchBranch(target!.id);
    }

    const switchLastBranch = async (currentBranchNum: number) => {
        if (item.branchNum === 0) return
        if (item.branchNum === 1) return
        const target = peers.find(msg => msg.branchNum === currentBranchNum - 1);
        switchBranch(target!.id);
    }

    const saveEdit = () => {
        updateMessage(item.id, newContent);
        setModalVisible(false);
    };

    const markdownRules = {
        fence: (node, children, parent, styles) => {
          const {content} = node;
          return (
            <View key={node.key} style={styles.fenceView}>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(content)}
              >
                <Feather name="copy" size={16} color="gray" />
              </TouchableOpacity>
                <ScrollView
                    horizontal={true}
                    contentContainerStyle={styles.scrollContent}
                    showsHorizontalScrollIndicator={true}
                >
                <Text selectable style={styles.fenceNew}>{content}</Text>
              </ScrollView>
            </View>
          );
        },
    };

    const styles = () =>
        StyleSheet.create({
            body: {
                color: dark ? darkTheme.text3 : lightTheme.text3,
            },
            text: {
                color: dark ? darkTheme.text3 : lightTheme.text3,
                fontFamily: 'Serif',
                fontSize: 15,
                lineHeight: 20
            },
            code_inline: {
                backgroundColor: dark ? darkTheme.background : lightTheme.background,
            },
            code_block: {
                backgroundColor: dark ? darkTheme.background : lightTheme.background,
                overflowX: 'scroll',
                minWidth: '100%',
                flexDirection: 'row',
            },
            fenceView: {
                backgroundColor: dark ? darkTheme.background : lightTheme.background,
                color: dark ? darkTheme.text3 : lightTheme.text3,
                paddingRight: 10,
                borderWidth: 0,
                borderRadius: 6,
                overflowX: 'scroll',
                minWidth: '100%',
                flexDirection: 'row',
                marginTop: 10,
                ...Platform.select({
                    ['ios']: {
                      fontFamily: 'Sans-serif',
                    },
                    ['android']: {
                      fontFamily: 'monospace',
                    },
                }),
            },
            fenceNew: {
                color: dark ? darkTheme.text3 : lightTheme.text3,
                padding: 10,
                lineHeight: 18,

            },
            scrollContent: {
                flexGrow: 1,                // required for proper horizontal scroll
            },
            copyButton: {
                position: 'absolute',
                top: 5,
                right: 5,
                padding: 5,
                borderRadius: 5,
            }
        }
    );

    const MarkdownWrapper: React.FC<any> = ({ children }) => {
        return <Markdown style={styles()} rules={markdownRules}>{children}</Markdown>;
    };

    return (
        <>
            <View 
            style={
                tw`${item.role === 'user' ? 'self-end' : 'self-start'} 
                rounded-lg m-2 max-w-4/5`
            }> 
                {/* Show reasoning if role is 'assistant' */}
                {item.role === 'assistant' && item.reasoning && (
                    <View>
                        {/* Toggle Button */}
                        <TouchableOpacity
                            onPress={() => setShowReasoning(prev => !prev)}
                            style={tw`flex-row items-center px-5 py-1`}
                        >
                            <Text style={tw`text-sm text-blue-500`}>
                                {showReasoning ? "Hide reasoning ▲" : "Show reasoning ▼"}
                            </Text>
                        </TouchableOpacity>
                    
                        {/* Reasoning Content */}
                        {showReasoning && (
                            <View style={tw`py-2 pl-5 pr-2 rounded-md bg-[${dark ? darkTheme.reasonBackground : lightTheme.reasonBackground}]`}>
                                <Text style={tw`text-base text-[${dark ? darkTheme.text : lightTheme.text}]`}>
                                    {item.reasoning}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                <View style={tw`
                    ${item.role === 'user' ? `px-5 py-2 rounded-3xl bg-[${dark ? darkTheme.background : lightTheme.background}]`: `py-2
                        ${dark ? '' : 'px-5' }
                        `
                    }
                `}>
                        <MarkdownWrapper>{item.content}</MarkdownWrapper>
                </View>
                {/* Show copy icon if role is 'assistant' */}
                {item.role === 'assistant' && (
                    <View style={tw`flex flex-row justify-between mt-2`}>
                        <Text style={tw`opacity-75 text-[${dark ? darkTheme.text2 : lightTheme.text2}]`}>{item.modelName}</Text>
                        <TouchableOpacity onPress={copyToClipboard} style={tw`self-end`}>
                            <Feather name="copy" size={16} color="gray" />
                        </TouchableOpacity>
                    </View>
                )}
                {/* Show switch icon if role is 'user' */}
                {(item.role === 'user' && peers.length > 1) && (
                    <View style={tw`flex flex-row justify-between mt-2`}>
                        <TouchableOpacity 
                            onPress={() => switchLastBranch(item.branchNum || 0)}
                            disabled={item.branchNum === 1}
                            style={tw`px-2 mt-[1px]`}
                        >
                            <FontAwesome6 name="chevron-left" size={18} color="gray" />
                        </TouchableOpacity>
                        <Text style={tw`opacity-75 text-sm text-[${dark ? darkTheme.text2 : lightTheme.text2}]`}>{item.branchNum}/{peers.length}</Text>
                        <TouchableOpacity 
                            onPress={() => switchNextBranch(item.branchNum || 0)}
                            disabled={item.branchNum === peers.length}
                            style={tw`px-2 mt-[1px]`}
                        >
                            <FontAwesome6 name="chevron-right" size={18} color="gray" />
                        </TouchableOpacity>
                        
                    </View>
                )}
            </View>
            {item.role === 'user' && (
                <TouchableOpacity
                    onLongPress={(event) => handleEdit(event)}
                    style={StyleSheet.absoluteFillObject}
                >
                    {/* Empty view to capture the gesture only */}
                    <View style={{ flex: 1 }} />
                </TouchableOpacity>
            )}

            {/* Modal for Editing */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={tw`flex-1 justify-start items-center bg-black pt-20 bg-opacity-50`}>
                    <View style={tw`bg-white rounded-lg w-4/5 max-h-1/2`}>
                        <TouchableOpacity 
                            onPress={() => setModalVisible(false)}
                            style={tw`self-end pt-2 pr-1`}
                        >
                            <AntDesign name="close" size={20} color="gray" />
                        </TouchableOpacity>
                        <TextInput
                            value={newContent}
                            onChangeText={setNewContent}
                            style={tw`border p-2 mx-5 mb-3 rounded`}
                            multiline={true}
                        />
                        <View style={tw`flex flex-row justify-between w-full`}>
                            <Button title="save" onPress={saveEdit} disabled={newContent.trim() === ''}/>
                            <Button title="clear" onPress={() => setNewContent('')}/>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default MessageComponent;
