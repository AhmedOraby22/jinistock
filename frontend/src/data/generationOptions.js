/**
 * Generation types + models aligned with Odoo leonardo-form / modelRegistry.
 * Each option exposes `id` (used by the form) and `value` (alias).
 */

export const generationTypes = [
  { id: "image_to_video", value: "image_to_video", label: "Image to Video" },
  { id: "text_to_image", value: "text_to_image", label: "Text to Image" },
  { id: "image_to_image", value: "image_to_image", label: "Image to Image" },
  { id: "text_to_video", value: "text_to_video", label: "Text to Video" },
  { id: "video_to_video", value: "video_to_video", label: "Video to Video" },
  { id: "audio_to_video", value: "audio_to_video", label: "Audio to Video" }
];

export const modelsByType = {
  image_to_video: [
    { id: "hailuo_23", value: "hailuo_23", label: "Hailuo 2.3" },
    { id: "hailuo02", value: "hailuo02", label: "Hailuo 02" },
    { id: "vidu_q2_pro_fast", value: "vidu_q2_pro_fast", label: "Vidu Q2 Pro Fast" },
    { id: "kling_master", value: "kling_master", label: "Kling 2.0 Master" },
    { id: "kling_v26_pro", value: "kling_v26_pro", label: "Kling V2.6 Pro" },
    { id: "kling_v30_std_i2v", value: "kling_v30_std_i2v", label: "Kling V3.0 Std" },
    { id: "veo31_fast_i2v", value: "veo31_fast_i2v", label: "Google Veo 3.1 Fast" },
    { id: "veo31_lite_start_end", value: "veo31_lite_start_end", label: "Veo 3.1 Lite Start-End" },
    { id: "seedance", value: "seedance", label: "Seedance / SeedDance" },
    { id: "seedance_2_fast_i2v", value: "seedance_2_fast_i2v", label: "Seedance 2.0 Fast I2V" },
    { id: "seedance_2_mini_i2v_turbo", value: "seedance_2_mini_i2v_turbo", label: "Seedance 2.0 Mini Turbo" },
    { id: "gen4_turbo", value: "gen4_turbo", label: "Runway Gen4 Turbo" },
    { id: "gen4_5", value: "gen4_5", label: "Runway Gen4.5" },
    { id: "gen4_aleph", value: "gen4_aleph", label: "Runway Gen-4 Aleph" },
    { id: "act_two", value: "act_two", label: "Runway Act-Two" },
    { id: "sora2_pro", value: "sora2_pro", label: "Sora 2 Pro" },
    { id: "grok_imagine_video", value: "grok_imagine_video", label: "Grok Imagine Video" }
  ],
  text_to_image: [
    { id: "flux_pro", value: "flux_pro", label: "Flux Pro Ultra" },
    { id: "flux_realism", value: "flux_realism", label: "Flux Realism" },
    { id: "imagen4_ultra", value: "imagen4_ultra", label: "Google Imagen 4 Ultra" },
    { id: "google_nano_banana_pro_t2i", value: "google_nano_banana_pro_t2i", label: "Nano Banana Pro T2I" },
    { id: "google_nano_banana_2_t2i", value: "google_nano_banana_2_t2i", label: "Nano Banana 2 T2I" }
  ],
  image_to_image: [
    { id: "nano_banana", value: "nano_banana", label: "Nano Banana" },
    { id: "nano_banana_pro", value: "nano_banana_pro", label: "Nano Banana Pro Edit" },
    { id: "nano_banana_2_edit", value: "nano_banana_2_edit", label: "Nano Banana 2 Edit" },
    { id: "kontext_pro", value: "kontext_pro", label: "Flux Kontext Pro" },
    { id: "kontext_max", value: "kontext_max", label: "Flux Kontext Max" },
    { id: "upscale", value: "upscale", label: "Clarity Upscaler" },
    { id: "ideogram_reframe", value: "ideogram_reframe", label: "Ideogram Reframe" },
    { id: "seedream_image", value: "seedream_image", label: "Seedream Edit" },
    { id: "qwen_multi_angles", value: "qwen_multi_angles", label: "Qwen Multi Angles" }
  ],
  text_to_video: [
    { id: "veo3", value: "veo3", label: "Veo 3" },
    { id: "veo31_fast_t2v", value: "veo31_fast_t2v", label: "Veo 3.1 Fast T2V" },
    { id: "google_veo31_fast_text_to_video", value: "google_veo31_fast_text_to_video", label: "Google Veo 3.1 Fast T2V" },
    { id: "seedance_2_fast_t2v", value: "seedance_2_fast_t2v", label: "Seedance 2.0 Fast T2V" },
    { id: "kling_v3_turbo_std_t2v", value: "kling_v3_turbo_std_t2v", label: "Kling V3 Turbo Std T2V" },
    { id: "hailuo02", value: "hailuo02", label: "Hailuo 02 T2V" }
  ],
  video_to_video: [
    { id: "topaz", value: "topaz", label: "Topaz Upscale Video" },
    { id: "runway_upscale", value: "runway_upscale", label: "Runway Upscale" },
    { id: "kling_video_edit_fast", value: "kling_video_edit_fast", label: "Kling Video O1" },
    { id: "kling_v26_motion_control", value: "kling_v26_motion_control", label: "Kling V2.6 Motion Control" },
    { id: "grok_video_extend", value: "grok_video_extend", label: "Grok Video Extend" },
    { id: "gemini_omni_flash_video_edit", value: "gemini_omni_flash_video_edit", label: "Gemini Omni Flash Video Edit" },
    { id: "mmaudio_v2", value: "mmaudio_v2", label: "MMAudio V2" }
  ],
  audio_to_video: [
    { id: "sync_lipsync", value: "sync_lipsync", label: "Sync Lipsync" },
    { id: "heygen_v3_lipsync_precision", value: "heygen_v3_lipsync_precision", label: "HeyGen V3 Lipsync" },
    { id: "hunyuan_avatar", value: "hunyuan_avatar", label: "Hunyuan Avatar" }
  ]
};

/** Back-compat aliases for older imports */
export const GENERATION_TYPES = generationTypes;
export const MODELS_BY_TYPE = modelsByType;
