# Pixverse API Client

A TypeScript/JavaScript client library for interacting with the Pixverse AI video generation and lip-sync API. This library provides a simple and intuitive interface for uploading media, creating lip-sync videos, and managing video content through the Pixverse platform.

## Project Overview

The Pixverse API Client is a comprehensive wrapper for the Pixverse AI platform that enables developers to:

- **Upload Media**: Upload video and audio files to the Pixverse platform
- **Lip Sync Generation**: Create lip-sync videos by synchronizing audio with video content
- **Video Management**: Retrieve video details, get last video frames, and manage video content
- **Token Management**: Handle authentication and upload tokens automatically
- **Type Safety**: Full TypeScript support with comprehensive type definitions

### Key Features

- 🎥 **Video Upload & Processing**: Upload videos and audio files with automatic format handling
- 🎤 **AI Lip Sync**: Generate realistic lip-sync videos using AI technology
- 📊 **Video Analytics**: Get detailed video information including duration, status, and metadata
- 🔒 **Secure Authentication**: Token-based authentication with automatic header management
- 🛡️ **Type Safety**: Complete TypeScript definitions for all API endpoints
- 🔄 **Retry Logic**: Built-in retry mechanism for robust API interactions
- 🌐 **Cross-Platform**: Works in Node.js and browser environments

## Installation

### Prerequisites

- Node.js 16+ or Bun runtime
- TypeScript 5+ (for TypeScript projects)

### Using npm

```bash
npm install pixverse-api
```

### Using yarn

```bash
yarn add pixverse-api
```

### Using bun

```bash
bun add pixverse-api
```

### Development Setup

If you want to contribute or run the project locally:

```bash
# Clone the repository
git clone git@github.com:FxOmar/Pixverse-LipSync-api.git
cd pixverse-api

# Install dependencies
bun install

# Build the project
bun run build
```

## Usage

### Basic Setup

```typescript
import createPixverseClient from 'pixverse-api';

// Initialize the client with your API token
const pixverse = createPixverseClient({
  token: 'your-pixverse-api-token-here',
});
```

### Authentication

To use the Pixverse API, you need to obtain an API token from the Pixverse platform. The token should be included in the client configuration:

```typescript
const pixverse = createPixverseClient({
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  headers: {
    // Optional: Add custom headers
    'Custom-Header': 'value',
  },
});
```

## Example Code

Here's a comprehensive example demonstrating the main functionality of the Pixverse API client:

```typescript
import createPixverseClient from 'pixverse-api';
import fs from 'fs';
import path from 'path';

// Initialize the Pixverse client
const pixverse = createPixverseClient({
  token: 'your-api-token-here',
});

// get test_video.mp4 from my current directory
const video = 'test_video.mp4';
const audio = 'test_audio.mp3';

const videoPath = path.join(__dirname, video);
const videoBuffer = fs.readFileSync(videoPath);
const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });

const audioPath = path.join(__dirname, audio);
const audioBuffer = fs.readFileSync(audioPath);
const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

async function demonstratePixverseAPI() {
  try {
    // 1. Get upload token
    const uploadToken = await pixverse.getUploadToken();

    console.log('Upload token...');

    // 2. Upload a video file
    console.log('📤 Uploading Media...');

    const videoFile = new File([videoBlob], video, { type: 'video/mp4' });
    const audioFile = new File([audioBlob], audio, { type: 'audio/mpeg' });

    // Step 1
    const videoFileUpload = await pixverse.uploadToOSS(
      videoFile as unknown as File,
      video,
      uploadToken
    );

    const audioFileUpload = await pixverse.uploadToOSS(
      audioFile as unknown as File,
      audio,
      uploadToken
    );

    // Step 2
    const videoMediaUpload = await pixverse.uploadMedia(videoFileUpload);
    const audioMediaUpload = await pixverse.uploadMedia(audioFileUpload);

    console.log('✅ Video uploaded:', videoMediaUpload.path);
    console.log('✅ Audio uploaded:', audioMediaUpload.path);

    // 3. Get the last frame of the video (required for lip sync)
    console.log('🖼️ Getting last video frame...');

    const lastFrame = await pixverse.getLastVideoFrame({
      video_path: videoMediaUpload.path,
      duration: 26, // Video duration in seconds
    });

    console.log('✅ Last frame URL:', lastFrame.Resp.last_frame);

    // 4. Create a lip sync video
    console.log('🎬 Creating lip sync video...');

    const lipSyncResult = await pixverse.createLipSync({
      customer_video_path: videoMediaUpload.path,
      customer_video_url: videoMediaUpload.url,
      customer_video_duration: 26,
      customer_video_last_frame_url: lastFrame.Resp.last_frame,
      customer_lip_sync_audio_path: audioMediaUpload.path,
      lip_sync_audio_url: audioMediaUpload.url,
      lip_sync_audio_duration: 5.093875,
      credit_change: 45,
      model: 'v4',
    });

    console.log(
      '✅ Lip sync video created! Video ID:',
      lipSyncResult.Resp.video_id
    );

    // 5. Get video details
    console.log('📋 Fetching video details...');

    const videoDetails = await pixverse.getVideoDetails({
      video_id: parseInt(lipSyncResult.Resp.video_id),
      platform: 'web',
    });

    console.log('✅ Video details:', {
      id: videoDetails.Resp.video_id,
      url: videoDetails.Resp.video_url,
      status: videoDetails.Resp.video_status,
      duration: videoDetails.Resp.video_duration,
      created: videoDetails.Resp.create_time,
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the demonstration
demonstratePixverseAPI();
```

