const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        country: Joi.string().required(),
        charges: Joi.number().required().min(0),
        location: Joi.string().required(),
        contact: Joi.number().required(),
        age: Joi.number().required(),
        profilepic: Joi.string().allow("",null),
        languagecpic: Joi.string().allow("",null),
    }).required(),
});

module.exports.studentSchema = Joi.object({
    listing: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        country: Joi.string().required(),
        charges: Joi.number().required().min(0),
        location: Joi.string().required(),
        contact: Joi.number().required(),
        age: Joi.number().required(),
        profilepic: Joi.string().allow("",null),
        languagecpic: Joi.string().allow("",null),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});

module.exports.clientUserSchema = Joi.object({
    clientUser: Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required().min(18),
        location: Joi.string().required(),
        country: Joi.string().required(),
        preferredLanguages: Joi.string().required(),
        budget: Joi.number().required().min(0)
    }).required(),
    username: Joi.string().required(),
    password: Joi.string().required()
});