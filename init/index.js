const mongoose = require("mongoose");
const { sampleListings } = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/translator-hire";

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");
        
        // Clear existing listings
        await Listing.deleteMany({});
        console.log("Cleared existing listings");

        // Insert translator data
        const insertedListings = await Listing.insertMany(sampleListings);
        console.log(`Successfully seeded ${insertedListings.length} translators`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from DB");
    }
}

main();