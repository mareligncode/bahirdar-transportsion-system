import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { ChevronDown, LucideIcon } from 'lucide-react-native';

interface SelectItem {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  items: SelectItem[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
  className?: string;
    loading?: boolean;  
  error?: string;     
  disabled?: boolean;
}

export function Select({
  label,
  value,
  onValueChange,
  items,
  placeholder = 'Select an option',
  leftIcon,
  className = '',
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(item => item.value === value);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        className="flex-row items-center border border-gray-300 rounded-lg px-3 py-3 bg-white"
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {leftIcon && (
          <View className="mr-3">
            {leftIcon}
          </View>
        )}
        
        <Text className={`flex-1 ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedItem?.label || placeholder}
        </Text>
        
        <ChevronDown size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-3/4">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                {label || 'Select an option'}
              </Text>
            </View>
            
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`px-4 py-3 ${value === item.value ? 'bg-blue-50' : ''}`}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text className={`${value === item.value ? 'text-blue-600 font-medium' : 'text-gray-900'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
            />
            
            <TouchableOpacity
              className="p-4 border-t border-gray-200"
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text className="text-center text-red-600 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
