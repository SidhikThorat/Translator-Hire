const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");


const listingSchema = new mongoose.Schema({
  profilepic: {
    url: String,
    filename: String,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    enum: ["India","america","japan","us","uk","germany"],
    required: true,
  },
  charges:  {
    type: Number,
    required: true,
  },
  location:  {
    type: String,
    required: true,
  },
  contact:{
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^91\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number! Phone number must be 12 digits starting with 91.`
    }
  },
  age:  {
    type: Number,
    required: true,
    min: [1],
    max: [100],
  },
  languagecpic: {
    url: String,
    filename: String,
  },
  introv: {
    type: String,
  },
  reviews: [
    {
    type: Schema.Types.ObjectId,
    ref: "Review",
  },
],
owner: [{
  type: Schema.Types.ObjectId,
  ref: "User",
},
],

category: {
  type: String,
  enum: ["hindi","english","marathi","sanskrit","punjabi","kannada","gujarati","assamese","bengali","malayalam","tamil"],
}

});

listingSchema.methods.display = function() {
  //console.log(this);
};

listingSchema.post("findAndDelete", async(listing)=>{
  if(listing){
    await Review.deleteMany({_id: {$in: listing.reviews}});
  }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
