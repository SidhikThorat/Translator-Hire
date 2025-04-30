const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");


const studentSchema = new mongoose.Schema({
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
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v); 
      },
      message: props => `${props.value} is not a valid phone number!`
    },
    required: [true, 'Contact number required'],
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

studentSchema.methods.display = function() {
  //console.log(this);
};

studentSchema.post("findAndDelete", async(student)=>{
  if(student){
    await Review.deleteMany({_id: {$in: student.reviews}});
  }
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
