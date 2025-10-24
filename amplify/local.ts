// localTest.ts
import { Type, GoogleGenAI } from "@google/genai";
// If the split import is necessary:
// import { Type } from "@google/genai"; 
// import { GoogleGenAI } from "@google/genai/node";

// Assuming 'Type' comes from a library like @sinclair/typebox or is a local definition
// Since the prompt doesn't specify where Type comes from, we define a simple placeholder
// and assume it's correctly imported/defined in the real project.
// 1. Import the official 'Type' enumeration for the schema definitions.

export interface HighlightedWord {
  word: string;
  translation: string;
  examples: string[];
}

export interface SentencePart {
  text: string;
  highlighted_words: HighlightedWord[];
}

export interface Sentence {
  id: string;
  source: SentencePart;
  target: SentencePart;
}

export interface ConversationScenario {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  sentences: Sentence[];
}


export const scenarioSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        difficulty_level: { type: Type.STRING },
        sentences: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    source: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            highlighted_words: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        word: { type: Type.STRING },
                                        translation: { type: Type.STRING },
                                        examples: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    }
                                }
                            }
                        }
                    },
                    target: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            highlighted_words: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        word: { type: Type.STRING },
                                        translation: { type: Type.STRING },
                                        examples: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

// ⚠️ CRITICAL: Replace with your actual key
const GEMINI_API_KEY = "AIzaSyBJbQGrwNynuijqLA7y7InQPUYIvemRo8M";

// --- Mock the External Dependencies ---
// You don't need DynamoDB for the Gemini test, so we can ignore saveScenario.

// Import your core logic

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Define the exact input event structure
const mockInput = {
    topic: "Sustainability in Urban Planning",
    difficulty: "Intermediate",
    sourceLang: "English",
    targetLang: "German"
    // ... any other required input fields
};

async function testGeminiCall() {
    const { topic, difficulty, sourceLang, targetLang } = mockInput;
    const prompt = `Generate a language learning conversation scenario...`; // Your full prompt here

    console.log("--- Starting Local Gemini Test ---");
    console.log("Using Key:", GEMINI_API_KEY ? "Set" : "NOT SET");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: scenarioSchema // Your schema object
            },
        });

        // Log the full raw response object for deep inspection
        console.log("SUCCESS: Full Gemini Response:", JSON.stringify(response, null, 2));

        // Check for empty text and re-create the error logic
      let rawText: string | undefined;

    // 💡 Lambda/Node Environment Parsing: Check the deep structure first.
    // This path is reliable for the Node SDK's full response object.
    const deepText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 💡 Frontend/Browser Environment Parsing (Fallback/Simpler Check):
    // Use this as a fallback for maximum compatibility, although deepText should be primary.
    const topLevelText = (response as any).text; 

    // Use the deep text if it exists, otherwise fall back to the top-level text.
    rawText = deepText || topLevelText;
    
    if (!rawText || typeof rawText !== "string") {
        throw new Error("Failed to extract raw text from Gemini response (text was empty or not found).");
    }

    let scenario: ConversationScenario;
    try {
        // 2. JSON Cleanup (Still recommended, even if the model is usually clean)
        const cleanedText = rawText
            .trim()
            .replace(/^```json\s*/, '') 
            .replace(/```\s*$/, '');
            
        scenario = JSON.parse(cleanedText) as ConversationScenario;

    } catch (err) {
        console.error("JSON Parsing Error:", (err as Error).message, "Raw excerpt:", rawText.substring(0, 200) + '...');
        throw new Error("Failed to parse Gemini response as JSON.");
    }
// return the parsed scenario object
console.log("✅ Parsed Scenario:", JSON.stringify(scenario, null, 2));

    } catch (error) {
        // ⚠️ This will print the detailed SDK error (e.g., Auth, Invalid Argument, 400 error)
        console.error("FAILED: Detailed Gemini SDK Error:", error);
    }
}

testGeminiCall();