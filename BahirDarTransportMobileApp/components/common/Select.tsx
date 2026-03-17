import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { AppText } from './AppText';
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
        <AppText variant="bodySmall" weight="500" color="#374151" className="mb-2">
          {label}
        </AppText>
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
        
        <AppText 
          variant="bodyMedium" 
          color={value ? '#111827' : '#6B7280'}
          className="flex-1"
        >
          {selectedItem?.label || placeholder}
        </AppText>
        
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
              <AppText variant="h3" color="#111827">
                {label || 'Select an option'}
              </AppText>
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
                  <AppText 
                    variant="bodyMedium"
                    weight={value === item.value ? '500' : '400'}
                    color={value === item.value ? '#3B82F6' : '#111827'}
                  >
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
            />
            
            <TouchableOpacity
              className="p-4 border-t border-gray-200"
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <AppText variant="bodyMedium" weight="500" color="#EF4444" className="text-center">
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
