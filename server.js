const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const TextModel = require("./textSchema");
const User = require("./userSchema");
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const compression = require("compression");
const fileUpload = require("express-fileupload");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const app = express();

// Middleware setup
app.use(compression({ level: 6, threshold: 0 }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(flash());

// Session and passport initialization
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // Avoid unnecessary session resaves
    saveUninitialized: false, // Only save the session if something is stored
    cookie: {
      secure: false, // Set to true if you're using https in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for persistent session
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL,
      ttl: 30 * 24 * 60 * 60, // Expire the session after 30 days
      autoRemove: 'native', // Remove expired sessions
    }),
  })
);


app.use(passport.initialize());
app.use(passport.session());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log(`Connected to MongoDB at ${mongoose.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

connectDB();

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false, { message: "Incorrect username." });
      const isMatch = await user.matchPassword(password);
      if (!isMatch)
        return done(null, false, { message: "Incorrect password." });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);  // Serialize user by id
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


// Ensure the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in to access this page.");
  res.redirect("/login");
};


// Routes
app.get("/", ensureAuthenticated, (req, res) => {
  res.redirect("/user/dashboard");
});

// User registration
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("All fields are required.");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send("Email is already in use.");

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).send("Username is taken.");

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
});

// Login route
app.get("/login", (req, res) => {
  res.render("login", { message: req.flash("error") });
});

// "Remember Me" functionality inside login route
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info.message || "Login failed.");
      return res.redirect("/login");
    }

    req.logIn(user, (err) => {
      if (err) return next(err);

      // Set "Remember Me" functionality
      if (req.body.rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.expires = false; // Session expires on browser close
      }

      req.flash("success", "Successfully logged in.");
      return res.redirect("/user/dashboard");
    });
  })(req, res, next);
});


// Error-handling route for the logout process
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // Clears session cookie
      res.redirect("/login");
    });
  });
});

// Function to handle file uploads to Cloudinary
const uploadFiles = async (filesArray, prefix) => {
  return await Promise.all(
    filesArray.map((file, i) => {
      const newPublicId = `${prefix}_${i + 1}_${Date.now()}`;
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ public_id: newPublicId }, (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          })
          .end(file.data);
      });
    })
  );
};

// Handling image and text submission
app.post("/",ensureAuthenticated, async (req, res) => {
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

  if (!req.files) return res.status(400).send("No files uploaded.");

  const imgPaths = [];
  const APlusImgPaths = [];
  let files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
  let files2 = Array.isArray(req.files.APlusFile)
    ? req.files.APlusFile
    : [req.files.APlusFile];

  // Sort the files by their filenames
  files.sort((a, b) => a.name.localeCompare(b.name));
  files2.sort((a, b) => a.name.localeCompare(b.name));

  try {
    // Upload files in parallel
    imgPaths.push(...(await uploadFiles(files, "img")));
    APlusImgPaths.push(...(await uploadFiles(files2, "aplus")));

    const accessLink = uuidv4();

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
      imgPaths,
      APlusImgPaths,
      accessLink,
      username: req.user.username, // Store the username of the current user
      date: Date.now(), // This will be automatically set by the schema
    });

    await textModel.save();

    res.render("Preview", { textModel, textId: textModel._id, accessLink });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred during upload.");
  }
});

// User Dashboard
app.get("/user/dashboard",ensureAuthenticated, async (req, res) => {
  const textModel = await TextModel.find({ username: req.user.username });
  res.render("AdminPanel", { textModel });
});

// Access uploaded data via unique link
app.get("/access/:link", async (req, res) => {
  try {
    const { link } = req.params;
    const textModel = await TextModel.findOne({ accessLink: link });
    if (!textModel) return res.status(404).send("No data found.");
    res.render("test", { textModel, textId: textModel._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving data.");
  }
});

// Start the server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
