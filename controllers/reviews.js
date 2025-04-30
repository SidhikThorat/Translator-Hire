const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async(req,res,next) =>{
    let listing = await Listing.findById(req.params.id.trim());
    let newReview = new Review(req.body.review);
  
    listing.reviews.push(newReview);
  
    await newReview.save();
    await listing.save();
  
    req.flash("success" , "New Review Created!");
    res.redirect(`/listings/${listing.id}`);
};

module.exports.destroyReview = async (req, res, next) => {
    let {id} = req.params.id.trim();
    let { reviewId } = req.params;  
    const listing = await Listing.findOneAndUpdate(
        id,
        { $pull: { reviews: reviewId } },
        { new: true }
    );
  
    if (!listing) {
        return res.status(404).send("Listing not found or reviewId not in listing");
    }

    await Review.findByIdAndDelete(reviewId);
    req.flash("success" , "Review Deleted!");
    res.redirect(`/listings/${listing.id}`); 
};