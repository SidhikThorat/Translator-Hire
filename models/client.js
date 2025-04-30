const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const clientSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    age: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    preferredLanguages: [{
        type: String,
        required: true
    }],
    budget: {
        type: Number,
        required: true
    },
    profileImage: {
        type: String,
        default: 'https://res.cloudinary.com/demo/image/upload/v1674042682/default-profile.png'
    },
    isClient: {
        type: Boolean,
        default: true
    },
    // Payment Information
    paymentMethods: [{
        type: {
            type: String,
            enum: ['credit_card', 'paypal', 'bank_transfer']
        },
        details: {
            type: Schema.Types.Mixed
        }
    }],
    billingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zip: String
    },
    // Account Status
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    // Statistics
    totalProjects: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Configure passport-local-mongoose
clientSchema.plugin(passportLocalMongoose, {
    usernameField: 'email',
    usernameUnique: true,
    selectFields: 'email name username',
    errorMessages: {
        UserExistsError: 'A user with the given email is already registered',
        MissingPasswordError: 'No password was given',
        AttemptTooSoonError: 'Account is currently locked. Try again later',
        TooManyAttemptsError: 'Account locked due to too many failed login attempts',
        NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
        IncorrectPasswordError: 'Password or email are incorrect',
        IncorrectUsernameError: 'Password or email are incorrect',
        MissingUsernameError: 'No email was given',
        UserExistsError: 'A user with the given email is already registered'
    }
});

// Pre-save middleware to ensure username is set to email
clientSchema.pre('save', function(next) {
    if (this.isModified('email') || !this.username) {
        this.username = this.email;
    }
    next();
});

module.exports = mongoose.model('Client', clientSchema); 