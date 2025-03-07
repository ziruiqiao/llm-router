import React, {useState, useEffect} from "react";
import * as Clipboard from 'expo-clipboard';
import { Buffer } from 'buffer';
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

    
    function generateRandomString(length) {
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

    async function redirectToOpenRouterLogin() {
        const clientId = "ZH1LlniwNMbOoYAOtr5CuLEgMUuTuLkU"; // From OpenRouter
        const redirectUri = "myapp://oauth/callback"; // Must match OpenRouter settings
    
        const codeVerifier = generateRandomString(128);
        localStorage.setItem("codeVerifier", codeVerifier); // Store for later use
    
        const codeChallenge = await generateCodeChallenge(codeVerifier);
    
        const authUrl = `https://openrouter.ai/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    
        window.location.href = authUrl; // Redirect to OpenRouter login
    }
    
    function getAuthorizationCodeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("code");
    }
    
    async function exchangeCodeForToken() {
        const clientId = "YOUR_CLIENT_ID";
        const redirectUri = "YOUR_REDIRECT_URI";
        const code = getAuthorizationCodeFromURL();
        const codeVerifier = localStorage.getItem("codeVerifier"); // Retrieve from Step 3
    
        if (!code || !codeVerifier) {
            console.error("Missing authorization code or code verifier.");
            return;
        }
    
        const tokenResponse = await fetch("https://openrouter.ai/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: clientId,
                redirect_uri: redirectUri,
                code: code,
                code_verifier: codeVerifier
            })
        });
    
        const tokenData = await tokenResponse.json();
        console.log("Access Token:", tokenData.access_token);
    
        if (tokenData.access_token) {
            localStorage.setItem("accessToken", tokenData.access_token);
            window.history.replaceState({}, document.title, "/"); // Clean URL
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
                    <Button title="Get JWT" onPress={() => getJWTToken()}/>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </SafeAreaProvider>
        
    );
}