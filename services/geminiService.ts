// Removed @google/genai SDK import to fix Vercel client-side issues
// Using direct REST API calls instead

// SMART KEY RETRIEVAL
const getApiKey = () => {
  let key = '';

  // 1. Try process.env (Standard/CRA/Next)
  try {
    if (process.env.REACT_APP_API_KEY) key = process.env.REACT_APP_API_KEY;
    else if (process.env.VITE_API_KEY) key = process.env.VITE_API_KEY;
    else if (process.env.NEXT_PUBLIC_API_KEY) key = process.env.NEXT_PUBLIC_API_KEY;
    else if (process.env.API_KEY) key = process.env.API_KEY;
  } catch (e) {}

  // 2. Try import.meta.env (Vite specific)
  if (!key) {
    try {
      // @ts-ignore
      if (import.meta && import.meta.env) {
        // @ts-ignore
        if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
        // @ts-ignore
        else if (import.meta.env.REACT_APP_API_KEY) key = import.meta.env.REACT_APP_API_KEY;
        // @ts-ignore
        else if (import.meta.env.API_KEY) key = import.meta.env.API_KEY;
      }
    } catch (e) {}
  }

  return key;
};

const API_KEY = getApiKey();
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Log warning only, don't crash immediately. Crash inside functions if needed.
if (!API_KEY) {
  console.warn("Gemini API Key not found in environment. Please ensure VITE_API_KEY or REACT_APP_API_KEY is set in Vercel.");
}

export const generateTextResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  prompt: string,
  imageParts?: { inlineData: { data: string; mimeType: string } }[],
  modelName: string = 'gemini-2.5-flash',
  systemInstruction?: string
) => {
  if (!API_KEY) throw new Error("API Key missing. In Vercel, please create a variable named 'VITE_API_KEY' with your key.");

  try {
    // Construct the payload manually for REST API
    const contents = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts.filter(p => p.text && p.text.trim() !== '')
    })).filter(msg => msg.parts.length > 0);

    const currentParts: any[] = [];
    if (imageParts) {
      imageParts.forEach(part => {
        currentParts.push({
          inlineData: {
            mimeType: part.inlineData.mimeType,
            data: part.inlineData.data
          }
        });
      });
    }
    currentParts.push({ text: prompt });
    contents.push({ role: 'user', parts: currentParts });

    const body: any = {
      contents,
      generationConfig: {
        maxOutputTokens: 500
      }
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(`${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

  } catch (error) {
    console.error("Gemini REST Text Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string) => {
  if (!API_KEY) throw new Error("API Key missing. In Vercel, please create a variable named 'VITE_API_KEY' with your key.");
  
  try {
    // UPDATED: Use gemini-2.5-flash-image via generateContent instead of imagen predict endpoint
    // This is more reliable for standard API keys
    const response = await fetch(`${BASE_URL}/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Image generation failed.");
    }

    const data = await response.json();
    
    // The API returns the image in the parts array with inlineData (base64)
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);

    if (!imagePart) {
      // Check if the model returned text refusal instead
      const textPart = parts.find((p: any) => p.text);
      if (textPart) throw new Error(`Model refused: ${textPart.text}`);
      throw new Error("No image data returned from API");
    }

    const base64Image = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    
    return `data:${mimeType};base64,${base64Image}`;

  } catch (error) {
    console.error("Gemini REST Image Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Fenrir') => {
  if (!API_KEY) throw new Error("API Key missing");

  try {
    const body = {
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    };

    const response = await fetch(`${BASE_URL}/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "TTS generation failed");
    }

    const data = await response.json();
    const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioBase64) throw new Error("No audio content returned");
    
    return audioBase64;
  } catch (error) {
    console.error("Gemini REST TTS Error:", error);
    throw error;
  }
};