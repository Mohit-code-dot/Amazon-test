const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const cloudinary = require("cloudinary").v2;
const TextModel = require("./textSchema");
const { v4: uuidv4 } = require("uuid"); // To generate unique links
const port = 5000;
const app = express();
const upload = require("express-fileupload");
const session = require("express-session");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(upload());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

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

app.get("/", (req, res) => {
  res.render("index");
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
    let files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];

    // Handle single or multiple files for APlus images
    let files2 = Array.isArray(req.files.APlusFile) ? req.files.APlusFile : [req.files.APlusFile];

    // Sort the files by their filenames in ascending order
    files.sort((a, b) => a.name.localeCompare(b.name));
    files2.sort((a, b) => a.name.localeCompare(b.name));

    // Function to upload images sequentially
    const uploadSequentially = async (filesArray, imgPathsArray, prefix) => {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const newPublicId = `${prefix}_${i + 1}_${Date.now()}`;
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
              public_id: newPublicId, // Set the public ID to the new name
            }, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }).end(file.data); // Pass the file buffer to the upload stream
          });
          imgPathsArray.push(result.secure_url); // Push the secure URL to imgPaths array
        } catch (err) {
          throw err;
        }
      }
    };

    try {
      // Upload main images sequentially
      await uploadSequentially(files, imgPaths, 'img');

      // Upload APlus images sequentially
      await uploadSequentially(files2, APlusImgPaths, 'aplus');

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
        imgPaths,      // Save imgPaths array
        APlusImgPaths, // Save APlusImgPaths array
        accessLink,    // Save the unique access link
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

    res.render("Preview", { textModel, textId: textModel._id });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving the data.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
