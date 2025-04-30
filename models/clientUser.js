const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const clientUserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    preferredLanguages: {
        type: [String],
        required: true,
        set: function(languages) {
            if (typeof languages === 'string') {
                return languages.split(',').map(lang => lang.trim());
            }
            return languages;
        }
    },
    budget: {
        type: Number,
        required: true
    }
});

clientUserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("ClientUser", clientUserSchema); 