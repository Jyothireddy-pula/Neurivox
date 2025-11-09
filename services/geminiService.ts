// services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Chat as GenAIChat, Type, Modality } from "@google/genai";
import { GroundingChunk, ChatMessage, ChatMessageType, ChatSession, ApiResponseFormat, DebugLogEntry, DebugLogLevel } from '../types';

interface GenerateContentParams {
  model: string;
  prompt?: string; // Made optional for image understanding cases
  contents?: string | { parts: any[] }; // Allow flexible contents for multi-modal
  systemInstruction?: string;
  useGoogleSearch?: boolean;
  responseMimeType?: string; // Added for structured output
  responseSchema?: ApiResponseFormat; // Added for structured output
  onLogDebug?: (entry: DebugLogEntry) => void; // Callback for logging
}

interface GenerateImageParams {
  model: string;
  prompt?: string; // Made optional for image understanding cases
  numberOfImages?: number;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imagePart?: { inlineData: { mimeType: string; data: string } }; // For image understanding with specific models
}

interface GenerateContentChatParams {
  model: string;
  history: ChatMessage[];
  message: string;
  systemInstruction?: string;
  onLogDebug?: (entry: DebugLogEntry) => void; // Callback for logging
}

interface GenerateSpeechParams {
  model: string;
  text: string;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'; // Supported voices
  onLogDebug?: (entry: DebugLogEntry) => void;
}

/**
 * Initializes a new GoogleGenAI instance.
 * CRITICAL: This MUST be called right before making an API call to ensure the latest API key is used.
 * Prioritizes a dynamically provided API key, then localStorage, then process.env.API_KEY.
 */
const getGeminiClient = (dynamicApiKey?: string): GoogleGenAI => {
  const apiKeyToUse = dynamicApiKey || localStorage.getItem('apiKey_gemini') || process.env.API_KEY;

  if (!apiKeyToUse) {
    throw new Error("Gemini API Key is not configured. Please ensure your API key is set in the environment or in the API Configurator.");
  }
  return new GoogleGenAI({ apiKey: apiKeyToUse });
};

/**
 * Validates the API key by making a small, low-cost API call.
 */
export async function validateApiKey(dynamicApiKey?: string, onLogDebug?: (entry: DebugLogEntry) => void): Promise<boolean> {
  let ai;
  try {
    ai = getGeminiClient(dynamicApiKey);
  } catch (error: any) {
    // If getGeminiClient throws, it means no key was found at all.
    const errorMessage = error.message || "API Key is not configured.";
    onLogDebug?.({
      id: `api-key-validation-get-client-fail-${Date.now()}`,
      timestamp: new Date(),
      level: DebugLogLevel.API_KEY_MISSING,
      message: `API key validation failed: ${errorMessage}`,
      details: { status: "not_configured" },
    });
    throw new Error(errorMessage);
  }
  
  const debugId = `api-key-validation-${Date.now()}`;
  const startTime = performance.now();

  try {
    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_CALL,
      message: `Attempting to validate API key with a test API call...`,
      details: {},
    });

    // Make a simple API call to validate the key
    await ai.models.generateContent({
      model: "gemini-2.5-flash", // A common and cheap model for a quick check
      contents: "hello",
      config: {
        maxOutputTokens: 1, // Keep response very small for efficiency
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed
      },
    });

    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.INFO,
      message: `API key validation succeeded (latency: ${(performance.now() - startTime).toFixed(2)}ms).`,
      details: { status: "valid" },
    });
    return true;
  } catch (error: any) {
    let errorMessage = `API key validation failed: ${error.message || String(error)}`;
    const errorString = String(error).toLowerCase();

    // Check for RESOURCE_EXHAUSTED specifically
    if (error.status === 429 && errorString.includes("resource_exhausted")) {
      errorMessage = `API Key validation failed: You have exceeded your current quota. Please check your Google AI Studio plan and billing details. For more information, visit: https://ai.google.dev/gemini-api/docs/billing`;
    } else if (errorString.includes("api key not valid") || errorString.includes("invalid api key")) {
      errorMessage = `API Key validation failed: The provided API key is invalid. Please double-check your key.`;
    } else if (errorString.includes("requested entity was not found")) {
      // This can happen if the API key is not active or improperly configured, especially in AI Studio
      errorMessage = `API Key validation failed: Requested entity was not found. This might indicate an invalid or improperly selected API key.`;
    } else if (errorString.includes("api key is not configured")) {
      errorMessage = `API Key is not configured. Please ensure your API key is set in the environment or selected via AI Studio.`;
    }

    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.ERROR,
      message: `API key validation failed (latency: ${(performance.now() - startTime).toFixed(2)}ms).`,
      details: { error: errorMessage, status: "invalid" },
    });
    console.error("API Key validation failed:", error);
    // Re-throw the specific error message for ApiConfigurator to display
    throw new Error(errorMessage);
  }
}


