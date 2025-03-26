import { Text, View } from 'react-native';
import tw from 'twrnc';
import { useThemeColors } from '@/hooks/useColorScheme';

type TableElemProps = {
    value: number,
    name: string
}

export default function Profile({value, name}: TableElemProps) {
    const {colors} = useThemeColors();
    return (
        <View style={tw`flex flex-col`}>
            <Text style={tw`text-lg py-1 font-medium text-[${colors.text}] `}>
                {value}
            </Text>
            <Text style={tw`text-xm py-1 text-[${colors.text}] `}>
                {name}
            </Text>
        </View>
    );
}