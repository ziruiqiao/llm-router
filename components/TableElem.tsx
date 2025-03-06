import { Text, View } from 'react-native';
import tw from 'twrnc';

type TableElemProps = {
    value: number,
    name: string
}

export default function Profile({value, name}: TableElemProps) {
    return (
        <View style={tw`flex flex-col`}>
            <Text style={tw`text-lg py-1 font-medium`}>
                {value}
            </Text>
            <Text style={tw`text-xm py-1`}>
                {name}
            </Text>
        </View>
    );
}