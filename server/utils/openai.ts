import OpenAI from "openai";

// Using Novita.ai as our story generation engine
const novitaAI = new OpenAI({
  baseURL: "https://api.novita.ai/v3/openai",
  apiKey: "sk_rEjXJfuj7kImHyeFPucTGuewR3E37rilrKATo1tCHcI",
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

  // Calculate max tokens based on length setting (1-5) - stricter limits to ensure stories are not too long
  // This ensures the story feels "incomplete" and can be continued
  const maxTokens = 300 * length;

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

  const systemPrompt = `You are an expert erotic fiction writer known for creating tasteful, sensual narratives.
Generate an erotic story with the following parameters:
- Time Period: ${timePeriod}
- Location: ${location}
- Atmosphere: ${atmosphere}
- Protagonist Gender: ${protagonistGender}
- Partner Gender: ${partnerGender}
- Relationship: ${relationship}
- Writing Tone: ${writingTone}
- Length: ${length} out of 5 (adjust word count accordingly)
${explicitLevelDescription}
${titlePrompt}

${settingPrompt}
${protagonistPrompt}
${loveInterestPrompt}

IMPORTANT: Make the story incomplete/unfinished, ending with a cliffhanger or in the middle of a scene. It should feel like it needs continuation.

Your story should be tasteful, sensual, and focus on the emotional and physical connection between characters.
Include vivid descriptions and engaging dialogue. Start with setting the scene and gradually build tension.

Format your response as JSON with the following structure:
{
  "title": "${title || "Story Title"}",
  "content": "Full story with proper paragraphs and formatting"
}`;

  const userPrompt = "Generate a high-quality erotic story based on the parameters.";

  try {
    // Use Novita.ai with the deepseek model for story generation
    console.log("Generating story with Novita.ai deepseek model...");
    const completion = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.8,
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
          
          // Process content to remove any remaining JSON formatting
          let finalContent = result.content || responseText;
          
          // If content still contains JSON-like structures, clean it further
          if (finalContent.includes('{') && finalContent.includes('}')) {
            finalContent = finalContent
              .replace(/{[^}]*}/g, '') // Remove any remaining JSON objects
              .replace(/\[\s*"[^"]*"\s*(?:,\s*"[^"]*"\s*)*\]/g, '') // Remove arrays of strings
              .replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space
              .trim();
          }
          
          return { 
            title: title || result.title || "Untitled Story", 
            content: finalContent 
          };
        } catch (nestedJsonError) {
          console.error("Error parsing cleaned JSON:", nestedJsonError);
          // If still cannot parse, just use the response text directly
          return {
            title: title || "Untitled Story",
            content: responseText
          };
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response from Novita:", jsonError);
        // Fallback to creating a basic object from raw text
        return {
          title: title || "Untitled Story",
          content: responseText
        };
      }
    }
  } catch (error) {
    console.error("All story generation attempts failed:", error);
    throw new Error("Failed to generate story. Please try again later or check your API keys.");
  }
}

export async function generateStoryTitle(content: string): Promise<string> {
  try {
    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
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
    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
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

export async function continueStory(existingContent: string, settings: StoryGenerationOptions): Promise<string> {
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

    const maxTokens = 300 * length;

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

    const systemPrompt = `You are an expert erotic fiction writer. Continue this story based on the existing content and settings.
    Story settings:
    - Time Period: ${timePeriod}
    - Location: ${location}
    - Atmosphere: ${atmosphere}
    - Protagonist Gender: ${protagonistGender}
    - Partner Gender: ${partnerGender}
    - Relationship: ${relationship}
    - Writing Tone: ${writingTone}
    ${explicitLevelDescription}
    
    ${settingPrompt}
    ${protagonistPrompt}
    ${loveInterestPrompt}
    
    Your continuation should be tasteful, sensual, and maintain the style, tone, and characters from the existing content.
    Focus on advancing the plot while keeping the emotional and physical connection between characters.
    Write approximately ${maxTokens / 2} words of continuation.`;

    const response = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek_v3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here's the existing story content: \n\n${existingContent.substring(0, 2000)}...\n\nContinue the story from where it left off.` }
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
    
    return responseText;
  } catch (error) {
    console.error("Error continuing story:", error);
    throw new Error("Failed to continue the story. Please try again.");
  }
}
