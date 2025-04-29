app.post("/api/speech/generate", async (req, res) => {
  try {
    const { text, voiceId, storyId } = z.object({
      text: z.string(),
      voiceId: z.string(),
      storyId: z.string().optional()
    }).parse(req.body);
    
    console.log(`Speech generation request received - Voice: ${voiceId}, Text length: ${text.length} chars, Story ID: ${storyId || 'none'}`);
    
    // Check if text is valid - it shouldn't be empty after stripping
    const strippedText = text.replace(/\s+/g, '');
    if (!strippedText || strippedText.length < 10) {
      return res.status(400).json({ 
        message: "Text content is too short or contains only whitespace", 
        error: "Invalid text content"
      });
    }
    
    // Convert the voice name to a voice ID if needed
    const actualVoiceId = elevenlabs.getVoiceId(voiceId);
    console.log(`Using voice ID: ${actualVoiceId}`);

    // Process the text for speech generation
    let processedText = text;
    
    // If text starts with "title:" or similar metadata patterns, clean it up
    if (text.match(/^\s*title:\s*[^,\n]+,\s*content:/i)) {
      // Extract just the content part if the text contains metadata
      const contentMatch = text.match(/content:\s*([\s\S]+)$/i);
      if (contentMatch && contentMatch[1]) {
        processedText = contentMatch[1].trim();
        console.log('Extracted content from metadata format');
      }
    }
    
    // Ensure we don't have any problematic characters that could cause API issues
    processedText = processedText
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
      .replace(/\n{3,}/g, '\n\n')       // Normalize excessive line breaks
      .replace(/\s{3,}/g, ' ')          // Normalize excessive spaces
      .trim();

    console.log(`Processed text length: ${processedText.length} characters`);

    try {
      // Generate speech using ElevenLabs API
      const audioUrl = await elevenlabs.textToSpeech({
        text: processedText,
        voiceId: actualVoiceId,
        model: 'eleven_monolingual_v1',
        stability: 0.5,
        similarityBoost: 0.75
      });

      console.log(`Generated audio URL: ${audioUrl}`);
      
      // Check if the audio file exists and get its size
      const filePath = path.join(process.cwd(), 'dist', 'public', audioUrl.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        console.error(`Generated audio file not found at path: ${filePath}`);
        return res.status(500).json({
          message: "Generated audio file not found",
          error: "File generation failed"
        });
      }
      
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;
      console.log(`Generated audio file size: ${fileSize} bytes`);

      // If file is too small (less than 1KB), it's likely a fallback or error
      const fileSizeInKB = fileSize / 1024;
      const isFallback = fileSizeInKB < 1;
      console.log(`The file size is ${fileSizeInKB} KB`);
      console.log(`The isFallback is ${isFallback}`);
      
      // Only update the story if the audio file is valid
      if (storyId && !isFallback) {
        // Update the story audio in the MongoDB database
        const story = await Story.findById(storyId);
        if (story) {
          story.audioUrl = audioUrl;
          await story.save();
          console.log(`Updated story ${storyId} with audio URL ${audioUrl} in MongoDB`);
        }
      } else if (isFallback) {
        console.log(`Fallback audio file generated for story ${storyId}`);
      }
      
      // Return the audio URL and fallback status
      res.json({ 
        audioUrl,
        fallback: isFallback,
        message: isFallback ? "Generated a fallback audio file. The text may be too complex or long for the TTS service." : undefined
      });
    } catch (error: any) {
      console.error("Speech API error:", error);
      
      // Check if it's an API key issue
      if (error.message && (
          error.message.includes('API key') || 
          error.message.includes('authentication') || 
          error.message.includes('Unauthorized'))) {
        return res.status(401).json({ 
          message: "Speech generation failed due to API authentication issues",
          error: "The API key is invalid or has expired. Please update it with a valid key.",
          apiKeyIssue: true
        });
      }
      
      // Create a fallback audio file using the elevenlabs service
      try {
        const fallbackUrl = await elevenlabs.createFallbackAudio();
        console.log(`Created fallback audio file: ${fallbackUrl}`);
        
        // Return fallback response
        res.status(200).json({ 
          audioUrl: fallbackUrl,
          fallback: true,
          message: "Speech generation failed. Using fallback audio.",
          error: error.message || "Unknown error"
        });
      } catch (fallbackError) {
        console.error("Error creating fallback audio:", fallbackError);
        res.status(500).json({
          message: "Failed to generate speech and fallback audio",
          error: error.message || "Unknown error",
          fallback: true
        });
      }
    }
  } catch (error: any) {
    console.error("Error generating speech:", error);
    res.status(500).json({ 
      message: "Failed to generate speech", 
      error: error.message || "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      fallback: true
    });
  }
}); 