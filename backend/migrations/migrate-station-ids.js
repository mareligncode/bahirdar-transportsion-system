import mongoose from 'mongoose';
import User from '../models/Users.js';
import Station from '../models/Station.js';

/**
 * Migration script to convert stationID from String to ObjectId
 * This script handles the transition from the old schema to the new schema
 */

async function migrateStationIds() {
    try {
        console.log('Starting station ID migration...');
        
        // Find all users with stationID as string
        const usersWithStringStationIds = await User.find({
            stationID: { $type: 'string', $ne: '' }
        });

        console.log(`Found ${usersWithStringStationIds.length} users with string stationIDs`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of usersWithStringStationIds) {
            try {
                const stationIdString = user.stationID;
                
                // Try to convert to ObjectId
                if (!mongoose.Types.ObjectId.isValid(stationIdString)) {
                    console.log(`Skipping user ${user._id} - invalid stationID format: ${stationIdString}`);
                    skippedCount++;
                    continue;
                }

                const stationObjectId = new mongoose.Types.ObjectId(stationIdString);
                
                // Verify the station exists
                const station = await Station.findById(stationObjectId);
                if (!station) {
                    console.log(`Skipping user ${user._id} - station not found: ${stationIdString}`);
                    skippedCount++;
                    continue;
                }

                // Update the user
                user.stationID = stationObjectId;
                await user.save();
                
                console.log(`Migrated user ${user._id} from stationID "${stationIdString}" to ObjectId "${stationObjectId}"`);
                migratedCount++;
                
            } catch (error) {
                console.error(`Error migrating user ${user._id}:`, error.message);
                skippedCount++;
            }
        }

        console.log(`Migration completed:`);
        console.log(`- Migrated: ${migratedCount} users`);
        console.log(`- Skipped: ${skippedCount} users`);
        console.log(`- Total processed: ${usersWithStringStationIds.length} users`);

        // Also check for users with empty string stationIDs and set to null
        const usersWithEmptyStationIds = await User.find({
            stationID: ''
        });

        console.log(`Found ${usersWithEmptyStationIds.length} users with empty stationIDs`);

        for (const user of usersWithEmptyStationIds) {
            user.stationID = null;
            await user.save();
            console.log(`Cleared empty stationID for user ${user._id}`);
        }

        console.log('Migration script completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
migrateStationIds();