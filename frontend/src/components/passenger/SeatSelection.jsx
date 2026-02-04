import { useState } from 'react';
import { Check } from 'lucide-react';

export default function SeatSelection({
  totalSeats,
  bookedSeats,
  pricePerSeat,
  onSeatsSelected,
}) {
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Generate seat map
  const generateSeatMap = () => {
    const rows = Math.ceil(totalSeats / 4);
    const seats = [];
    
    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      const rowLetter = String.fromCharCode(65 + row);
      
      for (let col = 1; col <= 4; col++) {
        const seatNumber = (row * 4) + col;
        if (seatNumber <= totalSeats) {
          const seatId = `${rowLetter}${col}`;
          rowSeats.push({
            id: seatId,
            number: seatNumber,
            isBooked: bookedSeats.includes(seatId),
            isSelected: selectedSeats.includes(seatId),
          });
        }
      }
      
      seats.push(rowSeats);
    }
    
    return seats;
  };

  const seatMap = generateSeatMap();

  const handleSeatClick = (seatId, isBooked) => {
    if (isBooked) return;

    const newSelectedSeats = selectedSeats.includes(seatId)
      ? selectedSeats.filter(id => id !== seatId)
      : [...selectedSeats, seatId];
    
    setSelectedSeats(newSelectedSeats);
    onSeatsSelected(newSelectedSeats);
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  const calculateTotal = () => {
    const subtotal = pricePerSeat * selectedSeats.length;
    const tax = subtotal * 0.15; // 15% tax
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const totals = calculateTotal();

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-6">Select Your Seats</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 border-2 border-red-600 rounded"></div>
                <span className="text-sm">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-500 border-2 border-primary-600 rounded"></div>
                <span className="text-sm">Your Selection</span>
              </div>
            </div>

            {/* Seat Map */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {/* Driver's Seat */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-800 text-white py-2 px-6 rounded-t-lg text-sm font-medium">
                  Driver
                </div>
              </div>

              {/* Seats */}
              <div className="space-y-4">
                {seatMap.map((rowSeats, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-4">
                    {rowSeats.map((seat) => {
                      let seatClass = 'w-12 h-12 border-2 rounded flex items-center justify-center font-medium ';
                      
                      if (seat.isBooked) {
                        seatClass += 'bg-red-500 border-red-600 cursor-not-allowed';
                      } else if (seat.isSelected) {
                        seatClass += 'bg-primary-500 border-primary-600 cursor-pointer';
                      } else {
                        seatClass += 'bg-gray-200 border-gray-300 hover:bg-gray-300 cursor-pointer';
                      }

                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat.id, seat.isBooked)}
                          disabled={seat.isBooked}
                          className={seatClass}
                          title={`Seat ${seat.id}`}
                        >
                          {seat.isSelected ? (
                            <Check className="w-6 h-6 text-white" />
                          ) : (
                            seat.number
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Entrance */}
              <div className="mt-8 text-center">
                <div className="inline-block bg-gray-300 text-gray-700 py-2 px-6 rounded text-sm font-medium">
                  Entrance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div>
          <div className="card p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-600 mb-1">Selected Seats ({selectedSeats.length})</h4>
                <p className="font-medium">
                  {selectedSeats.length > 0 
                    ? selectedSeats.sort().join(', ')
                    : 'No seats selected'
                  }
                </p>
              </div>

              <div>
                <h4 className="text-sm text-gray-600 mb-1">Price per Ticket</h4>
                <p className="text-xl font-bold">{formatCurrency(pricePerSeat)}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Taxes & Fees (15%)</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Price</span>
                  <span className="text-primary-600">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  disabled={selectedSeats.length === 0}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
                <button className="w-full btn-secondary py-3">
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}