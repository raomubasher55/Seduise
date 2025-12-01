import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Using Google Gemini API with OpenAI compatibility
const geminiAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
});

// Validate API key on startup
if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.error("❌ ERROR: No Google Gemini API key found in environment variables!");
  console.error("Please set GEMINI_API_KEY or GOOGLE_API_KEY in your .env file");
} else {
  console.log("✅ Google Gemini API key loaded successfully");
}


const stream = false; // Change to `true` if you want streaming responses

interface StoryGenerationOptions {
  title?: string; // Add title as an optional parameter
  timePeriod: string;
  location: string;
  atmosphere: string;
  protagonistGender: string;
  partnerGender: string;
  relationship: string;
  writingTone: string;
  length: number;
  // New fields from the tabbed UI
  settingDescription?: string;
  protagonistDescription?: string;
  loveInterestDescription?: string;
  explicitLevel?: number;
}



export async function generateStory(options: StoryGenerationOptions): Promise<{
  title: string;
  content: string;
}> {
  const {
    title,
    timePeriod,
    location,
    atmosphere,
    protagonistGender,
    partnerGender,
    relationship,
    writingTone,
    length,
    settingDescription,
    protagonistDescription,
    loveInterestDescription,
    explicitLevel,
  } = options;

  // --- Token and Word Count Logic (OPTIMIZED for Gemini 2.5 Flash) ---
  let maxTokens = 0;
  let targetWordCount = "";

  if (length === 2) {
    maxTokens = 1500;  // Increased for short stories
    targetWordCount = "Write a short story of approximately 300-400 words.";
  } else if (length === 3) {
    maxTokens = 2500;  // Increased for medium stories
    targetWordCount = "Write a medium-length story of approximately 700-900 words.";
  } else if (length === 4) {
    maxTokens = 4500;  // Increased for long stories
    targetWordCount = "Write a longer story of approximately 1200-1500 words.";
  } else {
    maxTokens = 1500;
    targetWordCount = "Write a short story of approximately 300-400 words.";
  }
  console.log(`Story length setting: ${length}, calculated token limit: ${maxTokens}`);

  // --- Prompt Building Logic ---
  const intensityDescription = explicitLevel !== undefined
    ? `Set the romantic intensity to ${explicitLevel}% - higher means more passionate and detailed.`
    : "Keep the content moderately passionate.";

  const titlePrompt = title
    ? `The story must directly involve the central concept of "${title}" as its primary focus. The story's main character, plot, theme, and events MUST literally be about "${title}".`
    : "Generate an appropriate title for the story.";

  const settingPrompt = settingDescription
    ? `Setting description: ${settingDescription}\nIncorporate these specific setting details into your narrative.` : "";
  const protagonistPrompt = protagonistDescription
    ? `Protagonist description: ${protagonistDescription}\nEnsure the protagonist has these specific characteristics.` : "";
  const loveInterestPrompt = loveInterestDescription
    ? `Love interest description: ${loveInterestDescription}\nIncorporate these specific details about the love interest.` : "";

  // System Instruction with softer language
  const systemPrompt = `You must return ONLY valid JSON. No explanations, no title suggestions, no additional text.

Create a romantic story with these parameters:
- Time Period: ${timePeriod}
- Location: ${location}
- Atmosphere: ${atmosphere}
- Protagonist: ${protagonistGender}
- Partner: ${partnerGender}
- Relationship: ${relationship}
- Tone: ${writingTone}
- ${targetWordCount}
- ${intensityDescription}
- ${titlePrompt}

${settingPrompt}
${protagonistPrompt}
${loveInterestPrompt}

Create an engaging romantic narrative with emotional depth, vivid descriptions, dialogue, and intimate moments appropriate to the intensity level.

MANDATORY JSON FORMAT (nothing else):
{
  "title": "Story Title Here",
  "content": "Complete story content with vivid descriptions, dialogue, and romantic elements. End with cliffhanger."
}

DO NOT include title options, explanations, or any text outside the JSON object.`;

  const userPrompt = "Create the romantic story now. Return ONLY the JSON object with title and content. No explanations, no title suggestions, no additional text.";

  try {
    
    // FIX: ALL safety categories configured
    const safetySettings = [
        {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH", 
        },
        {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH", 
        },
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH", 
        },
        {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH", 
        },
    ];

    console.log("Generating story with Google Gemini model...");

    // --- API Call ---
    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        safetySettings: safetySettings,
      }
    });

    console.log("Gemini API response received, checking content...");

    let responseText = response.text;
    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;

    // Log finish reason for debugging
    if (finishReason) {
      console.log("Finish Reason:", finishReason);
    }

    // --- Handle Safety Block or Empty Response with detailed logging ---
    if (!responseText || responseText.trim().length === 0) {
      const safetyRatings = candidate?.safetyRatings;

      console.error("Content issue detected!");
      console.error("Finish Reason:", finishReason);
      console.error("Safety Ratings:", JSON.stringify(safetyRatings, null, 2));

      // MAX_TOKENS with no text is an error
      if (finishReason === "MAX_TOKENS") {
        throw new Error(`Story generation failed due to token limits. Please try a shorter story or reduce complexity.`);
      }

      throw new Error(`Story generation blocked by safety filters. Reason: ${finishReason}. Try reducing explicit level or changing topic.`);
    }

    // If we got content but hit MAX_TOKENS, log warning but continue (we have partial response)
    if (finishReason === "MAX_TOKENS") {
      console.warn("⚠️  Warning: Story generation hit MAX_TOKENS limit but we have content. Proceeding with available response.");
    }

    console.log("Raw Response (first 500 chars):", responseText.substring(0, 500) + '...');

    // Clean up markdown code blocks - MUST remove opening AND closing backticks
    responseText = responseText
  	  .replace(/```json\s*/gi, '') 
  	  .replace(/```\s*/g, '') 
  	  .trim();
    
    // Ensure we have complete JSON - check for closing brace
    if (!responseText.endsWith('}')) {
      console.warn("Response appears truncated, attempting to find last complete content...");
      
      // Find the last occurrence of closing quote and brace pattern
      const lastValidJson = responseText.lastIndexOf('"}');
      if (lastValidJson !== -1) {
        responseText = responseText.substring(0, lastValidJson + 2) + '\n}';
        console.log("Reconstructed JSON with proper closing");
      }
    }

    // More robust content extraction - handle ANY unterminated strings
    try {
        // Use non-greedy match with dotall flag for the ENTIRE content value
        const contentMatch = responseText.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s);

        if (contentMatch && contentMatch[1]) {
            let cleanedContent = contentMatch[1];
            
            // Only escape unescaped quotes (not already escaped)
            cleanedContent = cleanedContent.replace(/(?<!\\)"/g, '\\"');

            // Replace in the original response
            responseText = responseText.replace(
                contentMatch[0], 
                `"content": "${cleanedContent}"`
            );
        }

    } catch (cleanupError) {
        console.warn("Content cleanup warning:", cleanupError);
    }
    
    // Primary JSON parsing
    try {
        const result = JSON.parse(responseText);

        return {
          title: title || result.title || "Untitled Story",
          content: result.content || "Story generation failed"
        };
    } catch (jsonError) {
        console.error("JSON parse error, using regex fallback:", jsonError);

        // Fallback: Extract everything between "content": " and the last "
        const contentMatch = responseText.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)/s); 
        const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/);

        let extractedContent = "Story generation failed.";
        
        if (contentMatch && contentMatch[1]) {
          extractedContent = contentMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t') 
            .replace(/\\r/g, '\r')
            .replace(/\\\\/g, '\\')
            .trim();
            
          // If content ends abruptly, add ellipsis
          if (!extractedContent.endsWith('.') && !extractedContent.endsWith('!') && !extractedContent.endsWith('?')) {
            extractedContent += '...';
          }
        }

        const extractedTitle = titleMatch ? titleMatch[1].trim() : "Untitled Story";

        console.log("Successfully extracted via regex fallback");

        return {
          title: title || extractedTitle,
          content: extractedContent
        };
    }

  } catch (error) {
    console.error("Story generation error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate story. Please try again.");
  }
}

