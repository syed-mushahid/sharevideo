const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  publisher: { type: String, required: true },
  producer: { type: String, required: true },
  genre: { type: String, required: true },
  ageRating: { type: String, required: true },
  filePath: { type: String, required: true },
  thumbnailFilePath: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  comments: [commentSchema],
});

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
