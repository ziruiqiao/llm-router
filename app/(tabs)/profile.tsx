import React, {useState, useEffect} from "react";
import { Text, View, Keyboard, Button } from 'react-native';
import TableElem from '@/components/TableElem';
import tw from 'twrnc';
import { TextInput, TouchableWithoutFeedback } from "react-native-gesture-handler";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Profile() {
    const [usedCredit, setUsedCredit] = useState(0.0);
    const [totalCredit, setTotalCredit] = useState(0.0);
    const [chatHistory, setChatHistory] = useState(0);
    const [apiKey, setApiKey] = useState("");

    
    const getCredit = async () => {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/credits', {
                method: 'GET',
                headers: {Authorization: `Bearer ${apiKey}`}
            });
    
            if (!response.ok) {
                console.error("Failed to fetch credits:", response.statusText);
                return;
            }

            const data = await response.json();
            setTotalCredit(data.data['total_credits'].toFixed(2));
            setUsedCredit(data.data['total_usage'].toFixed(2));
        } catch (error) {
            console.error("Error saving parameter: ", error);
        }
    }

    const getHistory = async () => {
        const rooms = await AsyncStorage.getItem('chatRooms');
        setChatHistory(JSON.parse(rooms!).length);
    }

    const getApiKey = async () => {
        const api_key = await AsyncStorage.getItem('API_KEY');
        if (api_key) {
            console.log("Get API_KEY success!");
            setApiKey(apiKey);
            return api_key;
        }
        console.log("Get API_KEY FAIL!!");
        return '';
    }

    const saveApiKey = async () => {
        try {
            await AsyncStorage.setItem('API_KEY', apiKey);
            console.log("API_KEY Saved");
            return true;
        } catch (error) {
            console.error("Error saving parameter: ", error);
            return false;
        } 
    }

    useEffect(() => {
        getApiKey();
        saveApiKey();
        getCredit();
        getHistory();
      }, [apiKey]);

    return (
        <SafeAreaProvider style={tw`bg-white`}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <SafeAreaView>
                    <View style={tw`flex flex-col p-10`}>
                        <Text style={tw`text-3xl pt-10 pb-5 font-medium`}>
                            User Profile
                        </Text>
                        <View style={tw`flex flex-row justify-between`}>
                            <TableElem name="Total Credit" value={totalCredit}/>
                            <TableElem name="Credit Used" value={usedCredit}/>
                            <TableElem name="Chat History" value={chatHistory}/>
                        </View>
                        <View style={tw`flex flex-col pt-12`}>
                            <Text>Input your OpenRouter API Key: </Text>
                            <TextInput
                                style={tw`border mt-2 h-7 rounded-md`}
                                placeholder="Input API Key here..."
                                onChangeText={setApiKey}
                                value={apiKey}
                                secureTextEntry={true}
                                autoCapitalize="none"
                                autoCorrect={false}
                                multiline={false}
                                numberOfLines={1}
                            />
                        </View>
                    </View>
                    <Button title="Refresh Credit" onPress={getCredit}/>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </SafeAreaProvider>
        
    );
}