// export async function generateStory(options: StoryGenerationOptions): Promise<{
//   title: string;
//   content: string;
// }> {
//   const {
//     title,
//     timePeriod,
//     location,
//     atmosphere,
//     protagonistGender,
//     partnerGender,
//     relationship,
//     writingTone,
//     length,
//     settingDescription,
//     protagonistDescription,
//     loveInterestDescription,
//     explicitLevel,
//   } = options;

//   // Calculate max tokens and word count based on story length for more consistent audio duration
//   // Short (2): 2-3 minutes audio (approximately 1200 tokens, ~300-400 words)
//   // Medium (3): 4-5 minutes audio (approximately 2400 tokens, ~700-900 words)
//   // Long (4): 8-10 minutes audio (approximately 4800 tokens, ~1500-1800 words)

//   let maxTokens = 0;
//   let targetWordCount = "";

//   if (length === 2) { // Short
//     maxTokens = 1200;
//     targetWordCount = "Write a short story of approximately 300-400 words.";
//   } else if (length === 3) { // Medium
//     maxTokens = 2400;
//     targetWordCount = "Write a medium-length story of approximately 700-900 words.";
//   } else if (length === 4) { // Long
//     maxTokens = 4800;
//     targetWordCount = "Write a longer story of approximately 1500-1800 words.";
//   } else {
//     // Default to short if somehow an invalid length is provided
//     maxTokens = 1200;
//     targetWordCount = "Write a short story of approximately 300-400 words.";
//   }

