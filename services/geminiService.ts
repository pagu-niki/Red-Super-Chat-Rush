import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedScenario } from '../types';
import { FALLBACK_SCENARIO } from '../constants';

export const generateStreamScenario = async (customName?: string): Promise<GeneratedScenario> => {
  const apiKey = process.env.API_KEY;
  
  // Helper to ensure custom name is applied if provided
  const applyCustomName = (scenario: GeneratedScenario) => {
    if (customName && customName.trim() !== "") {
      return { ...scenario, streamerName: customName };
    }
    return scenario;
  };

  if (!apiKey) {
    console.warn("No API Key found, using fallback scenario.");
    return applyCustomName(FALLBACK_SCENARIO);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = "架空のゲーム実況配信のシナリオを作成してください。配信者名、キャッチーな配信タイトル（VTuber風）、視聴者のユーザー名20個、一般的な短いチャットメッセージ20個（ネットスラング、リアクションなど）を含めてください。全て日本語で出力してください。";

    if (customName && customName.trim() !== "") {
      prompt = `架空のゲーム実況配信のシナリオを作成してください。配信者名は必ず「${customName}」にしてください。それに合わせたキャッチーな配信タイトル（VTuber風）、視聴者のユーザー名20個、一般的な短いチャットメッセージ20個（ネットスラング、リアクションなど）を含めてください。全て日本語で出力してください。`;
    }
    
    // We request a JSON schema to ensure strict typing
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            streamerName: { type: Type.STRING },
            streamTitle: { type: Type.STRING },
            viewers: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            comments: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["streamerName", "streamTitle", "viewers", "comments"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    const data = JSON.parse(text) as GeneratedScenario;
    return applyCustomName(data);
  } catch (error) {
    console.error("Gemini API failed:", error);
    return applyCustomName(FALLBACK_SCENARIO);
  }
};
