/**
 * Maps UI model IDs (generationOptions.js / credit_config generation_type)
 * to provider endpoints. Prefer FAL where Odoo used fal.run.
 */

function pickPrompt(body) {
  return (body.prompt || body.promptText || '').trim();
}

function firstUrl(body, keys = ['imageUrl', 'image_url', 'inputFileUrl', 'startImageUrl']) {
  for (const k of keys) {
    if (body[k]) return body[k];
  }
  if (Array.isArray(body.imageUrls) && body.imageUrls[0]) return body.imageUrls[0];
  if (Array.isArray(body.images) && body.images[0]) {
    const i = body.images[0];
    return typeof i === 'string' ? i : i.url;
  }
  return null;
}

function extractFalImage(data) {
  return (
    data?.images?.[0]?.url ||
    data?.image?.url ||
    data?.output?.url ||
    (typeof data?.output === 'string' ? data.output : null) ||
    null
  );
}

function extractFalVideo(data) {
  return (
    data?.video?.url ||
    data?.output?.video?.url ||
    (Array.isArray(data?.output) ? data.output[0] : null) ||
    (typeof data?.output === 'string' ? data.output : null) ||
    null
  );
}

function extractFalAudio(data) {
  return data?.audio?.url || data?.audio_file?.url || extractFalVideo(data);
}