//   console.log(`Story length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);

//   // Determine explicit content level based on the slider value
//   const explicitLevelDescription = explicitLevel !== undefined
//     ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.`
//     : "Keep the content moderately explicit unless otherwise specified.";

//   const titlePrompt = title
//     ? `The story must directly involve the central concept of "${title}" as its primary focus. The story's main character, plot, theme, and events MUST literally be about "${title}" - for example, if the title is "Greedy Dog", the story MUST feature a dog that is greedy as a central character or theme. If the title is a person's name, they must be the main character. If the title is an object, that object must be central to the story. Make the title the most prominent element of the story.`
//     : "Generate an appropriate title for the story.";

//   // Add detailed descriptions if provided
//   const settingPrompt = settingDescription
//     ? `Setting description: ${settingDescription}\nIncorporate these specific setting details into your narrative.`
//     : "";

//   const protagonistPrompt = protagonistDescription
//     ? `Protagonist description: ${protagonistDescription}\nEnsure the protagonist has these specific characteristics.`
//     : "";

//   const loveInterestPrompt = loveInterestDescription
//     ? `Love interest description: ${loveInterestDescription}\nIncorporate these specific details about the love interest.`
//     : "";

//   const systemPrompt = `You must return ONLY valid JSON. No explanations, no title suggestions, no additional text.

// Create an erotic story with these parameters:
// - Time Period: ${timePeriod}
// - Location: ${location}
// - Atmosphere: ${atmosphere}
// - Protagonist: ${protagonistGender}
// - Partner: ${partnerGender}
// - Relationship: ${relationship}
// - Tone: ${writingTone}
// - ${targetWordCount}
// - ${explicitLevelDescription}
// - ${titlePrompt}

// ${settingPrompt}
// ${protagonistPrompt}
// ${loveInterestPrompt}

// MANDATORY JSON FORMAT (nothing else):
// {
//   "title": "Story Title Here",
//   "content": "Complete story content with vivid descriptions, dialogue, and sensual elements. End with cliffhanger."
// }

// DO NOT include title options, explanations, or any text outside the JSON object.`;

//   const userPrompt = "Create the erotic story now. Return ONLY the JSON object with title and content. No explanations, no title suggestions, no additional text.";

//   try {
//     // Use Google Gemini for story generation
//     console.log("Generating story with Google Gemini model...");
//     console.log("API Key exists:", !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GENAI_API_KEY));

//     const response = await geminiAI.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: [
//         { role: "user", parts: [{ text: userPrompt }] }
//       ],
//       config: {
//         systemInstruction: systemPrompt,
//         maxOutputTokens: maxTokens,
//       }
//     });

//     console.log("Gemini API response received, checking content...");
//     console.log("Response object keys:", Object.keys(response || {}));

//     // Use the same pattern as your working test file
//     let responseText = response.text;

//     if (!responseText || responseText == undefined) {
//       // Check if the content was blocked by safety filters
//       const safetyBlock = response.candidates?.[0]?.safetyRatings;
//       console.error("Gemini content was undefined. Potential Safety Block:", safetyBlock);

//       // Throw an error or return a specific failure message
//       throw new Error("Story generation failed: Content was blocked by safety filters or an internal error occurred.");
//     }

//     console.log("Raw Response is :", responseText);

//     // Remove markdown code blocks that Gemini adds around JSON
//     // responseText = responseText
//     //   .replace(/```json\s*/g, '') // Remove opening ```json
//     //   .replace(/```\s*$/g, '') // Remove closing ```
//     //   .trim();
//     responseText = ""

//     try {
//       // Since Gemini returns proper JSON in markdown blocks, try direct parsing first
//       let jsonStr = responseText;

//       try {
//         // Try to parse the JSON directly (after markdown removal)
//         const result = JSON.parse(jsonStr);

