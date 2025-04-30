const User = require("../models/user");
const HiringRequest = require("../models/hiringRequest");
const { cloudinary, upload } = require("../cloudinary");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        console.log("Signup process started");
        console.log("Request body:", req.body);

        const { 
            email, 
            username, 
            name, 
            password,
            phone,
            country,
            location,
            gender,
            age,
            charges,
            languages,
            experience,
            bio
        } = req.body;

        let introVideoUrl = "";
        if (req.file) {
            console.log("Uploading video to Cloudinary...");
            const videoResult = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "video",
                folder: "translator-intro-videos"
            });
            introVideoUrl = videoResult.secure_url;
            console.log("Video uploaded successfully:", introVideoUrl);
        }

        const newUser = new User({ 
            email, 
            username,
            name,
            phone,
            country,
            location,
            gender,
            age: parseInt(age),
            charges: parseFloat(charges),
            languages: Array.isArray(languages) ? languages : [languages],
            experience: parseInt(experience),
            bio,
            introVideo: introVideoUrl,
            isTranslator: true
        });
        
        console.log("Creating new user...");
        const registeredUser = await User.register(newUser, password);
        console.log("User registered successfully");
        
        req.login(registeredUser, (err) => {
            if (err) {
                console.log("Login error:", err);
                return next(err);
            }
            console.log("User logged in successfully");
            req.flash("success", "Welcome to Translator Hire! Your translator account has been created.");
            res.redirect("/translator/dashboard");
        });
    } catch (e) {
        console.log("Error in signup process:", e);
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Translator Hire!");
    // Always redirect translators to translator dashboard
    if (req.user && req.user.isTranslator) {
        res.redirect("/translator/dashboard");
    } else {
        // For non-translators, use the original redirect URL or default to users dashboard
        let redirectUrl = res.locals.redirectUrl || "/users/dashboard";
        res.redirect(redirectUrl);
    }
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have been logged out successfully.");
        res.redirect("/");
    });
};

module.exports.renderDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/login");
        }

        // Fetch hiring requests for this translator
        const hiringRequests = await HiringRequest.find({ translator: req.user._id })
            .populate('client', 'name email')
            .sort({ createdAt: -1 });

        // Separate requests by status
        const pendingRequests = hiringRequests.filter(req => req.status === 'pending');
        const acceptedRequests = hiringRequests.filter(req => req.status === 'accepted');
        const completedRequests = hiringRequests.filter(req => req.status === 'completed');

        res.render("users/dashboard.ejs", { 
            user,
            hiringRequests: pendingRequests,
            activeProjects: acceptedRequests,
            pastWork: completedRequests
        });
    } catch (e) {
        console.log("Error rendering dashboard:", e);
        req.flash("error", "Error loading dashboard");
        res.redirect("/login");
    }
};

module.exports.renderEditForm = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/users/dashboard");
        }
        res.render("users/edit.ejs", { user });
    } catch (e) {
        console.log("Error rendering edit form:", e);
        req.flash("error", "Error loading edit form");
        res.redirect("/users/dashboard");
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        console.log("Update profile started");
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);

        const { 
            name, 
            username, 
            email, 
            phone, 
            country, 
            location, 
            gender, 
            age, 
            charges, 
            languages, 
            experience, 
            bio 
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/users/dashboard");
        }

        // Update basic fields
        user.name = name;
        user.username = username;
        user.email = email;
        user.phone = phone;
        user.country = country;
        user.location = location;
        user.gender = gender;
        user.age = parseInt(age);
        user.charges = parseFloat(charges);
        user.languages = Array.isArray(languages) ? languages : [languages];
        user.experience = parseInt(experience);
        user.bio = bio;

        // Handle profile image upload
        if (req.files && req.files.profileImage && req.files.profileImage[0]) {
            console.log("Uploading profile image...");
            try {
                const imageResult = await cloudinary.uploader.upload(req.files.profileImage[0].path, {
                    folder: "translator-profile-images"
                });
                user.profileImage = imageResult.secure_url;
                console.log("Profile image uploaded successfully:", user.profileImage);
            } catch (uploadError) {
                console.error("Error uploading profile image:", uploadError);
                req.flash("error", "Error uploading profile image");
                return res.redirect("/users/edit");
            }
        }

        // Handle intro video upload
        if (req.files && req.files.introVideo && req.files.introVideo[0]) {
            console.log("Uploading intro video...");
            try {
                const videoResult = await cloudinary.uploader.upload(req.files.introVideo[0].path, {
                    resource_type: "video",
                    folder: "translator-intro-videos"
                });
                user.introVideo = videoResult.secure_url;
                console.log("Intro video uploaded successfully:", user.introVideo);
            } catch (uploadError) {
                console.error("Error uploading intro video:", uploadError);
                req.flash("error", "Error uploading intro video");
                return res.redirect("/users/edit");
            }
        }

        console.log("Saving user updates...");
        await user.save();
        console.log("User updated successfully");
        
        req.flash("success", "Profile updated successfully!");
        res.redirect("/users/dashboard");
    } catch (e) {
        console.error("Error in updateProfile:", e);
        req.flash("error", "Error updating profile: " + e.message);
        res.redirect("/users/edit");
    }
};