const REGISTRY = {
  // ── Text / Image ─────────────────────────────────────────────
  flux_pro: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/flux-pro/v1.1-ultra',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || b.ratio || '16:9',
      num_images: 1,
      enable_safety_checker: true,
    }),
    extractOutput: extractFalImage,
  },
  flux_realism: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/flux-realism',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_size: b.imageSize || 'landscape_4_3',
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'jpeg',
    }),
    extractOutput: extractFalImage,
  },
  google_nano_banana_pro_t2i: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/nano-banana-pro',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || '1:1',
      resolution: (b.resolution || '1k').toLowerCase(),
    }),
    extractOutput: extractFalImage,
  },
  imagen4_ultra: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/imagen4/preview/ultra',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || '1:1',
      num_images: 1,
    }),
    extractOutput: extractFalImage,
  },
  imagen3: {
    provider: 'aiml',
    mediaType: 'image',
    aimlPath: 'v1/images/generations',
    buildInput: (b) => ({
      model: 'imagen-3.0-generate-002',
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || '1:1',
      num_images: 1,
      convert_base64_to_url: true,
    }),
    extractOutput: (d) => d?.data?.[0]?.url || d?.images?.[0]?.url || null,
  },
  gpt_image: {
    provider: 'openai',
    mediaType: 'image',
    buildInput: (b) => ({ prompt: pickPrompt(b), size: b.size || '1024x1024' }),
    extractOutput: (d) => d?.data?.[0]?.url || null,
  },
  seedream_image: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/bytedance/seedream/v4/text-to-image',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_size: b.imageSize || 'square_hd',
      num_images: 1,
    }),
    extractOutput: extractFalImage,
  },

  // ── Image to Image ──────────────────────────────────────────
  kontext: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/flux-pro/kontext',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      guidance_scale: b.guidanceScale ?? 3.5,
    }),
    extractOutput: extractFalImage,
  },
  kontext_max_multi: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/flux-pro/kontext/max/multi',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_urls: b.imageUrls || b.images || (firstUrl(b) ? [firstUrl(b)] : []),
    }),
    extractOutput: extractFalImage,
  },
  gemini_edit: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/gemini-25-flash-image/edit',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_urls: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
    }),
    extractOutput: extractFalImage,
  },
  control_lora_depth: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/flux-general/image-to-image',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      control_image_url: b.controlImageUrl || b.control_image_url,
    }),
    extractOutput: extractFalImage,
  },
  ideogram_reframe: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/ideogram/v3/reframe',
    mode: 'sync',
    buildInput: (b) => ({
      image_url: firstUrl(b),
      image_size: b.imageSize || 'square_hd',
    }),
    extractOutput: extractFalImage,
  },
  upscale: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/clarity-upscaler',
    mode: 'sync',
    buildInput: (b) => ({
      image_url: firstUrl(b),
      upscale_factor: b.upscaleFactor || 2,
    }),
    extractOutput: extractFalImage,
  },

  // ── Video ───────────────────────────────────────────────────
  hailuo_23: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/minimax/hailuo-2.3/standard/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      duration: String(b.duration || '6'),
      prompt_optimizer: true,
    }),
    extractOutput: extractFalVideo,
  },
  hailuo02: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      duration: String(b.duration || '6'),
    }),
    extractOutput: extractFalVideo,
  },
  kling_master: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/kling-video/v2/master/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      duration: String(b.duration || '5'),
      aspect_ratio: b.aspectRatio || '16:9',
    }),
    extractOutput: extractFalVideo,
  },
  veo3: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/veo3',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || '16:9',
      duration: String(b.duration || '8'),
      generate_audio: b.generateAudio !== false,
    }),
    extractOutput: extractFalVideo,
  },
  veo31_fast_t2v: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/veo3.1/fast',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || '16:9',
      duration: String(b.duration || '8'),
      resolution: b.resolution || '720p',
      generate_audio: b.generateAudio !== false,
    }),
    extractOutput: extractFalVideo,
  },
  seedance_pro: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/bytedance/seedance/v1/pro/text-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      duration: String(b.duration || '5'),
      resolution: b.resolution || '720p',
      aspect_ratio: b.aspectRatio || '16:9',
    }),
    extractOutput: extractFalVideo,
  },
  seed_dance: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/bytedance/seedance/v1/pro/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      duration: String(b.duration || '5'),
      resolution: b.resolution || '720p',
    }),
    extractOutput: extractFalVideo,
  },
  fal_start_to_end: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/kling-video/v1.6/pro/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      start_image_url: firstUrl(b, ['startImageUrl', 'imageUrl', 'inputFileUrl']),
      end_image_url: b.endImageUrl || b.end_image_url || b.lastImageUrl,
      duration: String(b.duration || '5'),
    }),
    extractOutput: extractFalVideo,
  },
  vidu_q2_turbo: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/vidu/q2/image-to-video/turbo',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      duration: Number(b.duration || 4),
      resolution: b.resolution || '720p',
    }),
    extractOutput: extractFalVideo,
  },
  runway: {
    provider: 'runway',
    mediaType: 'video',
    runwayKind: 'image_to_video',
    buildInput: (b) => ({
      model: b.runwayModel || 'gen4_turbo',
      promptImage: firstUrl(b),
      promptText: pickPrompt(b),
      ratio: b.ratio || '1280:720',
      duration: Number(b.duration || 5),
    }),
    extractOutput: (d) => d.videoUrl || extractFalVideo(d),
  },
  gen4_aleph: {
    provider: 'runway',
    mediaType: 'video',
    runwayKind: 'video_to_video',
    buildInput: (b) => ({
      model: 'gen4_aleph',
      videoUri: b.videoUrl || b.video_url || b.inputFileUrl,
      promptText: pickPrompt(b),
      ratio: b.ratio || '1280:720',
    }),
    extractOutput: (d) => d.videoUrl || null,
  },
  act_two: {
    provider: 'runway',
    mediaType: 'video',
    runwayKind: 'character_performance',
    buildInput: (b) => ({
      model: 'act_two',
      character: b.character || { type: 'image', uri: firstUrl(b) },
      reference: b.reference || { type: 'video', uri: b.videoUrl || b.referenceVideoUrl },
      ratio: b.ratio || '1280:720',
      bodyControl: b.bodyControl !== false,
      expressionIntensity: Number(b.expressionIntensity || 3),
    }),
    extractOutput: (d) => d.videoUrl || null,
  },
  runway_upscale: {
    provider: 'runway',
    mediaType: 'video',
    runwayKind: 'video_upscale',
    buildInput: (b) => ({
      model: 'upscale_v1',
      videoUri: b.videoUrl || b.video_url || b.inputFileUrl,
    }),
    extractOutput: (d) => d.videoUrl || null,
  },
  kling_video_edit_fast: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/kling-video/o1/video-to-video/edit',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      video_url: b.videoUrl || b.inputFileUrl,
    }),
    extractOutput: extractFalVideo,
  },
  topaz_upscale: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/topaz/upscale/video',
    mode: 'queue',
    buildInput: (b) => ({
      video_url: b.videoUrl || b.inputFileUrl,
      upscale_factor: Number(b.upscaleFactor || 2),
    }),
    extractOutput: extractFalVideo,
  },
  sync_lipsync: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/sync-lipsync/v2',
    mode: 'queue',
    buildInput: (b) => ({
      video_url: b.videoUrl || b.inputFileUrl,
      audio_url: b.audioUrl || b.audio_url,
    }),
    extractOutput: extractFalVideo,
  },
  kling_lipsync: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/kling-video/lipsync/audio-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      video_url: b.videoUrl || b.inputFileUrl,
      audio_url: b.audioUrl,
    }),
    extractOutput: extractFalVideo,
  },
  heygen_v3_lipsync_precision: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/heygen/video/lipsync',
    mode: 'queue',
    buildInput: (b) => ({
      video_url: b.videoUrl || b.inputFileUrl,
      audio_url: b.audioUrl,
    }),
    extractOutput: extractFalVideo,
  },
  mmaudio_v2: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/mmaudio-v2',
    mode: 'queue',
    buildInput: (b) => ({
      video_url: b.videoUrl || b.inputFileUrl,
      prompt: pickPrompt(b),
      duration: Number(b.duration || 8),
    }),
    extractOutput: extractFalVideo,
  },
  sora2_pro: {
    provider: 'openai',
    mediaType: 'video',
    openaiKind: 'sora',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      model: 'sora-2',
      seconds: Number(b.duration || 8),
    }),
    extractOutput: (d) => d?.video_url || d?.url || null,
  },

  // ── Audio ───────────────────────────────────────────────────
  eleven_v3: {
    provider: 'fal',
    mediaType: 'audio',
    falPath: 'fal-ai/elevenlabs/tts/eleven-v3',
    mode: 'sync',
    buildInput: (b) => ({
      text: pickPrompt(b),
      voice: b.voice || 'Rachel',
    }),
    extractOutput: extractFalAudio,
  },
  chatterbox_hd: {
    provider: 'fal',
    mediaType: 'audio',
    falPath: 'fal-ai/chatterbox/text-to-speech',
    mode: 'sync',
    buildInput: (b) => ({
      text: pickPrompt(b),
      voice: b.voice || 'alloy',
    }),
    extractOutput: extractFalAudio,
  },

  // ── Misc ────────────────────────────────────────────────────
  qwen_multi_angles: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/qwen-image-edit/multi-angle',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
    }),
    extractOutput: extractFalImage,
  },
  kling_elements: {
    provider: 'fal',
    mediaType: 'json',
    falPath: 'fal-ai/kling-video/elements',
    mode: 'queue',
    buildInput: (b) => ({
      name: b.name || pickPrompt(b).slice(0, 20) || 'element',
      description: b.description || pickPrompt(b),
      image_url: firstUrl(b),
    }),
    extractOutput: (d) => d,
  },
  prompt_optimizer: {
    provider: 'fal',
    mediaType: 'text',
    falPath: 'fal-ai/any-llm',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: `Optimize this image/video generation prompt. Return only the improved prompt:\n\n${pickPrompt(b)}`,
      model: 'google/gemini-flash-1.5',
    }),
    extractOutput: (d) => d?.output || d?.text || d?.response || null,
  },

  // ── Expanded WaveSpeed / FAL models (Odoo leonardo parity) ──
  nano_banana: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/gemini-25-flash-image/edit',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_urls: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      aspect_ratio: b.aspectRatio || b.ratio || 'auto',
    }),
    extractOutput: extractFalImage,
  },
  nano_banana_pro: {
    provider: 'wavespeed',
    mediaType: 'image',
    wavespeedPath: 'google/nano-banana-pro/edit',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      images: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      aspect_ratio: b.aspectRatio || 'auto',
      resolution: (b.resolution || '1k').toLowerCase(),
      output_format: b.outputFormat || 'png',
    }),
    extractOutput: extractFalImage,
  },
  nano_banana_2_edit: {
    provider: 'wavespeed',
    mediaType: 'image',
    wavespeedPath: 'google/nano-banana-2/edit',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      images: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      aspect_ratio: b.aspectRatio || '1:1',
      resolution: (b.resolution || '1k').toLowerCase(),
      output_format: b.outputFormat || 'png',
    }),
    extractOutput: extractFalImage,
  },
  google_nano_banana_2_t2i: {
    provider: 'wavespeed',
    mediaType: 'image',
    wavespeedPath: 'google/nano-banana-2/text-to-image',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || '1:1',
      resolution: (b.resolution || '1k').toLowerCase(),
      output_format: b.outputFormat || 'png',
    }),
    extractOutput: extractFalImage,
  },
  google_nano_banana_2_i2i: {
    provider: 'wavespeed',
    mediaType: 'image',
    wavespeedPath: 'google/nano-banana-2/edit',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      images: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      aspect_ratio: b.aspectRatio || '1:1',
      resolution: (b.resolution || '1k').toLowerCase(),
      output_format: b.outputFormat || 'png',
    }),
    extractOutput: extractFalImage,
  },
  gpt_image_2_t2i: {
    provider: 'wavespeed',
    mediaType: 'image',
    wavespeedPath: 'openai/gpt-image-2/text-to-image',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      aspect_ratio: b.aspectRatio || '1:1',
      resolution: (b.resolution || '1k').toLowerCase(),
      quality: (b.quality || 'medium').toLowerCase(),
      output_format: b.outputFormat || 'png',
    }),
    extractOutput: extractFalImage,
  },
  gpt_image_2_edit: {
    provider: 'wavespeed',
    mediaType: 'image',
    wavespeedPath: 'openai/gpt-image-2/edit',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      images: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      aspect_ratio: b.aspectRatio || undefined,
      resolution: (b.resolution || '1k').toLowerCase(),
      quality: (b.quality || 'medium').toLowerCase(),
    }),
    extractOutput: extractFalImage,
  },
  kontext_pro: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/flux-pro/kontext',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_url: firstUrl(b),
      aspect_ratio: b.aspectRatio || '1:1',
    }),
    extractOutput: extractFalImage,
  },
  kontext_max: {
    provider: 'fal',
    mediaType: 'image',
    falPath: 'fal-ai/flux-pro/kontext/max/multi',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_urls: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      aspect_ratio: b.aspectRatio || '1:1',
    }),
    extractOutput: extractFalImage,
  },
  veo31_fast_i2v: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'google/veo3.1-fast/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image: firstUrl(b),
      last_image: b.lastImageUrl || b.last_image || undefined,
      duration: parseInt(b.duration, 10) || 8,
      aspect_ratio: b.aspectRatio || '16:9',
      resolution: b.resolution || '1080p',
      generate_audio: b.generateAudio !== false,
    }),
    extractOutput: extractFalVideo,
  },
  veo31_lite_start_end: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'google/veo3.1-lite/start-end-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image: firstUrl(b),
      last_image: b.lastImageUrl || b.last_image || b.endImageUrl,
      aspect_ratio: b.aspectRatio || '16:9',
      resolution: b.resolution || '720p',
      duration: 8,
    }),
    extractOutput: extractFalVideo,
  },
  seedance: {
    provider: 'fal',
    mediaType: 'video',
    falPath: 'fal-ai/bytedance/seedance/v1/pro/image-to-video',
    mode: 'sync',
    buildInput: (b) => ({
      prompt: pickPrompt(b) || 'A cinematic scene',
      image_url: firstUrl(b),
      end_image_url: b.endImageUrl || b.lastImageUrl || undefined,
      duration: String(b.duration || 5),
      aspect_ratio: b.aspectRatio || '16:9',
    }),
    extractOutput: extractFalVideo,
  },
  seedance_2_fast_i2v: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'bytedance/seedance-v2-fast/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image: firstUrl(b),
      last_image: b.lastImageUrl || b.last_image || undefined,
      duration: parseInt(b.duration, 10) || 5,
      resolution: b.resolution || '720p',
      aspect_ratio: b.aspectRatio || undefined,
      enable_web_search: !!b.enableWebSearch,
    }),
    extractOutput: extractFalVideo,
  },
  seedance_2_mini_i2v_turbo: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'bytedance/seedance-v2-mini-turbo/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b) || undefined,
      image: firstUrl(b),
      last_image: b.lastImageUrl || b.last_image || undefined,
      duration: parseInt(b.duration, 10) || 5,
      resolution: b.resolution || '720p',
      aspect_ratio: b.aspectRatio || undefined,
      generate_audio: b.generateAudio !== false,
      enable_web_search: !!b.enableWebSearch,
    }),
    extractOutput: extractFalVideo,
  },
  seedance_2_fast_reference_to_video: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'bytedance/seedance-v2-fast/reference-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      image_urls: b.imageUrls || [],
      video_urls: b.videoUrls || [],
      audio_urls: b.audioUrls || [],
      duration: parseInt(b.duration, 10) || 4,
      resolution: '720p',
      aspect_ratio: b.aspectRatio || 'auto',
      generate_audio: b.generateAudio !== false,
    }),
    extractOutput: extractFalVideo,
  },
  seedance_2_fast_t2v: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'bytedance/seedance-v2-fast/text-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      duration: parseInt(b.duration, 10) || 5,
      resolution: b.resolution || '720p',
      aspect_ratio: b.aspectRatio || '16:9',
      generate_audio: b.generateAudio !== false,
      enable_web_search: !!b.enableWebSearch,
      reference_images: b.imageUrls || [],
      reference_videos: b.videoUrls || [],
      reference_audios: b.audioUrls || [],
    }),
    extractOutput: extractFalVideo,
  },
  kling_v26_pro: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'kwaivgi/kling-v2.6-pro/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      start_image_url: firstUrl(b) || b.startImageUrl,
      end_image_url: b.endImageUrl || b.lastImageUrl || undefined,
      duration: String(b.duration || 5),
      aspect_ratio: b.aspectRatio || '16:9',
      generate_audio: b.generateAudio !== false && !(b.endImageUrl || b.lastImageUrl),
    }),
    extractOutput: extractFalVideo,
  },
  kling_v30_std_i2v: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'kwaivgi/kling-v3.0-std/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b) || undefined,
      image: firstUrl(b),
      end_image: b.endImageUrl || b.lastImageUrl || undefined,
      duration: parseInt(b.duration, 10) || 5,
      cfg_scale: b.cfgScale != null ? Number(b.cfgScale) : 0.5,
      shot_type: b.shotType || 'customize',
      multi_prompt: b.multiPrompt || [],
      element_list: b.elementList || [],
      sound: !!b.sound,
      negative_prompt: b.negativePrompt || undefined,
    }),
    extractOutput: extractFalVideo,
  },
  kling_o3_4k_reference_to_video: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'kwaivgi/kling-o3-4k/reference-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b) || undefined,
      images: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      duration: parseInt(b.duration, 10) || 5,
      aspect_ratio: b.aspectRatio || '16:9',
      shot_type: b.shotType || 'customize',
      sound: !!b.sound,
      multi_prompt: b.multiPrompt || [],
      element_list: b.elementList || [],
    }),
    extractOutput: extractFalVideo,
  },
  kling_v3_turbo_std_t2v: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'kwaivgi/kling-v3-turbo-std/text-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b) || undefined,
      duration: parseInt(b.duration, 10) || 5,
      aspect_ratio: b.aspectRatio || '16:9',
      multi_prompt: b.multiPrompt || [],
    }),
    extractOutput: extractFalVideo,
  },
  kling_v26_motion_control: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'kwaivgi/kling-v2.6-motion-control',
    mode: 'queue',
    buildInput: (b) => ({
      image: firstUrl(b),
      video: b.videoUrl || b.video_url,
      character_orientation: b.characterOrientation || 'video',
      prompt: pickPrompt(b) || undefined,
      negative_prompt: b.negativePrompt || undefined,
      keep_original_sound: b.keepOriginalSound !== false,
    }),
    extractOutput: extractFalVideo,
  },
  vidu_q2_pro_fast: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'vidu/q2-pro-fast/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b) || '',
      image: firstUrl(b),
      last_image: b.lastImageUrl || b.last_image || b.endImageUrl,
      duration: parseInt(b.duration, 10) || 8,
      resolution: b.resolution || '720p',
      bgm: b.bgm !== false,
      movement_amplitude: b.movementAmplitude || 'auto',
      seed: b.seed != null ? Number(b.seed) : -1,
    }),
    extractOutput: extractFalVideo,
  },
  grok_imagine_video: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'x-ai/grok-imagine-video/image-to-video',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      images: b.imageUrls || (firstUrl(b) ? [firstUrl(b)] : []),
      duration: parseInt(b.duration, 10) || 6,
      resolution: b.resolution || '720p',
    }),
    extractOutput: extractFalVideo,
  },
  grok_video_extend: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'x-ai/grok-imagine-video/video-extend',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      video: b.videoUrl || b.video_url,
      duration: parseInt(b.duration, 10) || 6,
    }),
    extractOutput: extractFalVideo,
  },
  gemini_omni_flash_video_edit: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'google/gemini-omni-flash/video-edit',
    mode: 'queue',
    buildInput: (b) => ({
      prompt: pickPrompt(b),
      video: b.videoUrl || b.video_url,
    }),
    extractOutput: extractFalVideo,
  },
  hunyuan_avatar: {
    provider: 'wavespeed',
    mediaType: 'video',
    wavespeedPath: 'tencent/hunyuan-avatar',
    mode: 'queue',
    buildInput: (b) => ({
      audio: b.audioUrl || b.audio_url,
      image: firstUrl(b),
      prompt: pickPrompt(b) || undefined,
      resolution: b.resolution || '480p',
      seed: b.seed != null ? Number(b.seed) : undefined,
    }),
    extractOutput: extractFalVideo,
  },
  hunyuan3d: {
    provider: 'fal',
    mediaType: 'model',
    falPath: 'fal-ai/hunyuan3d/v2/multi-view',
    mode: 'sync',
    buildInput: (b) => ({
      front_image_url: b.frontImageUrl || (b.imageUrls && b.imageUrls[0]) || firstUrl(b),
      back_image_url: b.backImageUrl || (b.imageUrls && b.imageUrls[1]),
      left_image_url: b.leftImageUrl || (b.imageUrls && b.imageUrls[2]),
      output_format: 'jpeg',
    }),
    extractOutput: (d) => d?.model_mesh?.url || d?.model?.url || null,
  },
  tts_hd: {
    provider: 'openai',
    mediaType: 'audio',
    openaiKind: 'tts',
    mode: 'sync',
    buildInput: (b) => ({
      model: 'tts-1-hd',
      input: pickPrompt(b),
      voice: b.voice || 'alloy',
      speed: b.speed != null ? Number(b.speed) : 1,
    }),
    extractOutput: (d) => d?.url || d?.audio_url || null,
  },
  suno: {
    provider: 'suno',
    mediaType: 'audio',
    mode: 'queue',
    buildInput: (b) => ({
      customMode: !!b.customMode,
      instrumental: !!b.instrumental,
      model: b.sunoModel || 'V4_5ALL',
      prompt: pickPrompt(b),
      title: b.title,
      style: b.style,
    }),
    extractOutput: (d) => d?.audio_url || d?.data?.audio_url || null,
  },
};