### Important Usage Notes

- **File Types**: Supported video formats include MP4, AVI, MOV. Audio formats include MP3, WAV, AAC.
- **File Size**: Check Pixverse platform limits for maximum file sizes.
- **Rate Limiting**: The API includes built-in retry logic, but be mindful of rate limits.
- **Error Handling**: Always wrap API calls in try-catch blocks for proper error handling.
- **Async Operations**: All API methods are asynchronous and return Promises.

## Configuration

### Client Configuration Options

```typescript
interface PixverseConfig {
  token?: string; // Required: Your Pixverse API token
  headers?: Record<string, string>; // Optional: Custom headers
}
```

### Media Upload Configuration

```typescript
interface MediaUploadRequest {
  name: string; // File name with extension
  path: string; // Local file path
  type: number; // 1 for video, 2 for audio
}
```

### Lip Sync Configuration

```typescript
interface LipSyncRequest {
  customer_video_path: string; // Uploaded video path
  lip_sync_tts_content: string; // Text content for lip sync
  lip_sync_tts_speaker_id: string; // Speaker voice ID
  model: string; // AI model to use
  customer_video_url: string; // Video URL
  customer_video_duration: number; // Duration in seconds
  customer_video_last_frame_url: string; // Last frame URL
  credit_change: number; // Credits to consume
}
```

### Environment Variables

You can also configure the client using environment variables:

```bash
# .env file
PIXVERSE_API_TOKEN=your-api-token-here
```

```typescript
const pixverse = createPixverseClient({
  token: process.env.PIXVERSE_API_TOKEN,
});
```

## API Reference

### Core Methods

- `uploadMedia(request: MediaUploadRequest)` - Upload video or audio files
- `createLipSync(request: LipSyncRequest)` - Generate lip-sync videos
- `getLastVideoFrame(request: LastVideoFrameRequest)` - Extract last frame from video
- `getVideoDetails(request: VideoDetailsRequest)` - Get detailed video information

### Response Types

All API methods return a `PixverseResponse<T>` object:

```typescript
interface PixverseResponse<T> {
  ErrCode: number; // 0 for success, non-zero for errors
  ErrMsg: string; // Error message (empty on success)
  Resp: T; // Response data
}
```

## Contributing

We welcome contributions to the Pixverse API Client! Here's how you can help:

### Development Guidelines

1. **Fork the Repository**: Create a fork of the project on GitHub
2. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Follow Code Standards**: Use TypeScript and follow the existing code style
4. **Add Tests**: Include tests for new functionality
5. **Update Documentation**: Update README and code comments as needed
6. **Submit a Pull Request**: Create a PR with a clear description of changes

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Use meaningful variable and function names
- Keep functions focused and single-purpose

### Testing

```bash
# Run tests
bun test

# Run linting
bun run lint

# Run type checking
bun run type-check
```

### Reporting Issues

When reporting bugs or requesting features:

1. **Search Existing Issues**: Check if the issue already exists
2. **Provide Details**: Include error messages, code samples, and environment info
3. **Use Templates**: Follow the issue templates when available
4. **Be Specific**: Clearly describe the expected vs actual behavior

### Pull Request Process

1. Ensure all tests pass
2. Update documentation for any API changes
3. Add entries to CHANGELOG.md for significant changes
4. Request review from maintainers
5. Address feedback promptly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check this README and inline code documentation
- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/your-username/pixverse-api/issues)
- **Discussions**: Join community discussions on [GitHub Discussions](https://github.com/your-username/pixverse-api/discussions)

## Changelog

### v1.0.0

- Initial release
- Core API client functionality
- Media upload support
- Lip sync video generation
- Video management features
- Full TypeScript support
