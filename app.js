const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./Models/User");
const Video = require("./Models/Video");
const Comment = require("./Models/Comment");
const cors = require("cors");
const app = express();
const path = require("path");
const multer = require("multer");
app.use(cors());
app.use(express.json());


// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));


// Serve media files from the "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://syedmk600:8YJqfLZwZL3GQ62C@data.3pagik7.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Registration route
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if the username is unique
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username is already taken. Please choose a different one.",
      });
    }

    // Check if the email is unique
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email is already registered. Please use a different email.",
      });
    }

    // Check if the password meets the minimum length requirement
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    // Create a new user
    const newUser = new User({
      username,
      email,
      password,
      role,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "Error registering user. Please try again." });
  }
});
// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    // Compare the entered password with the hashed password from the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Create a JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      "fjkdf43h4jkfdfdj884iifdFDDK",
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login. Please try again." });
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.logout();
  res.status(200).json({ message: "Logout successful" });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalName = file.originalname;
    const fileExtension = originalName.slice(
      ((originalName.lastIndexOf(".") - 1) >>> 0) + 2
    );

    cb(null, file.fieldname + "-" + uniqueSuffix + "." + fileExtension);
  },
});

const upload = multer({ storage: storage });

// Handle POST request for video upload
app.post(
  "/upload",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Extract other form data from req.body
      const { title, publisher, producer, genre, ageRating, userId } = req.body;

      // Get the file paths of the uploaded video and thumbnail
      const videoFile = req.files["videoFile"][0];
      const thumbnailFile = req.files["thumbnail"][0];

      // Save the video data to the database
      const newVideo = new Video({
        title,
        publisher,
        producer,
        genre,
        ageRating,
        user: userId,
        thumbnailFilePath: thumbnailFile.path,
        filePath: videoFile.path,
      });

      await newVideo.save();

      // Respond with a success message
      res.status(200).json({ message: "Video uploaded successfully" });
    } catch (error) {
      console.error("Error during video upload:", error);
      res
        .status(500)
        .json({ message: "Error during video upload. Please try again." });
    }
  }
);

// Fetch all videos or search based on query
app.get("/videos", async (req, res) => {
  try {
    const searchTerm = req.query.search;

    if (searchTerm) {
      // If search term is provided, perform search
      const videos = await Video.find({
        $or: [
          { title: { $regex: new RegExp(searchTerm, "i") } },
          { publisher: { $regex: new RegExp(searchTerm, "i") } },
          // Add other fields you want to search here
        ],
      }).populate("user", "username _id"); // Populate the user information

      res.status(200).json(videos);
    } else {
      // If no search term, fetch all videos
      const videos = await Video.find().populate("user", "username _id"); // Populate the user information

      res.status(200).json(videos);
    }
  } catch (error) {
    console.error("Error fetching videos:", error);
    res
      .status(500)
      .json({ message: "Error fetching videos. Please try again." });
  }
});

// Fetch videos for a specific user based on user ID
app.get("/user-videos", async (req, res) => {
  try {
    const searchTerm = req.query.search;
    const userId = req.query.userId; // Extract userId from the query parameters

    // Define the base query object
    const baseQuery = userId ? { user: userId } : {};

    if (searchTerm) {
      // If search term is provided, perform search
      const videos = await Video.find({
        ...baseQuery,
        $or: [
          { title: { $regex: new RegExp(searchTerm, "i") } },
          { publisher: { $regex: new RegExp(searchTerm, "i") } },
          // Add other fields you want to search here
        ],
      }).populate("user", "username _id"); // Populate the user information
      res.status(200).json(videos);
    } else {
      // If no search term, fetch all videos or videos for a specific user
      const videos = await Video.find(baseQuery).populate(
        "user",
        "username _id"
      ); // Populate the user information
      res.status(200).json(videos);
    }
  } catch (error) {
    console.error("Error fetching videos:", error);
    res
      .status(500)
      .json({ message: "Error fetching videos. Please try again." });
  }
});

app.delete("/videos/:videoId", async (req, res) => {
  try {
    const videoId = req.params.videoId;

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
      return res.status(404).json({ message: "Video not found." });
    }

    res.status(200).json({ message: "Video deleted successfully." });
  } catch (error) {
    console.error("Error deleting video:", error);
    res
      .status(500)
      .json({ message: "Error deleting video. Please try again." });
  }
});

app.post("/comments", async (req, res) => {
  try {
    const { videoId, text, userid } = req.body;

    // Find the video based on the provided videoId
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Create a new comment
    const newComment = new Comment({
      text,
      user: userid,
    });

    // Add the comment to the video's comments array
    video.comments.push(newComment);

    // Save the updated video with the new comment
    await video.save();

    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ message: "Error adding comment. Please try again." });
  }
});

app.get("/comments", async (req, res) => {
  try {
    const videoId = req.query.videoId;

    // Find the video based on the provided videoId
    const video = await Video.findById(videoId).populate({
      path: "comments.user",
      select: "username", // You can specify the fields you want to include
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Return the comments with the included user information
    res.status(200).json(video.comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ message: "Error fetching comments. Please try again." });
  }
});
