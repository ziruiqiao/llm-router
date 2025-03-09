import React, {useState, useEffect} from "react";
import * as Clipboard from 'expo-clipboard';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Text, View, Keyboard, Button, TouchableOpacity } from 'react-native';
import TableElem from '@/components/TableElem';
import tw from 'twrnc';
import { TextInput, TouchableWithoutFeedback } from "react-native-gesture-handler";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from '@/hooks/useColorScheme';
import { lightTheme, darkTheme } from '@/constants/theme';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function Profile() {
    const [usedCredit, setUsedCredit] = useState(0.0);
    const [totalCredit, setTotalCredit] = useState(0.0);
    const [chatHistory, setChatHistory] = useState(0);
    const [apiKey, setApiKey] = useState("");
    const colorScheme = useColorScheme();
    const [dark, setDark] = useState(colorScheme === 'dark');
    
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

    
    function generateRandomString(length: number) {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        let randomString = "";
        for (let i = 0; i < length; i++) {
            randomString += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return randomString;
    }
    
    async function generateCodeChallenge(codeVerifier: string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    const exchangeCodeForApiKey = async (code, codeVerifier, redirectUri) => {
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        try {
          const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              code_verifier: codeVerifier,
              redirect_uri: redirectUri,
              code_challenge: codeChallenge,
              code_challenge_method: 'S256',
            }),
          });
    
          const { key } = await response.json();
          if (key) {
            setApiKey(key);
            await SecureStore.setItemAsync('openrouter_api_key', key);
          } else {
            console.error('Failed to retrieve API key');
          }
        } catch (error) {
          console.error('Error exchanging code for API key:', error);
        }
    };

    async function loginWithOpenRouter() {
        const redirectUri = AuthSession.makeRedirectUri({ 
            scheme: "myapp", 
            path: "oauth/callback" 
        }); // Must match OpenRouter settings
        const codeVerifier = generateRandomString(128);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
    
        await SecureStore.setItemAsync('code_verifier', codeVerifier);
    
        const [request, response, promptAsync] = AuthSession.useAuthRequest(
            {
              clientId: 'ZH1LlniwNMbOoYAOtr5CuLEgMUuTuLkU',
              scopes: ['openid', 'profile'],
              redirectUri,
              codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
            },
            {
              authorizationEndpoint: 'https://openrouter.ai/auth',
              tokenEndpoint: 'https://openrouter.ai/api/v1/auth/keys',
            }
        );
        if (response?.type === 'success' && response.params.code) {
            const { code } = response.params;
            exchangeCodeForApiKey(code, codeVerifier, redirectUri);
        }
    }

    const pasteFromClipboard = async () => {
        const text = await Clipboard.getStringAsync();
        setApiKey(text);
    };

    useEffect(() => {
        getApiKey();
        saveApiKey();
        getCredit();
        getHistory();
      }, [apiKey]);

    return (
        <SafeAreaProvider>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <SafeAreaView>
                    <View style={tw`flex flex-col p-10`}>
                        <Text style={tw`text-3xl pt-10 pb-5 font-medium ${dark?darkTheme.text : lightTheme.text} `}>
                            User Profile
                        </Text>
                        <View style={tw`flex flex-row justify-between`}>
                            <TableElem name="Total Credit" value={totalCredit}/>
                            <TableElem name="Credit Used" value={usedCredit}/>
                            <TableElem name="Chat History" value={chatHistory}/>
                        </View>
                        <View style={tw`flex flex-col pt-12`}>
                            <Text style={tw`${dark?darkTheme.text : lightTheme.text} `}>Input your OpenRouter API Key: </Text>
                            <TextInput
                                style={tw`${dark ? darkTheme.text : lightTheme.text} border border-gray-700 mt-2 h-10 rounded-md `}
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
                        <View style={tw`flex flex-row pt-4 justify-between`}>
                            <TouchableOpacity onPress={() => setApiKey('')}>
                                <MaterialIcons name="clear" size={20} color={dark?darkTheme.icon : lightTheme.icon} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => pasteFromClipboard()}>
                                <FontAwesome6 name="paste" size={20} color={dark?darkTheme.icon : lightTheme.icon} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Button title="Get JWT" onPress={() => loginWithOpenRouter()}/>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </SafeAreaProvider>
        
    );
}