//         return {
//           title: title || result.title || "Untitled Story",
//           content: result.content || "Story generation failed"
//         };
//       } catch (nestedJsonError) {
//         console.error("Error parsing cleaned JSON:", nestedJsonError);

//         // FIXED: Extract content from the raw JSON string instead of returning it
//         try {
//           // Try to extract just the content value from the JSON string
//           const contentMatch = responseText.match(/"content"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/) ||
//             responseText.match(/"content"\s*:\s*"([^}]+)"/);
//           const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/) ||
//             responseText.match(/"title"\s*:\s*"([^,}]+)"/);

//           const extractedContent = contentMatch ? contentMatch[1]
//             .replace(/\\"/g, '"')
//             .replace(/\\n/g, '\n')
//             .replace(/\\t/g, '\t')
//             .replace(/\\r/g, '\r')
//             .trim() : "Story generation failed";

//           const extractedTitle = titleMatch ? titleMatch[1].trim() : "Untitled Story";

//           return {
//             title: title || extractedTitle,
//             content: extractedContent
//           };
//         } catch (extractError) {
//           console.error("Error extracting content from JSON string:", extractError);

//           // Final fallback - return a clean error message
//           return {
//             title: title || "Untitled Story",
//             content: "Unable to generate story content. Please try again."
//           };
//         }
//       }
//     } catch (jsonError) {
//       console.error("Error parsing JSON response from Gemini:", jsonError);

//       // FIXED: Extract content from the raw JSON string instead of returning it
//       try {
//         // Try to extract just the content value from the JSON string
//         const contentMatch = responseText.match(/"content"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/) ||
//           responseText.match(/"content"\s*:\s*"([^}]+)"/);
//         const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/) ||
//           responseText.match(/"title"\s*:\s*"([^,}]+)"/);

//         const extractedContent = contentMatch ? contentMatch[1]
//           .replace(/\\"/g, '"')
//           .replace(/\\n/g, '\n')
//           .replace(/\\t/g, '\t')
//           .replace(/\\r/g, '\r')
//           .trim() : "Story generation failed";

//         const extractedTitle = titleMatch ? titleMatch[1].trim() : "Untitled Story";

//         return {
//           title: title || extractedTitle,
//           content: extractedContent
//         };
//       } catch (extractError) {
//         console.error("Error extracting content from JSON string:", extractError);

//         // Final fallback - return a clean error message
//         return {
//           title: title || "Untitled Story",
//           content: "Unable to generate story content. Please try again."
//         };
//       }
//     }

//   } catch (error) {
//     console.error("All story generation attempts failed:", error);
//     throw new Error("Failed to generate story. Please try again later or check your API keys.");
//   }
// }

