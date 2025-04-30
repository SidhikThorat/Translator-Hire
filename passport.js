const passport = require('passport');
const LocalStrategy = require('passport-local');
const Client = require('./models/client');
const Translator = require('./models/translator');

// Client Strategy
passport.use('client-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const client = await Client.findOne({ email });
        if (!client) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        
        const isMatch = await client.authenticate(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        
        return done(null, client);
    } catch (err) {
        return done(err);
    }
}));

// Translator Strategy
passport.use('translator-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const translator = await Translator.findOne({ email });
        if (!translator) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        
        const isMatch = await translator.authenticate(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        
        return done(null, translator);
    } catch (err) {
        return done(err);
    }
}));

// Serialization
passport.serializeUser((user, done) => {
    done(null, { 
        id: user._id, 
        type: user.constructor.modelName 
    });
});

// Deserialization
passport.deserializeUser(async (data, done) => {
    try {
        const Model = data.type === 'Client' ? Client : Translator;
        const user = await Model.findById(data.id);
        done(null, user);
    } catch (err) {
        done(err);
    }
}); 