import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingIndex() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        <Text className="text-2xl font-bold">Booking</Text>
        <Text className="text-gray-600 mt-2">
          This page is under construction
        </Text>
      </View>
    </SafeAreaView>
  );
}