/**
 * Generates text content using the Gemini API.
 */
export async function generateTextContent(params: GenerateContentParams): Promise<{ text: string; groundingChunks: GroundingChunk[] }> {
  const { model, prompt, contents, systemInstruction, useGoogleSearch, responseMimeType, responseSchema, onLogDebug } = params;
  const ai = getGeminiClient();

  const debugId = `text-gen-${Date.now()}`;
  const startTime = performance.now();

  try {
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (useGoogleSearch) {
      config.tools = [{ googleSearch: {} }];
    }
    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }
    if (responseSchema) {
      // Convert local ApiResponseFormat to GenAI's schema format
      const convertSchema = (schema: ApiResponseFormat): any => {
        const genaiSchema: any = { type: schema.type };
        if (schema.description) genaiSchema.description = schema.description;
        if (schema.properties) {
          genaiSchema.properties = Object.fromEntries(
            Object.entries(schema.properties).map(([key, value]) => [key, convertSchema(value)])
          );
        }
        if (schema.items) {
          genaiSchema.items = convertSchema(schema.items);
        }
        if (schema.required) genaiSchema.required = schema.required;
        if (schema.propertyOrdering) genaiSchema.propertyOrdering = schema.propertyOrdering;
        return genaiSchema;
      };
      config.responseSchema = convertSchema(responseSchema);
    }


    const generateParams: GenerateContentParameters = {
      model: model,
      contents: contents || prompt, // Use contents if provided, else fallback to prompt
    };

    if (Object.keys(config).length > 0) {
      generateParams.config = config;
    }

    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_CALL,
      message: `Calling generateContent for model: ${model}`,
      details: { prompt: prompt || contents, systemInstruction, config },
    });

    const response: GenerateContentResponse = await ai.models.generateContent(generateParams);

    const text = response.text;
    const groundingChunks: GroundingChunk[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];

    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_RESPONSE,
      message: `generateContent succeeded (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { response: text, groundingChunks },
    });

    return { text, groundingChunks };

  } catch (error: any) {
    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.ERROR,
      message: `generateContent failed (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { error: error.message || String(error) },
    });
    console.error("Error generating text content:", error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates content in a chat-like manner, maintaining history.
 */
export async function generateContentWithChat(params: GenerateContentChatParams): Promise<GenerateContentResponse> {
  const { model, history, message, systemInstruction, onLogDebug } = params;
  const ai = getGeminiClient();

  const debugId = `chat-gen-${Date.now()}`;
  const startTime = performance.now();

  // Convert local ChatMessage history to GenAI's Content format
  const contents = history.map(msg => {
    switch (msg.type) {
      case ChatMessageType.USER:
        return { role: 'user', parts: [{ text: msg.content }] };
      case ChatMessageType.MODEL:
        return { role: 'model', parts: [{ text: msg.content }] };
      // Handle tool calls/responses if needed in the future
      default:
        return { role: 'user', parts: [{ text: msg.content }] }; // Fallback
    }
  });

  onLogDebug?.({
    id: debugId,
    timestamp: new Date(),
    level: DebugLogLevel.API_CALL,
    message: `Calling chat.sendMessage for model: ${model}`,
    details: { message, history: contents, systemInstruction },
  });

  try {
    // Create a chat instance (GenAI SDK's Chat type)
    const chat: GenAIChat = ai.chats.create({
      model: model,
      config: systemInstruction ? { systemInstruction } : undefined,
      history: contents as any[], // History is only for context, not part of current turn
    });

    // Send the current message
    const response = await chat.sendMessage({ message: message });

    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_RESPONSE,
      message: `chat.sendMessage succeeded (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { response: response.text },
    });

    return response;
  } catch (error: any) {
    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.ERROR,
      message: `chat.sendMessage failed (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { error: error.message || String(error) },
    });
    console.error("Error generating chat content:", error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`);
  }
}


/**
 * Generates images using the Gemini API or uses multi-modal for image understanding.
 */
export async function generateImages(params: GenerateImageParams): Promise<string[] | GenerateContentResponse> {
  const { model, prompt, numberOfImages = 1, aspectRatio = '1:1', imagePart } = params;
  const ai = getGeminiClient();

  try {
    if (model === 'imagen-4.0-generate-001') {
      const response = await ai.models.generateImages({
        model: model,
        prompt: prompt || 'a picture', // provide a default prompt if none is given
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });
      return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    } else if (model === 'gemini-2.5-flash-image') {
      // For gemini-2.5-flash-image (nano banana), it handles both image generation and understanding
      const contentsParts: any[] = [];
      if (imagePart) {
        contentsParts.push(imagePart);
      }
      if (prompt) {
        contentsParts.push({ text: prompt });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: {
          parts: contentsParts,
        },
        config: {
          responseModalities: imagePart ? undefined : [Modality.IMAGE], // Only request image modality if no input image is provided
        },
      });

      // If it's an image generation request (no input image, but image modality requested), return image URLs
      if (!imagePart && response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const imageUrls: string[] = [];
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrls.push(`data:image/png;base64,${part.inlineData.data}`);
          }
        }
        return imageUrls;
      }
      // Otherwise, return the full GenerateContentResponse for text/multi-modal output
      return response;

    } else {
      throw new Error(`Unsupported image generation model: ${model}`);
    }
  } catch (error) {
    console.error("Error generating image content:", error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates speech from text using the Gemini TTS API.
 */
export async function generateSpeech(params: GenerateSpeechParams): Promise<string> {
  const { model, text, voiceName = 'Kore', onLogDebug } = params;
  const ai = getGeminiClient();

  const debugId = `tts-gen-${Date.now()}`;
  const startTime = performance.now();

  try {
    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_CALL,
      message: `Calling generateContent for speech generation (TTS) with model: ${model}`,
      details: { text: text.substring(0, 100), voiceName },
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from TTS API.");
    }

    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_RESPONSE,
      message: `Speech generation succeeded (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { audioLength: base64Audio.length, voiceName },
    });

    return base64Audio;
  } catch (error: any) {
    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.ERROR,
      message: `Speech generation failed (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { error: error.message || String(error), text: text.substring(0, 100) },
    });
    console.error("Error generating speech:", error);
    throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : String(error)}`);
  }
}


