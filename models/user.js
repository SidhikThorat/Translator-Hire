const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    age: {
        type: Number,
        required: true,
        min: 18,
        max: 100
    },
    charges: {
        type: Number,
        required: true,
        min: 0
    },
    languages: [{
        type: String,
        required: true
    }],
    experience: {
        type: Number,
        required: true,
        min: 0
    },
    bio: {
        type: String,
        required: true
    },
    introVideo: {
        type: String,
        default: ""
    },
    isTranslator: {
        type: Boolean,
        default: false
    },
    profileImage: {
        type: String,
        default: 'https://img.freepik.com/premium-vector/vector-young-man-anime-style-character-vector-illustration-design-manga-anime-boy_147933-12479.jpg'
    },
    description: {
        type: String,
        required: true
    },
    projects: [{
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    rating: {
        type: Number,
        default: 0
    },
    totalProjects: {
        type: Number,
        default: 0
    }
});

UserSchema.plugin(passportLocalMongoose, {
    usernameField: 'email',
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

UserSchema.methods.display = function() {
    //console.log(this);
};

const User = mongoose.model("User", UserSchema);

module.exports = User;