export async function generateChapterSummary(content: string, chapterNumber: number): Promise<string> {
  try {
    const response = await geminiAI.models.generateContent({ // CHANGED: method call
      model: "gemini-2.5-flash", // CHANGED: using recommended stable model
      contents: [ // CHANGED: 'messages' array converted to 'contents' array
        { role: "user", parts: [{ text: `Chapter ${chapterNumber} content: ${content.substring(0, 800)}...` }] },
      ],
      config: { // CHANGED: added config object for system instructions and tokens
        systemInstruction: `Generate a brief, tasteful summary (1-2 sentences) for Chapter ${chapterNumber} of an erotic story. Focus on the key events and emotional developments without being overly explicit.`,
        maxOutputTokens: 100, // CHANGED: max_tokens moved and renamed
        temperature: 0.7,
      },
    });

    // CHANGED: response parsing logic updated to Gemini format
    let summary = response.text?.replace(/"/g, "").trim() || `Summary for Chapter ${chapterNumber}`;

    // Clean the summary
    summary = summary.replace(/^Chapter \d+:?\s*/i, '').trim();
    if (!summary) summary = `Chapter ${chapterNumber} summary`;

    return summary;
  } catch (error) {
    console.error("Error generating chapter summary:", error);
    return `Chapter ${chapterNumber} summary`;
  }
}


export async function generateChapterTitle(content: string, chapterNumber: number): Promise<string> {
  try {
    console.log("=== USING NEW CHAPTER TITLE FUNCTION ===");
    // Simple approach: Generate basic titles based on content keywords
    // This avoids Gemini's tendency to generate verbose responses
    const keywords = content.toLowerCase();
    let title = `Chapter ${chapterNumber}`;

    // Generate titles based on content themes
    if (keywords.includes('beach') || keywords.includes('sand') || keywords.includes('ocean')) {
      title = 'Seaside Encounter';
    } else if (keywords.includes('garden') || keywords.includes('flower')) {
      title = 'Garden Romance';
    } else if (keywords.includes('cottage') || keywords.includes('cabin')) {
      title = 'Intimate Hideaway';
    } else if (keywords.includes('sunset') || keywords.includes('sunrise')) {
      title = 'Golden Hour';
    } else if (keywords.includes('wine') || keywords.includes('dinner')) {
      title = 'Evening Desires';
    } else if (keywords.includes('kiss') || keywords.includes('lips')) {
      title = 'First Touch';
    } else if (keywords.includes('dance') || keywords.includes('music')) {
      title = 'Rhythmic Passion';
    } else if (keywords.includes('rain') || keywords.includes('storm')) {
      title = 'Storm of Desire';
    } else if (keywords.includes('fire') || keywords.includes('flame')) {
      title = 'Burning Passion';
    } else if (keywords.includes('moonlight') || keywords.includes('night')) {
      title = 'Moonlit Embrace';
    } else if (keywords.includes('morning') || keywords.includes('dawn')) {
      title = 'Dawn Awakening';
    } else if (keywords.includes('secret') || keywords.includes('hidden')) {
      title = 'Secret Moments';
    } else {
      // Default romantic titles for different chapter numbers
      const defaultTitles = [
        'Unexpected Meeting',
        'Growing Attraction',
        'Passionate Encounter',
        'Intimate Connection',
        'Deepening Bond',
        'Tender Moments',
        'Rising Heat',
        'Sweet Surrender'
      ];
      title = defaultTitles[(chapterNumber - 1) % defaultTitles.length] || `Chapter ${chapterNumber}`;
    }

    return title;
  } catch (error) {
    console.error("Error generating chapter title:", error);
    return `Chapter ${chapterNumber}`;
  }
}

export async function generateStoryTitle(content: string): Promise<string> {
  try {
    // Add safety settings like in generateStory
    const safetySettings = [
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ];

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Story content (first paragraph): ${content.substring(0, 300)}...` }] },
      ],
      config: {
        systemInstruction: "Generate a captivating, sensual title for this erotic story. Keep it concise (2-5 words).",
        maxOutputTokens: 20,
        temperature: 0.7,
        safetySettings: safetySettings,
      }
    });

    // Enhanced error handling like in generateStory
    let responseText = response.text;
    
    if (!responseText || responseText.trim().length === 0) {
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;
      console.error("Title generation issue. Finish Reason:", finishReason);
      
      if (finishReason === "MAX_TOKENS") {
        return "Epic Tale";
      }
      return "Untitled Story";
    }

    return responseText?.replace(/"/g, "").trim() || "Untitled Story";
  } catch (error) {
    console.error("Error generating title:", error);
    return "Untitled Story";
  }
}

export async function generateTitleSuggestions(content: string): Promise<string[]> {
  try {
    // Add safety settings like in generateStory
    const safetySettings = [
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ];

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Story content (first paragraph): ${content.substring(0, 300)}...` }] },
      ],
      config: {
        systemInstruction: "Generate 5 captivating, sensual titles for this erotic story. Keep them concise (2-5 words). Respond in JSON format with an array of titles.",
        maxOutputTokens: 150,
        temperature: 0.8,
        safetySettings: safetySettings,
      }
    });

    // Enhanced error handling like in generateStory
    let responseText = response.text;
    
    if (!responseText || responseText.trim().length === 0) {
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;
      console.error("Title suggestions generation issue. Finish Reason:", finishReason);
      
      if (finishReason === "MAX_TOKENS") {
        return ["Epic Tale", "Passionate Journey", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
      }
      return ["Untitled Story", "Passionate Encounter", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
    }

    // Clean up markdown code blocks like in generateStory
    responseText = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Remove any markdown formatting that might be present
    responseText = responseText.replace(/```json\s?/g, '').replace(/```\s?/g, '');

    try {
      // First try to extract JSON if the response contains JSON object markers
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      let jsonStr = jsonMatch ? jsonMatch[0] : responseText;

      // Clean the string of problematic escape and control characters
      jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove all control characters
        .replace(/\\n/g, '\\n')
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, '\\&')
        .replace(/\\r/g, '\\r')
        .replace(/\\t/g, '\\t')
        .replace(/\\b/g, '\\b')
        .replace(/\\f/g, '\\f')
        .replace(/\n/g, ' '); // Replace newlines with spaces to help with parsing

      try {
        // Try to parse the cleaned JSON
        const result = JSON.parse(jsonStr);

        // Handle different possible response formats
        if (Array.isArray(result)) {
          return result.slice(0, 5).map(title => typeof title === 'string' ? title : title.toString());
        } else if (result.titles && Array.isArray(result.titles)) {
          return result.titles.slice(0, 5);
        } else if (typeof result === 'object') {
          // Try to extract any array property if exists
          const arrayProp = Object.values(result).find(val => Array.isArray(val));
          if (arrayProp) {
            return arrayProp.slice(0, 5).map(title => typeof title === 'string' ? title : title.toString());
          }
        }

        return result.titles || ["Untitled Story"];
      } catch (nestedJsonError) {
        console.error("Error parsing cleaned JSON for titles:", nestedJsonError);

        // Try to extract titles from a non-JSON response
        const lines = responseText.split('\n').filter(line => line.trim().length > 0);
        if (lines.length >= 3) {
          return lines.slice(0, 5).map(line =>
            line.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim()
          );
        }

        return ["Untitled Story", "Passionate Encounter", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
      }
    } catch (jsonError) {
      console.error("Error parsing JSON for title suggestions:", jsonError);

      // Try to extract titles from a non-JSON response
      const lines = responseText.split('\n').filter(line => line.trim().length > 0);
      if (lines.length >= 3) {
        return lines.slice(0, 5).map(line =>
          line.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim()
        );
      }

      return ["Untitled Story", "Passionate Encounter", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
    }
  } catch (error) {
    console.error("Error generating title suggestions:", error);
    return ["Untitled Story", "Passionate Encounter", "Desire Awakened", "Night's Embrace", "Secret Liaison"];
  }
}

export async function generateChoices(chapterContent: string): Promise<{ text: string; outcome?: string }[]> {
  try {
    // Add safety settings like in generateStory
    const safetySettings = [
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ];

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Current chapter ends with: ${chapterContent.slice(-500)}` }] },
      ],
      config: {
        systemInstruction: `You are an expert erotic fiction writer. Given the end of a story chapter, generate 3 distinct, engaging, and sensual choices that the reader can make to influence the next part of the story. Each choice should be a concise phrase (under 15 words). Respond in JSON format with an array of objects, each having a 'text' field for the choice description and an optional 'outcome' field if a specific outcome is implied.`,
        maxOutputTokens: 150,
        temperature: 0.7,
        safetySettings: safetySettings,
      }
    });

    // Enhanced error handling like in generateStory
    let responseText = response.text;
    
    if (!responseText || responseText.trim().length === 0) {
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;
      console.error("Choices generation issue. Finish Reason:", finishReason);
      
      if (finishReason === "MAX_TOKENS") {
        return [
          { text: "Continue with passion" },
          { text: "Take things slower" },
          { text: "Explore new territory" }
        ];
      }
      return [];
    }

    // Clean up markdown code blocks like in generateStory
    responseText = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    try {
      const choices = JSON.parse(responseText);
      if (Array.isArray(choices) && choices.every(c => typeof c.text === 'string')) {
        return choices.slice(0, 3); // Ensure max 3 choices
      }
      return [];
    } catch (jsonError) {
      console.error("Error parsing choices JSON:", jsonError);
      return [];
    }
  } catch (error) {
    console.error("Error generating choices:", error);
    return [];
  }
}

export async function continueStory(existingContent: string, settings: StoryGenerationOptions, selectedChoice?: string): Promise<string> {
  try {
    const {
      timePeriod,
      location,
      atmosphere,
      protagonistGender,
      partnerGender,
      relationship,
      writingTone,
      length,
      settingDescription,
      protagonistDescription,
      loveInterestDescription,
      explicitLevel
    } = settings;

    let maxTokens = 0;
    let targetWordCount = "";

    if (length === 2) {
      maxTokens = 1024;
      targetWordCount = "Write a short continuation of approximately 300-400 words.";
    } else if (length === 3) {
      maxTokens = 2048;
      targetWordCount = "Write a medium-length continuation of approximately 700-900 words.";
    } else if (length === 4) {
      maxTokens = 4096;
      targetWordCount = "Write a longer continuation of approximately 1200-1500 words.";
    } else {
      maxTokens = 1024;
      targetWordCount = "Write a short continuation of approximately 300-400 words.";
    }

    console.log(`Story continuation length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);

    const explicitLevelDescription = explicitLevel !== undefined
      ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.`
      : "Keep the content moderately explicit unless otherwise specified.";

    const settingPrompt = settingDescription
      ? `Setting description: ${settingDescription}`
      : "";

    const protagonistPrompt = protagonistDescription
      ? `Protagonist description: ${protagonistDescription}`
      : "";

    const loveInterestPrompt = loveInterestDescription
      ? `Love interest description: ${loveInterestDescription}`
      : "";

    const choicePrompt = selectedChoice ? `The user chose: "${selectedChoice}". Continue the story based on this choice.` : '';

    // CORRECTED: Template literal structure is simplified to prevent syntax errors
    const systemPrompt = `You are an expert erotic fiction writer. Continue this story seamlessly from where it left off.
    
CRITICAL INSTRUCTIONS:
1. Read the existing content carefully and continue EXACTLY where it ended
2. DO NOT repeat any dialogue, actions, or scenes from the existing content
3. DO NOT use phrases like "And if I choose to stay?" or similar dialogue that appeared before
4. Maintain the same characters, setting, and tone throughout
5. Continue the story's natural progression without resetting or restarting
6. Advance the plot - do NOT repeat similar situations or conversations
7. DO NOT include "Chapter X" headers - provide only the story content
8. End at a natural stopping point with a cliffhanger for the next chapter
9. Ensure each chapter moves the story forward with new developments
    
Story settings:
- Time Period: ${timePeriod}
- Location: ${location}
- Atmosphere: ${atmosphere}
- Protagonist Gender: ${protagonistGender}
- Partner Gender: ${partnerGender}
- Relationship: ${relationship}
- Writing Tone: ${writingTone}
${targetWordCount} This is critical for producing the correct audio duration.
${explicitLevelDescription}
    
${settingPrompt}
${protagonistPrompt}
${loveInterestPrompt}
    
${choicePrompt}
    
Your continuation should advance the plot naturally while maintaining character consistency and story flow.`;

    // Add safety settings like in generateStory
    const safetySettings = [
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ];

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Here's the existing story content:\n\n${existingContent}\n\nIMPORTANT: Continue from the exact point where it ended. Pick up seamlessly from the last sentence. DO NOT repeat any dialogue, actions, or scenarios that already happened. Move the story forward with new developments, locations, or conversation topics.` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: maxTokens,
        temperature: 0.8,
        safetySettings: safetySettings,
      }
    });

    // Enhanced error handling like in generateStory
    let responseText = response.text;
    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason) {
      console.log("Continuation Finish Reason:", finishReason);
    }

    if (!responseText || responseText.trim().length === 0) {
      console.error("Story continuation issue. Finish Reason:", finishReason);

      if (finishReason === "MAX_TOKENS") {
        throw new Error("Story continuation failed due to token limits. Please try with a shorter length setting.");
      }

      throw new Error(`Story continuation blocked by safety filters. Reason: ${finishReason}. Try reducing explicit level or changing content.`);
    }

    // If we got content but hit MAX_TOKENS, log warning but continue
    if (finishReason === "MAX_TOKENS") {
      console.warn("⚠️  Warning: Story continuation hit MAX_TOKENS limit but we have content. Proceeding with available response.");
    }

    // ... (Rest of the post-processing remains unchanged)
    if (responseText.includes('{') && responseText.includes('}')) {
      responseText = responseText
        .replace(/```json\s?/g, '').replace(/```\s?/g, '')
        .replace(/{[^}]*}/g, '')
        .replace(/\[\s*"[^"]*"\s*(?:,\s*"[^"]*"\s*)*\]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    responseText = responseText.replace(/^Chapter \d+:?\s*/i, '').trim();

    const lastFewChars = responseText.slice(-3);

    if (!['."', '!"', '?"', '"'].some(ending => lastFewChars.includes(ending))) {
      const sentences = responseText.split(/[.!?]+/);
      if (sentences.length > 1) {
        sentences.pop();
        responseText = sentences.join('.') + '.';
      }
    }

    return responseText;
  } catch (error) {
    console.error("Error continuing story:", error);
    throw new Error("Failed to continue the story. Please try again.");
  }
}

