import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Car, User } from 'lucide-react-native';
import { AppText } from '../common/AppText';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/helpers';

interface SeatSelectorProps {
  totalSeats: number;
  bookedSeats: string[];
  selectedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
  seatsPerRow?: number;
  pricePerSeat?: number;
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
  selectedSeats = [],
  onSeatSelect,
  seatsPerRow = 4,
  pricePerSeat = 0,
  maxSeats = 10,
}) => {
  const { isDark, colors } = useTheme();
  const [localSelectedSeats, setLocalSelectedSeats] = useState<string[]>(selectedSeats);
  const [seatLayout, setSeatLayout] = useState<SeatItem[][]>([]);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    setLocalSelectedSeats(selectedSeats);
  }, [selectedSeats]);

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
        <View className="items-center mb-8">
          <View className="bg-gray-800 px-4 py-2 rounded-lg mb-2">
            <AppText weight="bold" color="white">DRIVER</AppText>
          </View>
          <View className="w-full h-1 bg-gray-300" />
        </View>

        <View className="space-y-6">
          {seatLayout.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-center space-x-4">
              {/* Row Label */}
              <View className="w-8 items-center justify-center">
                <AppText weight="bold" color={isDark ? 'white' : 'textSecondary'}>{row[0]?.row || ''}</AppText>
              </View>

              {/* Seats */}
              {row.map((seat, seatIndex) => {
                const isAisle = seatIndex === Math.floor(seatsPerRow / 2) - 1;

                return (
                  <React.Fragment key={seat.id}>
                    <TouchableOpacity
                      onPress={() => handleSeatPress(seat.id, seat.isBooked)}
                      disabled={seat.isBooked}
                      className={`w-12 h-12 rounded-lg items-center justify-center ${getSeatColor(seat.isBooked, seat.isSelected)
                        } ${seat.isBooked ? 'opacity-60' : ''}`}
                      activeOpacity={0.7}
                    >
                      <AppText weight="bold" color={getSeatTextColor(seat.isBooked, seat.isSelected)}>
                        {seat.number}
                      </AppText>
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
            <View className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg items-center justify-center mb-1">
              <AppText weight="bold" color={isDark ? 'white' : 'textSecondary'}>1</AppText>
            </View>
            <AppText variant="caption" color="textSecondary">Available</AppText>
          </View>

          <View className="items-center">
            <View className="w-10 h-10 bg-blue-500 rounded-lg items-center justify-center mb-1">
              <AppText weight="bold" color="white">2</AppText>
            </View>
            <AppText variant="caption" color="textSecondary">Selected</AppText>
          </View>

          <View className="items-center">
            <View className="w-10 h-10 bg-red-500 rounded-lg items-center justify-center mb-1">
              <AppText weight="bold" color="white">3</AppText>
            </View>
            <AppText variant="caption" color="textSecondary">Booked</AppText>
          </View>

          <View className="items-center">
            <View className="w-10 h-10 bg-gray-800 rounded-lg items-center justify-center mb-1">
              <Car size={20} color="white" />
            </View>
            <AppText variant="caption" color="textSecondary">Driver</AppText>
          </View>
        </View>
      </ScrollView>

      {/* Selection Summary */}
      {localSelectedSeats.length > 0 && (
        <View className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} p-4`}>
          <AppText weight="semibold" color={isDark ? 'white' : 'textPrimary'} className="mb-2">
            Selected Seats: {sortSeats(localSelectedSeats).join(', ')}
          </AppText>
          {pricePerSeat > 0 && (
            <>
              <AppText color="textSecondary">
                Total: {formatCurrency(pricePerSeat * localSelectedSeats.length)}
                ({localSelectedSeats.length} seat{localSelectedSeats.length !== 1 ? 's' : ''} × {formatCurrency(pricePerSeat)})
              </AppText>
              {maxSeats && (
                <AppText variant="caption" color="textTertiary" className="mt-1">
                  Maximum {maxSeats} seat{maxSeats !== 1 ? 's' : ''} per booking
                </AppText>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default SeatSelector;