import OpenAI from "openai";
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Using Google Gemini API with OpenAI compatibility
const geminiAI = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.GEMINI_API || "AIzaSyB_t3pkKT_GvB4vPYNkrdALSajq5N0Sbu4",
});
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

  // Calculate max tokens and word count based on story length for more consistent audio duration
  // Short (2): 2-3 minutes audio (approximately 1200 tokens, ~300-400 words)
  // Medium (3): 4-5 minutes audio (approximately 2400 tokens, ~700-900 words)
  // Long (4): 8-10 minutes audio (approximately 4800 tokens, ~1500-1800 words)
  
  let maxTokens = 0;
  let targetWordCount = "";
  
  if (length === 2) { // Short
    maxTokens = 1200;
    targetWordCount = "Write a short story of approximately 300-400 words.";
  } else if (length === 3) { // Medium
    maxTokens = 2400;
    targetWordCount = "Write a medium-length story of approximately 700-900 words.";
  } else if (length === 4) { // Long
    maxTokens = 4800;
    targetWordCount = "Write a longer story of approximately 1500-1800 words.";
  } else {
    // Default to short if somehow an invalid length is provided
    maxTokens = 1200;
    targetWordCount = "Write a short story of approximately 300-400 words.";
  }
  
  console.log(`Story length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);

  // Determine explicit content level based on the slider value
  const explicitLevelDescription = explicitLevel !== undefined 
    ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.`
    : "Keep the content moderately explicit unless otherwise specified.";

  const titlePrompt = title 
    ? `The story must directly involve the central concept of "${title}" as its primary focus. The story's main character, plot, theme, and events MUST literally be about "${title}" - for example, if the title is "Greedy Dog", the story MUST feature a dog that is greedy as a central character or theme. If the title is a person's name, they must be the main character. If the title is an object, that object must be central to the story. Make the title the most prominent element of the story.` 
    : "Generate an appropriate title for the story.";

  // Add detailed descriptions if provided
  const settingPrompt = settingDescription 
    ? `Setting description: ${settingDescription}\nIncorporate these specific setting details into your narrative.` 
    : "";
    
  const protagonistPrompt = protagonistDescription 
    ? `Protagonist description: ${protagonistDescription}\nEnsure the protagonist has these specific characteristics.` 
    : "";
    
  const loveInterestPrompt = loveInterestDescription 
    ? `Love interest description: ${loveInterestDescription}\nIncorporate these specific details about the love interest.` 
    : "";

  const systemPrompt = `You must return ONLY valid JSON. No explanations, no title suggestions, no additional text.

Create an erotic story with these parameters:
- Time Period: ${timePeriod}
- Location: ${location}
- Atmosphere: ${atmosphere}
- Protagonist: ${protagonistGender}
- Partner: ${partnerGender}
- Relationship: ${relationship}
- Tone: ${writingTone}
- ${targetWordCount}
- ${explicitLevelDescription}
- ${titlePrompt}

${settingPrompt}
${protagonistPrompt}
${loveInterestPrompt}

MANDATORY JSON FORMAT (nothing else):
{
  "title": "Story Title Here",
  "content": "Complete story content with vivid descriptions, dialogue, and sensual elements. End with cliffhanger."
}

DO NOT include title options, explanations, or any text outside the JSON object.`;

  const userPrompt = "Create the erotic story now. Return ONLY the JSON object with title and content. No explanations, no title suggestions, no additional text.";

  try {
    // Use Google Gemini for story generation
    console.log("Generating story with Google Gemini model...");
    const completion = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7, // Slightly lower for more consistent JSON output
      stream,
    });

    if (stream) {
      let fullResponse = "";
      for await (const chunk of completion as unknown as AsyncIterable<any>) {
        if (chunk.choices[0].finish_reason) {
          console.log("Generation complete.");
        } else {
          fullResponse += chunk.choices[0].delta.content || '';
        }
      }

      // Remove any markdown formatting that might be present
      fullResponse = fullResponse.replace(/```json\s?/g, '').replace(/```\s?/g, '');

      try {
        // First try to extract JSON if the response contains JSON object markers
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        let jsonStr = jsonMatch ? jsonMatch[0] : fullResponse;
        
        // Remove any potential problematic escape characters
        jsonStr = jsonStr.replace(/\\n/g, '\\n')
                         .replace(/\\'/g, "\\'")
                         .replace(/\\"/g, '\\"')
                         .replace(/\\&/g, '\\&')
                         .replace(/\\r/g, '\\r')
                         .replace(/\\t/g, '\\t')
                         .replace(/\\b/g, '\\b')
                         .replace(/\\f/g, '\\f');
        
        try {
          // Try to parse the cleaned JSON
          const result = JSON.parse(jsonStr);
          return { 
            title: title || result.title || "Untitled Story", 
            content: result.content || fullResponse 
          };
        } catch (nestedJsonError) {
          console.error("Error parsing cleaned JSON from stream:", nestedJsonError);
          // If still cannot parse, just use the response text directly
          return {
            title: title || "Untitled Story",
            content: fullResponse
          };
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response in stream:", jsonError);
        return {
          title: title || "Untitled Story",
          content: fullResponse
        };
      }
    } else {
      let responseText = completion.choices[0].message.content || '{"title": "Untitled", "content": "Story generation failed."}';

      // Remove markdown code blocks that Gemini adds around JSON
      responseText = responseText
        .replace(/```json\s*/g, '') // Remove opening ```json
        .replace(/```\s*$/g, '') // Remove closing ```
        .trim();

      try {
        // Since Gemini returns proper JSON in markdown blocks, try direct parsing first
        let jsonStr = responseText;
        
        try {
          // Try to parse the JSON directly (after markdown removal)
          const result = JSON.parse(jsonStr);
          
          return { 
            title: title || result.title || "Untitled Story", 
            content: result.content || "Story generation failed"
          };
        } catch (nestedJsonError) {
          console.error("Error parsing cleaned JSON:", nestedJsonError);
          
          // Comprehensive fallback: Extract actual story content from Gemini's verbose response
          let content = responseText;
          
          // Remove all the explanatory text and title suggestions
          content = content
            .replace(/^.*?Here are a few title options.*?(?=\n\n|\n[A-Z])/is, '') // Remove title section
            .replace(/^\* \*\*.*?\*\*.*$/gm, '') // Remove bullet point titles
            .replace(/^Here's? (?:the|a) story.*?$/gm, '') // Remove story introductions
            .replace(/^Based on.*?$/gm, '') // Remove parameter explanations
            .replace(/^.*?ranging in tone.*?$/gm, '') // Remove tone descriptions
            .replace(/^\s*[\*\-\+]\s+.*$/gm, '') // Remove all bullet points
            .replace(/^\s*$\n/gm, '') // Remove empty lines
            .trim();
          
          // Find the actual story start (usually starts with "The" and contains story elements)
          const storyMatch = content.match(/(The\s+(?:turquoise|crystal|warm|golden|sun|beach|water|wind|island).*?)$/is) ||
                           content.match(/(I\s+(?:was|had|found|saw|felt).*?)$/is) ||
                           content.match(/([A-Z][a-z]+.*?(?:water|sun|beach|resort|island|paradise|garden).*?)$/is);
          
          if (storyMatch) {
            content = storyMatch[1].trim();
          }
          
          return {
            title: title || "Untitled Story",
            content: content
          };
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response from Gemini:", jsonError);
        
        // Last resort: Extract story from the exact format shown in the image
        let content = responseText;
        
        // Handle the specific format from your image: "Here are a few title options... * **Title** (description)"
        const afterTitleOptions = content.split(/Here are a few title options.*?\n/i)[1];
        if (afterTitleOptions) {
          // Find the actual story start after all the title suggestions
          const storyStart = afterTitleOptions.search(/The\s+(?:turquoise|crystal|warm|sun|water)/i);
          if (storyStart !== -1) {
            content = afterTitleOptions.substring(storyStart);
          } else {
            content = afterTitleOptions.replace(/^\* \*\*.*?\*\*.*$/gm, '').trim();
          }
        }
        
        // Clean up any remaining formatting
        content = content
          .replace(/^\* \*\*.*?\*\*.*$/gm, '') // Remove title suggestions
          .replace(/^\s*$/gm, '') // Remove empty lines
          .trim();
        
        return {
          title: title || "Untitled Story",
          content: content
        };
      }
    }
  } catch (error) {
    console.error("All story generation attempts failed:", error);
    throw new Error("Failed to generate story. Please try again later or check your API keys.");
  }
}

export async function generateChapterSummary(content: string, chapterNumber: number): Promise<string> {
  try {
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: `Generate a brief, tasteful summary (1-2 sentences) for Chapter ${chapterNumber} of an erotic story. Focus on the key events and emotional developments without being overly explicit.` },
        { role: "user", content: `Chapter ${chapterNumber} content: ${content.substring(0, 800)}...` },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    let summary = response.choices[0].message.content?.replace(/"/g, "").trim() || `Summary for Chapter ${chapterNumber}`;
    
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
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: "Generate a captivating, sensual title for this erotic story. Keep it concise (2-5 words)." },
        { role: "user", content: `Story content (first paragraph): ${content.substring(0, 300)}...` },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.replace(/"/g, "") || "Untitled Story";
  } catch (error) {
    console.error("Error generating title:", error);
    return "Untitled Story";
  }
}

export async function generateTitleSuggestions(content: string): Promise<string[]> {
  try {
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: "Generate 5 captivating, sensual titles for this erotic story. Keep them concise (2-5 words). Respond in JSON format with an array of titles." },
        { role: "user", content: `Story content (first paragraph): ${content.substring(0, 300)}...` },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    let responseText = response.choices[0].message.content || '{"titles": ["Untitled Story"]}';

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
    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: `You are an expert erotic fiction writer. Given the end of a story chapter, generate 3 distinct, engaging, and sensual choices that the reader can make to influence the next part of the story. Each choice should be a concise phrase (under 15 words). Respond in JSON format with an array of objects, each having a 'text' field for the choice description and an optional 'outcome' field if a specific outcome is implied.` },
        { role: "user", content: `Current chapter ends with: ${chapterContent.slice(-500)}` },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    let responseText = response.choices[0].message.content || '[]';
    responseText = responseText.replace(/```json\s?/g, '').replace(/```\s?/g, '');

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

    // Calculate max tokens and word count based on story length for more consistent audio duration
    // Short (2): 2-3 minutes audio (approximately 1200 tokens, ~300-400 words)
    // Medium (3): 4-5 minutes audio (approximately 2400 tokens, ~700-900 words)
    // Long (4): 8-10 minutes audio (approximately 4800 tokens, ~1500-1800 words)
    
    let maxTokens = 0;
    let targetWordCount = "";
    
    if (length === 2) { // Short
      maxTokens = 1200;
      targetWordCount = "Write a short continuation of approximately 300-400 words.";
    } else if (length === 3) { // Medium
      maxTokens = 2400;
      targetWordCount = "Write a medium-length continuation of approximately 700-900 words.";
    } else if (length === 4) { // Long
      maxTokens = 4800;
      targetWordCount = "Write a longer continuation of approximately 1500-1800 words.";
    } else {
      // Default to short if somehow an invalid length is provided
      maxTokens = 1200;
      targetWordCount = "Write a short continuation of approximately 300-400 words.";
    }
    
    console.log(`Story continuation length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);

    // Determine explicit content level based on the slider value
    const explicitLevelDescription = explicitLevel !== undefined 
      ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.`
      : "Keep the content moderately explicit unless otherwise specified.";
      
    // Add detailed descriptions if provided
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

    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here's the existing story content:\n\n${existingContent}\n\nIMPORTANT: Continue from the exact point where it ended. Pick up seamlessly from the last sentence. DO NOT repeat any dialogue, actions, or scenarios that already happened. Move the story forward with new developments, locations, or conversation topics.` }
      ],
      max_tokens: maxTokens,
      temperature: 0.8,
    });

    let responseText = response.choices[0].message.content || "The story continues...";
    
    // Clean the response of any JSON or markdown formatting
    if (responseText.includes('{') && responseText.includes('}')) {
      responseText = responseText
        .replace(/```json\s?/g, '').replace(/```\s?/g, '')
        .replace(/{[^}]*}/g, '') // Remove any JSON objects
        .replace(/\[\s*"[^"]*"\s*(?:,\s*"[^"]*"\s*)*\]/g, '') // Remove arrays of strings
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space
        .trim();
    }

    // Remove any chapter headers that might have been added
    responseText = responseText.replace(/^Chapter \d+:?\s*/i, '').trim();
    
    // Validate that the response doesn't end mid-sentence
    const lastChar = responseText.slice(-1);
    const lastFewChars = responseText.slice(-3);
    
    // If it ends abruptly, try to clean it up
    if (!['."', '!"', '?"', '"'].some(ending => lastFewChars.includes(ending))) {
      // Find the last complete sentence
      const sentences = responseText.split(/[.!?]+/);
      if (sentences.length > 1) {
        // Remove the incomplete last sentence and reconstruct
        sentences.pop(); // Remove last incomplete part
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

    // Calculate max tokens and word count based on story length for more consistent audio duration
    // Short (2): 2-3 minutes audio (approximately 1200 tokens, ~300-400 words)
    // Medium (3): 4-5 minutes audio (approximately 2400 tokens, ~700-900 words)
    // Long (4): 8-10 minutes audio (approximately 4800 tokens, ~1500-1800 words)
    
    let maxTokens = 0;
    let targetWordCount = "";
    
    if (length === 2) { // Short
      maxTokens = 1200;
      targetWordCount = "Write a short conclusion of approximately 300-400 words.";
    } else if (length === 3) { // Medium
      maxTokens = 2400;
      targetWordCount = "Write a medium-length conclusion of approximately 700-900 words.";
    } else if (length === 4) { // Long
      maxTokens = 4800;
      targetWordCount = "Write a longer conclusion of approximately 1500-1800 words.";
    } else {
      // Default to short if somehow an invalid length is provided
      maxTokens = 1200;
      targetWordCount = "Write a short conclusion of approximately 300-400 words.";
    }
    
    console.log(`Story conclusion length setting: ${length} (Short=2, Medium=3, Long=4), calculated token limit: ${maxTokens}`);

    // Determine explicit content level based on the slider value
    const explicitLevelDescription = explicitLevel !== undefined 
      ? `Set the explicitness level to ${explicitLevel}% - the higher the percentage, the more explicit the content.`
      : "Keep the content moderately explicit unless otherwise specified.";
      
    // Add detailed descriptions if provided
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

    const response = await geminiAI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here\'s the existing story content:\n\n${existingContent}\n\nIMPORTANT: Conclude the story from the exact point where it ended. Provide a satisfying resolution.` }
      ],
      max_tokens: maxTokens,
      temperature: 0.8,
    });

    let responseText = response.choices[0].message.content || "The story concludes...";
    
    // Clean the response of any JSON or markdown formatting
    if (responseText.includes('{') && responseText.includes('}')) {
      responseText = responseText
        .replace(/```json\s?/g, '').replace(/```\s?/g, '')
        .replace(/{[^}]*}/g, '') // Remove any JSON objects
        .replace(/\[\s*"[^"]*"\s*(?:,\s*"[^"]*"\s*)*\]/g, '') // Remove arrays of strings
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space
        .trim();
    }

    // Remove any chapter headers that might have been added
    responseText = responseText.replace(/^Chapter \d+:?\s*/i, '').trim();
    
    // Validate that the response doesn't end mid-sentence
    const lastChar = responseText.slice(-1);
    const lastFewChars = responseText.slice(-3);
    
    // If it ends abruptly, try to clean it up
    if (!['."','!"','?"','"'].some(ending => lastFewChars.includes(ending))) {
      // Find the last complete sentence
      const sentences = responseText.split(/[.!?]+/);
      if (sentences.length > 1) {
        // Remove the incomplete last sentence and reconstruct
        sentences.pop(); // Remove last incomplete part
        responseText = sentences.join('.') + '.';
      }
    }
    
    return responseText;
  } catch (error) {
    console.error("Error concluding story:", error);
    throw new Error("Failed to conclude the story. Please try again.");
  }
}