// Aliases used by Odoo UI / older IDs
const ALIASES = {
  'flux-pro/v1.1-ultra': 'flux_pro',
  'flux-pro-v1.1-ultra': 'flux_pro',
  'openai-gpt-image-2': 'gpt_image_2_t2i',
  'wavespeed-gpt-image-2-t2i': 'gpt_image_2_t2i',
  'wavespeed-gpt-image-2-edit': 'gpt_image_2_edit',
  'gemini-25-flash-image': 'nano_banana',
  gemini_edit: 'nano_banana',
  'google-nano-banana-pro-t2i': 'google_nano_banana_pro_t2i',
  'google-nano-banana-2-t2i': 'google_nano_banana_2_t2i',
  'google-nano-banana-2-i2i': 'google_nano_banana_2_i2i',
  'google-nano-banana-pro-edit': 'nano_banana_pro',
  'google-nano-banana-2-edit': 'nano_banana_2_edit',
  'google-nano-banana-pro-edit-multi': 'nano_banana_pro',
  'hailuo-2.3': 'hailuo_23',
  'hailuo-02': 'hailuo02',
  hailuo_02: 'hailuo02',
  'hailuo-02-i2v': 'hailuo02',
  'fal-minimax-hailuo-02': 'hailuo02',
  'hailuo-23-i2v': 'hailuo_23',
  'kling-v2-master': 'kling_master',
  'kling-v26-pro': 'kling_v26_pro',
  'kling-v30-std': 'kling_v30_std_i2v',
  'kling-v30-std-i2v': 'kling_v30_std_i2v',
  kling_v30_std: 'kling_v30_std_i2v',
  'kling-o3-4k-reference-to-video': 'kling_o3_4k_reference_to_video',
  'kling-v3-turbo-std-t2v': 'kling_v3_turbo_std_t2v',
  'kling-v26-motion-control': 'kling_v26_motion_control',
  'kling-video-edit-fast': 'kling_video_edit_fast',
  'kling-video-edit': 'kling_video_edit_fast',
  'imagen4-preview-ultra': 'imagen4_ultra',
  'imagen-3.0-generate-002': 'imagen3',
  seedream: 'seedream_image',
  'veo31-fast': 'veo31_fast_i2v',
  veo31_fast: 'veo31_fast_i2v',
  'veo31-fast-i2v': 'veo31_fast_i2v',
  'veo31-fast-t2v': 'veo31_fast_t2v',
  'veo31-lite-start-end': 'veo31_lite_start_end',
  'google-veo31-fast-text-to-video': 'veo31_fast_t2v',
  google_veo31_fast_text_to_video: 'veo31_fast_t2v',
  'fal-seeddance': 'seedance',
  seed_dance: 'seedance',
  'seedance-v1': 'seedance',
  'seedance-2-fast-i2v': 'seedance_2_fast_i2v',
  'seedance-2-mini-i2v-turbo': 'seedance_2_mini_i2v_turbo',
  'seedance-2-fast-reference-to-video': 'seedance_2_fast_reference_to_video',
  'seedance-2-fast-t2v': 'seedance_2_fast_t2v',
  'vidu-q2-pro-fast': 'vidu_q2_pro_fast',
  'vidu-q2-turbo': 'vidu_q2_pro_fast',
  'grok-imagine-video': 'grok_imagine_video',
  'grok-video-extend': 'grok_video_extend',
  'gemini-omni-flash-video-edit': 'gemini_omni_flash_video_edit',
  'hunyuan-avatar': 'hunyuan_avatar',
  'hunyuan3d-multi-view': 'hunyuan3d',
  'fal-kontext': 'kontext_pro',
  kontext: 'kontext_pro',
  'fal-kontext-max-multi': 'kontext_max',
  kontext_max_multi: 'kontext_max',
  gen4_turbo: 'runway',
  'gen4.5': 'runway',
  gen4_5: 'runway',
  'sora-2': 'sora2_pro',
  'topaz-upscale-video': 'topaz_upscale',
  topaz: 'topaz_upscale',
  'clarity-upscaler': 'upscale',
  'sync-lipsync': 'sync_lipsync',
  'heygen-v3-lipsync-precision': 'heygen_v3_lipsync_precision',
  heygen_v3_lipsync: 'heygen_v3_lipsync_precision',
  'kling-libsync': 'kling_lipsync',
  'tts-hd': 'tts_hd',
  'eleven-v3': 'eleven_v3',
  chatterboxhd: 'chatterbox_hd',
  'prompt-optimizer': 'prompt_optimizer',
  'kling-elements': 'kling_elements',
  'kling-elements-create': 'kling_elements',
  'ideogram-reframe': 'ideogram_reframe',
  'qwen-image-edit-multiple-angles': 'qwen_multi_angles',
  'runway_upscale': 'runway_upscale',
  V4_5ALL: 'suno',
  'mmaudio-v2': 'mmaudio_v2',
};

function resolveModelId(model) {
  if (!model) return null;
  if (REGISTRY[model]) return model;
  if (ALIASES[model]) return ALIASES[model];
  const underscored = String(model).replace(/-/g, '_');
  if (ALIASES[underscored]) return ALIASES[underscored];
  if (REGISTRY[underscored]) return underscored;
  return null;
}

function getModelConfig(model) {
  const id = resolveModelId(model);
  if (!id || !REGISTRY[id]) return null;
  return { id, ...REGISTRY[id] };
}

/** Alias used by Odoo-style fal proxy routes */
const getModelDef = getModelConfig;

function listRegisteredModels() {
  return Object.keys(REGISTRY);
}

module.exports = {
  REGISTRY,
  ALIASES,
  resolveModelId,
  getModelConfig,
  getModelDef,
  listRegisteredModels,
  extractFalImage,
  extractFalVideo,
};
