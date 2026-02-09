import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TouchableWithoutFeedback 
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  error,
  disabled = false,
  className = '',
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={() => !disabled && setModalVisible(true)}
        className={`
          flex-row items-center justify-between 
          border rounded-lg px-3 py-3 
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          ${disabled ? 'opacity-50' : ''}
        `}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          {selectedOption?.icon && (
            <View className="mr-2">
              {selectedOption.icon}
            </View>
          )}
          <Text className={`text-base ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        
        <ChevronDown size={20} color="#6B7280" />
      </TouchableOpacity>
      
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">
          {error}
        </Text>
      )}
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View className="flex-1 bg-black/50 justify-center p-4">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-xl max-h-[80%]">
                <View className="p-4 border-b border-gray-200">
                  <Text className="text-lg font-semibold text-gray-900">
                    {label || 'Select'}
                  </Text>
                </View>
                
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.value);
                        setModalVisible(false);
                      }}
                      className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center flex-1">
                        {item.icon && (
                          <View className="mr-3">
                            {item.icon}
                          </View>
                        )}
                        <Text className="text-base text-gray-900">
                          {item.label}
                        </Text>
                      </View>
                      
                      {value === item.value && (
                        <Check size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  )}
                  className="max-h-64"
                />
                
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="p-4 border-t border-gray-200"
                >
                  <Text className="text-center text-blue-600 font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}