/**
 * Detects the language of the given text using the Gemini API.
 */
export async function detectLanguage(text: string, onLogDebug?: (entry: DebugLogEntry) => void): Promise<string> {
  const ai = getGeminiClient();
  const debugId = `lang-detect-${Date.now()}`;
  const startTime = performance.now();

  try {
    const prompt = `Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., "en" for English, "fr" for French). If multiple languages are detected, provide the primary one.
    Text: "${text}"`;
    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_CALL,
      message: `Calling generateContent for language detection`,
      details: { prompt, model: "gemini-2.5-flash" },
    });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using a general text model for language detection
      contents: prompt,
      config: {
        maxOutputTokens: 10, // Limit response to just the language code
      }
    });
    const languageCode = response.text.trim().toLowerCase();

    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.API_RESPONSE,
      message: `Language detection succeeded (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { detectedLanguage: languageCode },
    });

    // Basic validation for common ISO 639-1 codes
    if (languageCode.length === 2 && /^[a-z]{2}$/.test(languageCode)) {
      return languageCode;
    }
    return 'unknown'; // Fallback if detection is not a valid 2-letter code
  } catch (error: any) {
    onLogDebug?.({
      id: debugId,
      timestamp: new Date(),
      level: DebugLogLevel.ERROR,
      message: `Language detection failed (latency: ${(performance.now() - startTime).toFixed(2)}ms)`,
      details: { error: error.message || String(error) },
    });
    console.error("Error detecting language:", error);
    return 'unknown';
  }
}