import { TwelveLabs, Task } from "twelvelabs-js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

//TODO: store videos on s3 bucket and index from s3 bucket

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const client = new TwelveLabs({
  apiKey: process.env.TWELVE_LABS_API_KEY,
});

async function createIndex() {
  try {
    const createdIndex = await client.index.create({
      name: "XDVideos_Collection_Index",
      models: [
        {
          name: "marengo2.7",
          options: ["visual", "audio"],
        },
      ],
      addons: ["thumbnail"],
    });
    console.log(`ID: ${createdIndex.id}`);
    console.log(`Name: ${createdIndex.name}`);
    console.log("Models:");
    createdIndex.models.forEach((model, index) => {
      console.log(`  Model ${index + 1}:`);
      console.log(`    Name: ${model.name}`);
      console.log(`    Options: ${JSON.stringify(model.options)}`);
    });
    console.log(`Video count: ${createdIndex.videoCount}`);
    console.log(`Total duration: ${createdIndex.totalDuration} seconds`);
    console.log(`Created at: ${createdIndex.createdAt}`);
    if (createdIndex.updatedAt) {
      console.log(`Updated at: ${createdIndex.updatedAt}`);
    }
    return createdIndex.id;
  } catch (error) {
    console.error("Error creating index:", error);
    throw error;
  }
}

async function uploadAndIndexVideo(video, indexId) {
  try {
    console.log(`Uploading and indexing video: ${video.id}`);
    console.log(`Video path: ${video.localPath}`);

    // Check if file exists
    if (!(await fs.pathExists(video.localPath))) {
      throw new Error(`File does not exist at path: ${video.localPath}`);
    }

    // Check file size
    const stats = await fs.stat(video.localPath);
    console.log(`File size: ${stats.size} bytes`);

    const task = await client.task.create({
      indexId: indexId,
      file: video.localPath,
      metadata: {
        title: video.title || `Video ${video.id}`,
        source_url: video.url,
      },
    });

    console.log(`Task created: id=${task.id}, Video id=${task.videoId}`);

    // Wait for indexing to complete
    await task.waitForDone(5000, (task) => {
      console.log(`  Status=${task.status}`);
    });

    if (task.status !== "ready") {
      throw new Error(`Indexing failed with status ${task.status}`);
    }

    console.log(`Successfully indexed video: ${video.id}`);
    return task.videoId;
  } catch (error) {
    console.error(`Error uploading video ${video.id}:`, error);
    throw error;
  }
}

async function processVideos() {
  try {
    // Read video metadata
    const metadata = await fs.readJson(process.env.VIDEO_METADATA_FILE);

    // Create a new index if needed
    if (!metadata.indexId) {
      metadata.indexId = await createIndex();
      console.log(`Created new index: ${metadata.indexId}`);
    }

    // Process each video
    for (const video of metadata.videos) {
      if (video.downloaded && !video.twelveLabsId) {
        const twelveLabsId = await uploadAndIndexVideo(video, metadata.indexId);
        video.twelveLabsId = twelveLabsId;
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
