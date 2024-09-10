const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const cloudinary = require("cloudinary").v2;
const TextModel = require("./textSchema");
const User = require("./userSchema");
const { v4: uuidv4 } = require("uuid"); // To generate unique links
const port = process.env.PORT || 8000;
const app = express();
const upload = require("express-fileupload");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require('connect-flash');
const compression = require('compression');
app.use(compression({
  level:6,
  threshold: 0,
  filter:(req,res)=>{
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
}}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(upload());
app.use(flash());
 
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: app.get('env') === 'production', // Use secure cookies in production only
      maxAge: 60000, // Set cookie expiry time (optional)
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());


// Configuration
cloudinary.config({
  cloud_name: "dgsvocf0w",
  api_key: "769681361645176",
  api_secret: "mHZbyzlvJkB7UJgbcixvLXUszCg",
});

// MongoDB Connection
const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://WorkinX:JoPlgIK8JUpjMeuY@cluster0.qm9dld0.mongodb.net/WorkinX"
    )
    .then(() => {
      console.log(`Connected to MongoDB with ${mongoose.connection.host}`);
    })
    .catch((err) => {
      console.log(err);
    });
};

connectDB();


// app.get("/", (req, res) => {
//   res.render("index"); 
// });

// Configure passport local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

// Protect the main route
app.get("/", ensureAuthenticated, (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input fields
  if (!username || !email || !password) {
    return res.status(400).send("All fields are required.");
  }

  try {
    // Check if the user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User with this email already exists.");
    }

    // Check if the username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).send("Username is already taken.");
    }

    // Create new user object
    const newUser = new User({
      username,
      email,
      password, // This will be hashed by the pre-save hook in your schema
    });

    // Save the new user to the database
    await newUser.save();

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
});



app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true // Enable flash messages for login errors
  }) 
);

app.get("/login", (req, res) => {
  res.render("login", { message: req.flash('error') });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login"); // After logout, redirect to the login page
  });
});

app.post("/", async (req, res) => {
  // Extracting fields from the request body
  const {
    title,
    bulletPoint01,
    bulletPoint02,
    bulletPoint03,
    bulletPoint04,
    bulletPoint05,
    bulletPoint06,
    price,
    brandName,
    itemForm,
    manufacture,
    quantity,
    PackageInfo,
  } = req.body;

  // Initialize arrays to store the secure URLs of uploaded images
  const imgPaths = [];
  const APlusImgPaths = [];

  if (req.files) {
    // Handle single or multiple files for main images
    let files = Array.isArray(req.files.file)
      ? req.files.file
      : [req.files.file];

    // Handle single or multiple files for APlus images
    let files2 = Array.isArray(req.files.APlusFile)
      ? req.files.APlusFile
      : [req.files.APlusFile];

    // Sort the files by their filenames in ascending order
    files.sort((a, b) => a.name.localeCompare(b.name));
    files2.sort((a, b) => a.name.localeCompare(b.name));

    const uploadInParallel = async (filesArray, imgPathsArray, prefix) => {
      const uploadPromises = filesArray.map((file, i) => {
        const newPublicId = `${prefix}_${i + 1}_${Date.now()}`;
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: newPublicId,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            }
          ).end(file.data);
        });
      });
      const uploadedUrls = await Promise.all(uploadPromises);
      imgPathsArray.push(...uploadedUrls);
    };
    
    
    

    try {
      // Upload main images sequentially with compression and resizing
      await uploadInParallel(files, imgPaths, "img");

      // Upload APlus images sequentially with compression and resizing
      await uploadInParallel(files2, APlusImgPaths, "aplus");

      // Generate a unique access link
      const accessLink = uuidv4();

      // Save the document with image URLs and the access link to the database
      const textModel = new TextModel({
        title,
        bulletPoint01,
        bulletPoint02,
        bulletPoint03,
        bulletPoint04,
        bulletPoint05,
        bulletPoint06,
        price,
        brandName,
        itemForm,
        manufacture,
        quantity,
        PackageInfo,
        imgPaths, // Save imgPaths array
        APlusImgPaths, // Save APlusImgPaths array
        accessLink, // Save the unique access link
      });

      await textModel.save(); // Save the document to the database

      // Respond with the access link
      res.render("Preview", { textModel, textId: textModel._id, accessLink });
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while uploading the files.");
    }
  } else {
    res.status(400).send("No files uploaded.");
  }
});


