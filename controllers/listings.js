const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const { search } = req.query; //Query fRom Url
  let filter = {};

  if (search) {
    const searchRegex = new RegExp(search, 'i'); // Remove case INsnsentive

    // filter for multiple Fields
    filter = {
      $or: [
        { name: { $regex: searchRegex } }, // Search in name
        { country: { $regex: searchRegex } }, // Search in country
        { location: { $regex: searchRegex } }, // Search in location
        { gender: { $regex: searchRegex } } // Search in gender
      ]
    };

    //only if number seearch also in charges
    if (!isNaN(search)) {
      filter.$or.push({ charges: Number(search) }); //iF Exact match for charges
    }
  }

  try {
    const listings = await Listing.find(filter); // Search by Filter
    res.render('listings/index.ejs', { listings });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while searching for listings");
  }
};


module.exports.filterListings = async (req, res) => {
  const { country, location, minCharges, maxCharges, gender } = req.query;
  let filter = {};

  //coutry filTer
  if (country) {
    filter.country = { $regex: new RegExp(country, 'i') }; // Case-insensitive
  }


  if (location) {
    filter.location = { $regex: new RegExp(location, 'i') }; // Case-insensitive
  }

  // chrge Range Filter
  if (minCharges || maxCharges) {
    filter.charges = {};
    if (minCharges) filter.charges.$gte = parseInt(minCharges);
    if (maxCharges) filter.charges.$lte = parseInt(maxCharges);
  }

  // Gender FilTer
  if (gender) {
    filter.gender = gender;
  }

  try {
    const filteredListings = await Listing.find(filter);
    res.render('filtered.ejs', { filteredListings });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while filtering listings");
  }
};


module.exports.renderNewForm = async (req, res, next) => {
  res.render('new.ejs');
};

module.exports.showListing = async (req, res, next) => {
  let { id } = req.params;
  id = req.params.id.trim();
  const listing = await Listing.findById(id).populate("reviews").populate("owner");
  if (listing) {
    res.render('show.ejs', { listing });
  } else {
    req.flash("error", "Translator does not exist!");
    res.redirect('/listings');
  }
};

module.exports.createListing = async (req, res, next) => {
  console.log(req.file);
  const newListing = new Listing(req.body.listing);
  if (req.file) {
    const url = req.file.path;
    const filename = req.file.filename;
    newListing.profilepic = { url, filename };
  } else {
    req.flash("error", "No profile picture uploaded");
  }
  await newListing.save();
  req.flash("success", "New Translator Created!");
  res.redirect(`/listings${newListing._id}`);
};

module.exports.renderEditForm = async (req, res, next) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (listing) {
    res.render('edit.ejs', { listing });
  } else {
    req.flash("error", "Translator does not exist!");
    res.redirect('/listings');
  }
};

module.exports.updateListing = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id.trim(), { ...req.body.listing }, { new: true });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.profilepic = { url, filename };
    await listing.save();
  }
  if (listing) {
    req.flash("success", "Translator Updated!");
    res.redirect(`/listings/${id}`);
  } else {
    res.send("No listings found");
  }
};

module.exports.destroyListing = async (req, res, next) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Translator Deleted!");
  res.redirect('/listings');
}
