const fs = require('fs');
const path = require('path');
const { getModelConfig } = require('./modelRegistry');
const { falGenerate, falSubmit, falStatus, falResult } = require('./providers/falClient');
const {
  runwayImageToVideo,
  runwayPost,
  pollRunwayTask,
  extractRunwayVideoUrl,
} = require('./providers/runwayClient');
const {
  wavespeedGenerate,
  wavespeedPost,
  wavespeedGet,
  extractWavespeedOutputUrl,
} = require('./providers/wavespeedClient');
const { aimlPost } = require('./providers/aimlClient');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/** Lazy-load optional SDKs so FAL/Runway/WaveSpeed work without openai/replicate installed. */
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const OpenAI = require('openai');
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (err) {
    throw new Error(
      'OPENAI_API_KEY is set but the "openai" package is not installed. Run: npm install openai'
    );
  }
}

function getReplicate() {
  if (!process.env.REPLICATE_API_TOKEN) return null;
  try {
    const Replicate = require('replicate');
    return new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  } catch (err) {
    throw new Error(
      'REPLICATE_API_TOKEN is set but the "replicate" package is not installed. Run: npm install replicate'
    );
  }
}

async function runOpenAIImage(input) {
  const openai = getOpenAI();
  if (!openai) throw new Error('OPENAI_API_KEY is not configured');
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: input.prompt,
    n: 1,
    size: input.size || '1024x1024',
  });
  return response.data[0].url;
}

async function runOpenAISoraStub(input) {
  // OpenAI Sora API availability varies; fall back to clear error
  const openai = getOpenAI();
  if (!openai) throw new Error('OPENAI_API_KEY is not configured');
  if (typeof openai.videos?.generate === 'function') {
    const job = await openai.videos.generate({
      model: input.model || 'sora-2',
      prompt: input.prompt,
      seconds: input.seconds || 8,
    });
    return job?.url || job?.video_url || null;
  }
  throw new Error('Sora video API is not available on this OpenAI account/SDK. Configure FAL/Runway alternatives.');
}

/** OpenAI TTS-HD — writes mp3 under /uploads and returns a public URL. */
async function runOpenAITTS(input) {
  const openai = getOpenAI();
  if (!openai) throw new Error('OPENAI_API_KEY is not configured');
  const text = String(input.input || input.prompt || '').trim();
  if (!text) throw new Error('TTS requires text (prompt or input)');

  const speech = await openai.audio.speech.create({
    model: input.model || 'tts-1-hd',
    voice: input.voice || 'alloy',
    input: text,
    response_format: input.response_format || 'mp3',
    speed: typeof input.speed === 'number' ? input.speed : 1,
  });

  const buffer = Buffer.from(await speech.arrayBuffer());
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const filename = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  const base =
    process.env.PUBLIC_BASE_URL ||
    `http://localhost:${process.env.PORT || 5000}`;
  return `${String(base).replace(/\/$/, '')}/uploads/${filename}`;
}

async function runRunway(config, body) {
  const input = config.buildInput(body);
  if (config.runwayKind === 'image_to_video') {
    return runwayImageToVideo(input);
  }

  const pathByKind = {
    video_to_video: '/v1/video_to_video',
    character_performance: '/v1/character_performance',
    video_upscale: '/v1/video_upscale',
  };
  const path = pathByKind[config.runwayKind];
  if (!path) {
    throw new Error(`Unsupported Runway kind: ${config.runwayKind}`);
  }

  const created = await runwayPost(path, input);
  const taskId = created?.id || created?.task_id || created?.task?.id;
  if (!taskId) {
    const immediate = extractRunwayVideoUrl(created);
    if (immediate) return immediate;
    throw new Error('Runway did not return a task id');
  }
  const done = await pollRunwayTask(taskId);
  return done.videoUrl || extractRunwayVideoUrl(done);
}

/**
 * Unified generation entry used by /api/generate
 */