export async function concludeStory(existingContent: string, settings: StoryGenerationOptions, selectedChoice?: string): Promise<string> {
  try {
    const {
      timePeriod,
      location,
      atmosphere,
      protagonistGender,
      partnerGender,
      relationship,
      writingTone,
      length,
      settingDescription,
      protagonistDescription,
      loveInterestDescription,
      explicitLevel
    } = settings;

    let maxTokens = 0;
    let targetWordCount = "";

    // For conclusions, use slightly higher token limits to ensure proper story resolution
    if (length === 2) {
      maxTokens = 1536; // Conservative but sufficient for conclusions
      targetWordCount = "Write a satisfying conclusion of approximately 400-600 words.";
    } else if (length === 3) {
      maxTokens = 3072; // Conservative for medium conclusions
      targetWordCount = "Write a medium-length conclusion of approximately 800-1000 words.";
    } else if (length === 4) {
      maxTokens = 4096; // Conservative for long conclusions
      targetWordCount = "Write a comprehensive conclusion of approximately 1200-1500 words.";
    } else {
      maxTokens = 1536; // Default conservative
      targetWordCount = "Write a satisfying conclusion of approximately 400-600 words.";
    }

    console.log(`Story conclusion length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);

    const explicitLevelDescription = explicitLevel !== undefined
      ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.`
      : "Keep the content moderately explicit unless otherwise specified.";

    const settingPrompt = settingDescription
      ? `Setting description: ${settingDescription}`
      : "";

    const protagonistPrompt = protagonistDescription
      ? `Protagonist description: ${protagonistDescription}`
      : "";

    const loveInterestPrompt = loveInterestDescription
      ? `Love interest description: ${loveInterestDescription}`
      : "";

    const choicePrompt = selectedChoice ? `The user chose: \"${selectedChoice}\". Conclude the story based on this choice.` : '';

    // CORRECTED: Template literal structure is simplified to prevent syntax errors
    const systemPrompt = `You are an expert erotic fiction writer. Conclude this story seamlessly from where it left off.
    
CRITICAL INSTRUCTIONS:
1. Read the existing content carefully and continue EXACTLY where it ended
2. DO NOT repeat any dialogue, actions, or scenes from the existing content
3. Bring the story to a satisfying conclusion. Resolve the main conflicts and provide a clear ending.
4. DO NOT end with a cliffhanger.
5. Maintain the same characters, setting, and tone throughout
6. DO NOT include "Chapter X" headers - provide only the story content
    
Story settings:
- Time Period: ${timePeriod}
- Location: ${location}
- Atmosphere: ${atmosphere}
- Protagonist Gender: ${protagonistGender}
- Partner Gender: ${partnerGender}
- Relationship: ${relationship}
- Writing Tone: ${writingTone}
${targetWordCount} This is critical for producing the correct audio duration.
${explicitLevelDescription}
    
${settingPrompt}
${protagonistPrompt}
${loveInterestPrompt}
    
${choicePrompt}
    
Your conclusion should provide a sense of closure and resolution.`;


    // Add safety settings like in generateStory
    const safetySettings = [
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ];

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Here\'s the existing story content:\n\n${existingContent}\n\nIMPORTANT: Conclude the story from the exact point where it ended. Provide a satisfying resolution.` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: maxTokens,
        temperature: 0.8,
        safetySettings: safetySettings,
      }
    });

    // Enhanced error handling like in generateStory
    let responseText = response.text;
    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason) {
      console.log("Conclusion Finish Reason:", finishReason);
    }

    if (!responseText || responseText.trim().length === 0) {
      console.error("Story conclusion issue. Finish Reason:", finishReason);

      if (finishReason === "MAX_TOKENS") {
        throw new Error("Story conclusion failed due to token limits. Please try with a shorter length setting.");
      }

      throw new Error(`Story conclusion blocked by safety filters. Reason: ${finishReason}. Try reducing explicit level or changing content.`);
    }

    // If we got content but hit MAX_TOKENS, log warning but continue
    if (finishReason === "MAX_TOKENS") {
      console.warn("⚠️  Warning: Story conclusion hit MAX_TOKENS limit but we have content. Proceeding with available response.");
    }

    // ... (Rest of the post-processing remains unchanged)
    if (responseText.includes('{') && responseText.includes('}')) {
      responseText = responseText
        .replace(/```json\s?/g, '').replace(/```\s?/g, '')
        .replace(/{[^}]*}/g, '')
        .replace(/\[\s*"[^"]*"\s*(?:,\s*"[^"]*"\s*)*\]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    responseText = responseText.replace(/^Chapter \d+:?\s*/i, '').trim();

    const lastFewChars = responseText.slice(-3);

    if (!['."', '!"', '?"', '"'].some(ending => lastFewChars.includes(ending))) {
      const sentences = responseText.split(/[.!?]+/);
      if (sentences.length > 1) {
        sentences.pop();
        responseText = sentences.join('.') + '.';
      }
    }

    return responseText;
  } catch (error) {
    console.error("Error concluding story:", error);
    throw new Error("Failed to conclude the story. Please try again.");
  }
}
