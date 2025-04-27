const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

//TODO: store videos on s3 bucket and index from s3 bucket
async function downloadVideo(url, videoId) {
  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    const videoPath = path.join(process.env.VIDEO_DOWNLOAD_DIR, `${videoId}.mp4`);
    const writer = fs.createWriteStream(videoPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`Video downloaded successfully: ${videoId}`);
        resolve(videoPath);
      });
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading video ${videoId}:`, error);
    throw error;
  }
}

async function processVideos() {
  try {
    // Ensure download directory exists
    await fs.ensureDir(process.env.VIDEO_DOWNLOAD_DIR);

    // Read video metadata file
    const metadata = await fs.readJson(process.env.VIDEO_METADATA_FILE);

    for (const video of metadata.videos) {
      if (!video.downloaded) {
        console.log(`Downloading video: ${video.id}`);
        const localPath = await downloadVideo(video.url, video.id);
        video.downloaded = true;
        video.localPath = localPath;
        console.log(`Successfully downloaded video: ${video.id}`);
      }
    }

    // Update metadata file
    await fs.writeJson(process.env.VIDEO_METADATA_FILE, metadata, { spaces: 2 });
    console.log("All videos processed successfully");
  } catch (error) {
    console.error("Error processing videos:", error);
  }
}

// Run the script
processVideos();
