# Video Processing and Indexing Application

This application provides two main functionalities:

1. Download videos from a list of URLs and store them in Google Cloud Storage
2. Upload and index these videos in Twelve Labs for video search capabilities

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the following variables:

```
# Google Cloud Storage Configuration
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILE_PATH=path-to-your-service-account-key.json

# Twelve Labs Configuration
TWELVE_LABS_API_KEY=your-twelve-labs-api-key
TWELVE_LABS_BASE_URL=https://api.twelvelabs.io/v1

# Local Storage Configuration
VIDEO_DOWNLOAD_DIR=./downloads
VIDEO_METADATA_FILE=./video_metadata.json
```

3. Create a `video_metadata.json` file with your video URLs (see the sample file for format)

## Usage

1. To download videos:

```bash
node src/downloadVideos.js
```

2. To upload and index videos:

```bash
node src/uploadAndIndex.js
```

## Video Metadata Format

The `video_metadata.json` file should contain an array of videos with the following structure:

```json
{
  "videos": [
    {
      "id": "unique-video-id",
      "url": "video-url",
      "title": "video-title",
      "downloaded": false,
      "gcsPath": null,
      "twelveLabsId": null
    }
  ],
  "indexId": null
}
```

The application will automatically update the metadata file with:

- `gcsPath`: The Google Cloud Storage path after download
- `twelveLabsId`: The Twelve Labs video ID after indexing
- `indexId`: The Twelve Labs index ID