// Endpoint to access data via the unique link
app.get("/access/:link", async (req, res) => {  
  try {
    const { link } = req.params;
    const textModel = await TextModel.findOne({ accessLink: link });

    if (!textModel) {
      return res.status(404).send("No data found for the given link.");
    }

    res.render("test", { textModel, textId: textModel._id });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving the data.");
  }
});

app.get("/admin/dashboard",(req,res)=>{
  res.redirect("/admin/login");
})
app.get("/admin/login",(req,res)=>{
  res.render("adminLogIn");
})
app.post("/admin/login",(req,res)=>{
  if(req.body.AdminUsername === "mohit" && req.body.AdminPassword === "12345"){
    res.render("AdminPanel");
  }
})

app.post("/admin/dashboard",async(req,res)=>{
  // Extracting fields from the request body
  const {
    title,
    bulletPoint01,
    bulletPoint02,
    bulletPoint03,
    bulletPoint04,
    bulletPoint05,
    bulletPoint06,
    price,
    brandName,
    itemForm,
    manufacture,
    quantity,
    PackageInfo,
  } = req.body;

  // Initialize arrays to store the secure URLs of uploaded images
  const imgPaths = [];
  const APlusImgPaths = [];

  if (req.files) {
    // Handle single or multiple files for main images
    let files = Array.isArray(req.files.file)
      ? req.files.file
      : [req.files.file];

    // Handle single or multiple files for APlus images
    let files2 = Array.isArray(req.files.APlusFile)
      ? req.files.APlusFile
      : [req.files.APlusFile];

    // Sort the files by their filenames in ascending order
    files.sort((a, b) => a.name.localeCompare(b.name));
    files2.sort((a, b) => a.name.localeCompare(b.name));

    const uploadInParallel = async (filesArray, imgPathsArray, prefix) => {
      const uploadPromises = filesArray.map((file, i) => {
        const newPublicId = `${prefix}_${i + 1}_${Date.now()}`;
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: newPublicId
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            }
          ).end(file.data);
        });
      });
      const uploadedUrls = await Promise.all(uploadPromises);
      imgPathsArray.push(...uploadedUrls);
    };
    
    
    

    try {
      // Upload main images sequentially with compression and resizing
      await uploadInParallel(files, imgPaths, "img");

      // Upload APlus images sequentially with compression and resizing
      await uploadInParallel(files2, APlusImgPaths, "aplus");

      // Generate a unique access link
      const accessLink = uuidv4();

      // Save the document with image URLs and the access link to the database
      const textModel = new TextModel({
        title,
        bulletPoint01,
        bulletPoint02,
        bulletPoint03,
        bulletPoint04,
        bulletPoint05,
        bulletPoint06,
        price,
        brandName,
        itemForm,
        manufacture,
        quantity,
        PackageInfo,
        imgPaths, // Save imgPaths array
        APlusImgPaths, // Save APlusImgPaths array
        accessLink, // Save the unique access link
      });

      await textModel.save(); // Save the document to the database

      // Respond with the access link
      res.render("Preview", { textModel, textId: textModel._id, accessLink });
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while uploading the files.");
    }
  } else {
    res.status(400).send("No files uploaded.");
  }
});


// Endpoint to access data via the unique link
app.get("/access/:link", async (req, res) => {  
  try {
    const { link } = req.params;
    const textModel = await TextModel.findOne({ accessLink: link });

    if (!textModel) {
      return res.status(404).send("No data found for the given link.");
    }

    res.render("dashboardPreview", { textModel, textId: textModel._id });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving the data.");
  }
  // res.render("dashboardPreview");
})



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
