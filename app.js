if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require('path');
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const clientUserRouter = require("./routes/clientUser.js");
const ClientUser = require("./models/clientUser.js");
const Client = require("./models/client.js");
const indexRouter = require("./routes/index.js");
const { setAuthStatus } = require('./middleware');

// Import routes
const clientRoutes = require('./routes/client');
const translatorRoutes = require('./routes/translator');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Session configuration
const sessionConfig = {
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());

// Middleware to make flash messages available to all templates
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(setAuthStatus);

// Configure ejs-mate for layouts and includes
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('view options', { layout: false });

const MONGO_URL = "mongodb://127.0.0.1:27017/translator-hire";

async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");
  } catch (error) {
    console.error("Error connecting to DB:", error);
  }
}

main();

// User Strategy
passport.use("user-local", new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        const isMatch = await user.authenticate(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Translator Strategy
passport.use("translator-local", new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email, isTranslator: true });
        if (!user) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        const isMatch = await user.authenticate(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password' });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Client Strategy
passport.use("client-local", new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true
}, async (req, email, password, done) => {
    try {
        console.log('Client authentication attempt:', { email });
        const client = await Client.findOne({ email });
        
        if (!client) {
            console.log('Client not found:', email);
            return done(null, false, { message: 'Incorrect email or password' });
        }

        console.log('Client found, attempting authentication');
        const isMatch = await client.authenticate(password);
        
        if (!isMatch) {
            console.log('Password mismatch for client:', email);
            return done(null, false, { message: 'Incorrect email or password' });
        }

        console.log('Client authenticated successfully:', email);
        return done(null, client);
    } catch (err) {
        console.error('Client authentication error:', err);
        return done(err);
    }
}));

// Serialization
passport.serializeUser((user, done) => {
    console.log('Serializing user:', {
        id: user._id,
        type: user.constructor.modelName,
        isTranslator: user.isTranslator
    });
    done(null, { 
        id: user._id, 
        type: user.constructor.modelName,
        isTranslator: user.isTranslator
    });
});

// Deserialization
passport.deserializeUser(async (data, done) => {
    try {
        console.log('Deserializing user:', data);
        let user;
        
        if (data.type === 'Client') {
            user = await Client.findById(data.id);
            if (!user) {
                console.log('Client not found during deserialization');
                return done(null, false);
            }
            // Ensure the user is a client
            if (!user.isClient) {
                console.log('User is not a client during deserialization');
                return done(null, false);
            }
        } else if (data.type === 'User') {
            user = await User.findById(data.id);
            if (!user) {
                console.log('User not found during deserialization');
                return done(null, false);
            }
            // Verify isTranslator status
            if (data.isTranslator && !user.isTranslator) {
                console.log('User is not a translator during deserialization');
                return done(null, false);
            }
        } else {
            console.log('Invalid user type during deserialization');
            return done(null, false);
        }

        console.log('Deserialized user:', {
            id: user._id,
            type: user.constructor.modelName,
            isTranslator: user.isTranslator,
            isClient: user.isClient,
            name: user.name,
            email: user.email
        });
        
        done(null, user);
    } catch (err) {
        console.error('Deserialization error:', err);
        done(err);
    }
});

// Debugging middleware
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        url: req.url,
        user: req.user ? {
            id: req.user._id,
            type: req.user.constructor.modelName,
            isTranslator: req.user.isTranslator
        } : 'No user'
    });
    next();
});

app.use("/", indexRouter);
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);
app.use("/client", clientRoutes);
app.use('/translator', translatorRoutes);

const getListingById = async (req, res) => {
  try {
    const id = req.params.id.trim();
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.status(200).json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render('error', { 
        status: statusCode, 
        message,
        isAuthenticated: req.isAuthenticated(),
        currentUser: req.user,
        success: req.flash("success"),
        error: req.flash("error")
    });
});

app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
