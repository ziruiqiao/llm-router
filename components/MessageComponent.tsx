import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal, Button, GestureResponderEvent  } from 'react-native';
import tw from 'twrnc';
import * as Clipboard from 'expo-clipboard';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    parentId?: string;
    branchNum: number;
    modelName: string;
}

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

    const handleEdit = (event: GestureResponderEvent) => {
        setModalVisible(true);
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(item.content);
        // alert('Copied to clipboard!');
    };

    const switchNextBranch = async (currentBranchNum: number) => {
        console.log(peers);
        if (item.branchNum === peers.length) return
        const target = peers.find(msg => msg.branchNum === currentBranchNum + 1);
        switchBranch(target!.id);
    }

    const switchLastBranch = async (currentBranchNum: number) => {
        if (item.branchNum === 1) return
        const target = peers.find(msg => msg.branchNum === currentBranchNum - 1);
        switchBranch(target!.id);
    }

    const saveEdit = () => {
        updateMessage(item.id, newContent);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity 
                onLongPress={item.role === 'user' ? (event) => handleEdit(event) : undefined} 
                activeOpacity={0.8}
            >
                <View 
                style={
                    tw`${item.role === 'user' ? 'self-end' : 'self-start'} 
                    rounded-lg m-2 max-w-4/5`
                }> 
                    <View style={
                        tw`${item.role === 'user' ? 'bg-green-200' : 'bg-white'} 
                        p-3 rounded-lg`
                    }>
                        <Text>{item.content}</Text>
                    </View>
                    {/* Show copy icon if role is 'assistant' */}
                    {item.role === 'assistant' && (
                        <View style={tw`flex flex-row justify-between mt-2`}>
                            <Text style={tw`opacity-25`}>{item.modelName}</Text>
                            <TouchableOpacity onPress={copyToClipboard} style={tw`self-end`}>
                                <Feather name="copy" size={16} color="gray" />
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* Show switch icon if role is 'user' */}
                    {(item.role === 'user' && peers.length > 1) && (
                        <View style={tw`flex flex-row justify-between mt-2`}>
                            <TouchableOpacity 
                                onPress={() => switchLastBranch(item.branchNum)}
                                disabled={item.branchNum === 1}
                                style={tw`px-2 mt-[1px]`}
                            >
                                <FontAwesome6 name="chevron-left" size={18} color="gray" />
                            </TouchableOpacity>
                            <Text style={tw`opacity-50 text-sm`}>{item.branchNum}/{peers.length}</Text>
                            <TouchableOpacity 
                                onPress={() => switchNextBranch(item.branchNum)}
                                disabled={item.branchNum === peers.length}
                                style={tw`px-2 mt-[1px]`}
                            >
                                <FontAwesome6 name="chevron-right" size={18} color="gray" />
                            </TouchableOpacity>
                            
                        </View>
                    )}
                </View>
            </TouchableOpacity>
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