async function generateContent(type, model, prompt, options = {}) {
  const body = {
    prompt,
    ...options,
    type,
    model,
  };

  const config = getModelConfig(model);
  if (!config) {
    // Legacy fallbacks
    if (type === 'image') {
      try {
        return {
          success: true,
          provider: 'openai',
          mediaType: 'image',
          outputUrl: await runOpenAIImage({ prompt, size: options.size }),
          raw: null,
        };
      } catch (e) {
        throw new Error(`Unknown model "${model}" and OpenAI fallback failed: ${e.message}`);
      }
    }
    throw new Error(
      `Model "${model}" is not registered. Add it to modelRegistry.js or use a known model id.`
    );
  }

  const input = config.buildInput(body);

  if (config.provider === 'fal') {
    const data = await falGenerate(config.falPath, input, {
      mode: config.mode || 'sync',
      pollIntervalMs: options.pollIntervalMs,
      maxPolls: options.maxPolls,
    });
    let output = config.extractOutput(data);
    if (config.mediaType === 'json' || config.mediaType === 'text') {
      return {
        success: true,
        provider: 'fal',
        mediaType: config.mediaType,
        outputUrl: typeof output === 'string' ? output : null,
        result: output,
        raw: data,
      };
    }
    if (!output) {
      throw new Error('Provider finished but no media URL was returned');
    }
    return {
      success: true,
      provider: 'fal',
      mediaType: config.mediaType,
      outputUrl: output,
      raw: data,
    };
  }

  if (config.provider === 'runway') {
    const outputUrl = await runRunway(config, body);
    if (!outputUrl) throw new Error('Runway finished but no video URL was returned');
    return {
      success: true,
      provider: 'runway',
      mediaType: 'video',
      outputUrl,
      raw: null,
    };
  }

  if (config.provider === 'wavespeed') {
    const data = await wavespeedGenerate(config.wavespeedPath, input, {
      pollIntervalMs: options.pollIntervalMs,
      maxPolls: options.maxPolls,
    });
    const outputUrl = config.extractOutput(data) || extractWavespeedOutputUrl(data);
    if (!outputUrl) throw new Error('WaveSpeed finished but no media URL was returned');
    return {
      success: true,
      provider: 'wavespeed',
      mediaType: config.mediaType,
      outputUrl,
      raw: data,
    };
  }

  if (config.provider === 'aiml') {
    const data = await aimlPost(config.aimlPath, input);
    const outputUrl = config.extractOutput(data);
    if (!outputUrl) throw new Error('AIML finished but no media URL was returned');
    return {
      success: true,
      provider: 'aiml',
      mediaType: config.mediaType,
      outputUrl,
      raw: data,
    };
  }

  if (config.provider === 'openai') {
    if (config.openaiKind === 'sora') {
      const outputUrl = await runOpenAISoraStub(input);
      return {
        success: true,
        provider: 'openai',
        mediaType: 'video',
        outputUrl,
        raw: null,
      };
    }
    if (config.openaiKind === 'tts') {
      const outputUrl = await runOpenAITTS(input);
      return {
        success: true,
        provider: 'openai',
        mediaType: 'audio',
        outputUrl,
        raw: null,
      };
    }
    const outputUrl = await runOpenAIImage(input);
    return {
      success: true,
      provider: 'openai',
      mediaType: 'image',
      outputUrl,
      raw: null,
    };
  }

  if (config.provider === 'suno') {
    throw new Error(
      'Suno music generation is not wired yet. Configure a dedicated Suno proxy or remove this model from the UI.',
    );
  }

  if (config.provider === 'replicate') {
    const replicate = getReplicate();
    if (!replicate) throw new Error('REPLICATE_API_TOKEN is not configured');
    const output = await replicate.run(config.replicateModel, { input });
    const outputUrl = Array.isArray(output) ? output[0] : output;
    return {
      success: true,
      provider: 'replicate',
      mediaType: config.mediaType,
      outputUrl,
      raw: output,
    };
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

/**
 * Adapter for /api/generate — maps route body → generateContent.
 */
async function runGeneration({
  generationType,
  model,
  prompt,
  inputFileUrl,
  duration,
  resolution,
  ...rest
}) {
  const config = getModelConfig(model);
  const type =
    config?.mediaType === 'video'
      ? 'video'
      : config?.mediaType === 'audio'
        ? 'audio'
        : String(generationType || '').includes('video')
          ? 'video'
          : String(generationType || '').includes('audio')
            ? 'audio'
            : 'image';

  return generateContent(type, model, prompt, {
    image_url: inputFileUrl || rest.image_url || rest.imageUrl,
    video_url: rest.video_url || rest.videoUrl || (type === 'video' ? inputFileUrl : undefined),
    audio_url: rest.audio_url || rest.audioUrl,
    duration,
    resolution,
    ratio: rest.ratio || rest.aspect_ratio,
    ...rest,
  });
}

/** Low-level helpers for proxy routes */
module.exports = {
  generateContent,
  runGeneration,
  getModelConfig,
  falSubmit,
  falStatus,
  falResult,
  falGenerate,
  runwayPost,
  pollRunwayTask,
  wavespeedPost,
  wavespeedGet,
  aimlPost,
};
