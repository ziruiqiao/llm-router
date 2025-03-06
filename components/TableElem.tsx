import { Text, View } from 'react-native';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/useColorScheme';
import { lightTheme, darkTheme } from '@/constants/theme';

type TableElemProps = {
    value: number,
    name: string
}

export default function Profile({value, name}: TableElemProps) {
    const colorScheme = useColorScheme();
    const dark = colorScheme === 'dark';
    return (
        <View style={tw`flex flex-col`}>
            <Text style={tw`text-lg py-1 font-medium ${dark?darkTheme.text : lightTheme.text} `}>
                {value}
            </Text>
            <Text style={tw`text-xm py-1`}>
                {name}
            </Text>
        </View>
    );
}