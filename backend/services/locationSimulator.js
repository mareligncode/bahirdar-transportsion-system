import Trip from '../models/Trip.js';

class LocationSimulator {
    constructor(io) {
        this.io = io;
        this.interval = null;
        this.cityCoords = {
            'bahir dar': { lat: 11.5944, lng: 37.3912 }, // Actual Meneharia
            'gondar': { lat: 12.6030, lng: 37.4521 },
            'addis ababa': { lat: 8.9806, lng: 38.7578 },
            'dessie': { lat: 11.1333, lng: 39.6333 },
            'debre berhan': { lat: 9.6833, lng: 39.5333 },
            'debre markos': { lat: 10.3333, lng: 37.7333 }
        };
    }

    start() {
        console.log('🛰  Starting Global Location Simulation Service...');
        this.interval = setInterval(() => this.simulateTrips(), 8000);
    }

    async simulateTrips() {
        try {
            const trips = await Trip.find({ tripStatus: 'ongoing' })
                .populate('origin destination vehicle');

            if (trips.length === 0) return;

            for (const trip of trips) {
                // SKIP simulation if real-time tracking is active (last 60 seconds)
                const lastGpsUpdate = trip.lastGpsUpdate || new Date(0);
                const secondsSinceGps = (new Date() - lastGpsUpdate) / 1000;
                if (trip.isRealtimeTracking && secondsSinceGps < 60) {
                    continue;
                }

                const now = new Date();
                const start = new Date(trip.departureTime);
                const end = new Date(trip.arrivalTime);

                // Calculate progress %
                const totalDuration = end - start;
                const timeElapsed = now - start;
                let progress = Math.max(0, Math.min(1, timeElapsed / totalDuration));

                // Get coordinates
                const startCoords = trip.origin?.coordinates || this.getCoordsByCity(trip.origin?.city);
                const endCoords = trip.destination?.coordinates || this.getCoordsByCity(trip.destination?.city);

                if (startCoords && endCoords &&
                    !isNaN(startCoords.lat) && !isNaN(endCoords.lat) &&
                    !isNaN(startCoords.lng) && !isNaN(endCoords.lng) &&
                    !isNaN(progress)) {

                    // Linear interpolation with a bit of "wobble" to make it look live
                    const wobble = (Math.random() - 0.5) * 0.0002;
                    const lat = Number(startCoords.lat) + (Number(endCoords.lat) - Number(startCoords.lat)) * progress + wobble;
                    const lng = Number(startCoords.lng) + (Number(endCoords.lng) - Number(startCoords.lng)) * progress + wobble;

                    if (!isNaN(lat) && !isNaN(lng)) {
                        // Update trip with current coordinates
                        trip.currentCoordinates = { lat, lng };
                        await trip.save();

                        // Broadcast to clients
                        this.io.emit('trip-location-update', {
                            tripId: trip._id,
                            coordinates: { lat, lng },
                            tripNumber: trip.tripNumber,
                            vehicle: {
                                plateNumber: trip.vehicle?.plateNumber,
                                carType: trip.vehicle?.carType
                            },
                            origin: { stationName: trip.origin?.stationName },
                            destination: { stationName: trip.destination?.stationName }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Location simulation error:', error);
        }
    }

    getCoordsByCity(city) {
        if (!city) return null;
        return this.cityCoords[city.toLowerCase()] || null;
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }
}

export default LocationSimulator;
