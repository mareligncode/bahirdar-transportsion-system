// components/ui/SeatSelector.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Car } from 'lucide-react-native';

// Update the interface to match what you're passing
interface SeatSelectorProps {
  totalSeats: number;
  bookedSeats: string[];
  selectedSeats: string[]; // Add this - it's being passed
  onSeatSelect: (seatNumber: string) => void; // Change from onSeatsSelected
  seatsPerRow?: number;
  pricePerSeat?: number; // Make optional since not passing
  maxSeats?: number;
}

interface SeatItem {
  id: string;
  number: number;
  row: string;
  col: number;
  isBooked: boolean;
  isSelected: boolean;
}

const SeatSelector: React.FC<SeatSelectorProps> = ({
  totalSeats,
  bookedSeats = [],
  selectedSeats = [], // Accept it
  onSeatSelect, // Changed from onSeatsSelected
  seatsPerRow = 4,
  pricePerSeat = 0, // Default value
  maxSeats = 10,
}) => {
  const [localSelectedSeats, setLocalSelectedSeats] = useState<string[]>(selectedSeats);
  const [seatLayout, setSeatLayout] = useState<SeatItem[][]>([]);
  const screenWidth = Dimensions.get('window').width;

  // Sync with parent selectedSeats
  useEffect(() => {
    setLocalSelectedSeats(selectedSeats);
  }, [selectedSeats]);

  // Generate seat layout
  useEffect(() => {
    const rows = Math.ceil(totalSeats / seatsPerRow);
    const layout: SeatItem[][] = [];
    
    for (let row = 0; row < rows; row++) {
      const rowSeats: SeatItem[] = [];
      const rowLetter = String.fromCharCode(65 + row);
      
      for (let col = 1; col <= seatsPerRow; col++) {
        const seatNumber = (row * seatsPerRow) + col;
        if (seatNumber > totalSeats) break;
        
        const seatId = `${rowLetter}${col}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = localSelectedSeats.includes(seatId);
        
        rowSeats.push({
          id: seatId,
          number: seatNumber,
          row: rowLetter,
          col,
          isBooked,
          isSelected,
        });
      }
      
      if (rowSeats.length > 0) {
        layout.push(rowSeats);
      }
    }
    
    setSeatLayout(layout);
  }, [totalSeats, bookedSeats, localSelectedSeats, seatsPerRow]);

  const handleSeatPress = (seatId: string, isBooked: boolean) => {
    if (isBooked) return;
    
    setLocalSelectedSeats(prev => {
      let newSelectedSeats: string[];
      
      if (prev.includes(seatId)) {
        newSelectedSeats = prev.filter(id => id !== seatId);
      } else {
        if (prev.length >= maxSeats) {
          return prev;
        }
        newSelectedSeats = [...prev, seatId];
      }
      
      // Notify parent component
      onSeatSelect(seatId);
      return newSelectedSeats;
    });
  };

  const getSeatColor = (isBooked: boolean, isSelected: boolean): string => {
    if (isBooked) return 'bg-red-500';
    if (isSelected) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getSeatTextColor = (isBooked: boolean, isSelected: boolean): string => {
    if (isBooked || isSelected) return 'text-white';
    return 'text-gray-800';
  };

  const sortSeats = (seats: string[]): string[] => {
    return [...seats].sort((a, b) => {
      const rowA = a.charAt(0);
      const rowB = b.charAt(0);
      const numA = parseInt(a.slice(1));
      const numB = parseInt(b.slice(1));
      
      if (rowA !== rowB) {
        return rowA.localeCompare(rowB);
      }
      return numA - numB;
    });
  };

  return (
    <View className="flex-1">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Seat Indicator */}
        <View className="items-center mb-8">
          <View className="bg-gray-800 px-4 py-2 rounded-lg mb-2">
            <Text className="text-white font-bold">DRIVER</Text>
          </View>
          <View className="w-full h-1 bg-gray-300" />
        </View>

        {/* Seats */}
        <View className="space-y-6">
          {seatLayout.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-center space-x-4">
              {/* Row Label */}
              <View className="w-8 items-center justify-center">
                <Text className="font-bold text-gray-700">{row[0]?.row || ''}</Text>
              </View>
              
              {/* Seats */}
              {row.map((seat, seatIndex) => {
                const isAisle = seatIndex === Math.floor(seatsPerRow / 2) - 1;
                
                return (
                  <React.Fragment key={seat.id}>
                    <TouchableOpacity
                      onPress={() => handleSeatPress(seat.id, seat.isBooked)}
                      disabled={seat.isBooked}
                      className={`w-12 h-12 rounded-lg items-center justify-center ${
                        getSeatColor(seat.isBooked, seat.isSelected)
                      } ${seat.isBooked ? 'opacity-60' : ''}`}
                      activeOpacity={0.7}
                    >
                      <Text className={`font-bold ${getSeatTextColor(seat.isBooked, seat.isSelected)}`}>
                        {seat.number}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Add aisle space */}
                    {isAisle && <View className="w-12" />}
                  </React.Fragment>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View className="flex-row justify-between mt-8 px-4">
          <View className="items-center">
            <View className="w-10 h-10 bg-gray-300 rounded-lg items-center justify-center mb-1">
              <Text className="font-bold text-gray-800">1</Text>
            </View>
            <Text className="text-xs text-gray-600">Available</Text>
          </View>
          
          <View className="items-center">
            <View className="w-10 h-10 bg-blue-500 rounded-lg items-center justify-center mb-1">
              <Text className="font-bold text-white">2</Text>
            </View>
            <Text className="text-xs text-gray-600">Selected</Text>
          </View>
          
          <View className="items-center">
            <View className="w-10 h-10 bg-red-500 rounded-lg items-center justify-center mb-1">
              <Text className="font-bold text-white">3</Text>
            </View>
            <Text className="text-xs text-gray-600">Booked</Text>
          </View>
          
          <View className="items-center">
            <View className="w-10 h-10 bg-gray-800 rounded-lg items-center justify-center mb-1">
              <Car size={20} color="white" />
            </View>
            <Text className="text-xs text-gray-600">Driver</Text>
          </View>
        </View>
      </ScrollView>

      {/* Selection Summary */}
      {localSelectedSeats.length > 0 && (
        <View className="border-t border-gray-200 p-4">
          <Text className="font-semibold text-gray-800 mb-2">
            Selected Seats: {sortSeats(localSelectedSeats).join(', ')}
          </Text>
          {pricePerSeat > 0 && (
            <>
              <Text className="text-gray-600">
                Total: ETB {pricePerSeat * localSelectedSeats.length} 
                ({localSelectedSeats.length} seat{localSelectedSeats.length !== 1 ? 's' : ''} × ETB {pricePerSeat})
              </Text>
              {maxSeats && (
                <Text className="text-sm text-gray-500 mt-1">
                  Maximum {maxSeats} seat{maxSeats !== 1 ? 's' : ''} per booking
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default SeatSelector;