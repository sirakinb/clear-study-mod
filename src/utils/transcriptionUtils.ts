// Transcription utilities - combines AssemblyAI and Airtable functionality

import { uploadToAssemblyAI, startTranscription, pollTranscript } from './assemblyAIUtils';
import { saveToAirtable, AirtableTranscript, AirtableConfig } from './airtableUtils';

export interface TranscriptionResult {
  text: string;
  audioDuration: number;
  airtableId?: string;
}

export interface TranscriptionConfig {
  assemblyAIKey: string;
  airtable: AirtableConfig;
}

/**
 * Complete end-to-end process: Upload audio to AssemblyAI, get transcription, and save to Airtable
 * @param audioBlob Audio blob to transcribe
 * @param title Recording title
 * @param notes Optional notes
 * @param duration Audio duration in seconds
 * @param config Configuration with API keys
 * @returns Promise with transcription result
 */
export const processTranscription = async (
  audioBlob: Blob,
  title: string,
  notes: string = '',
  duration: number = 0,
  config: TranscriptionConfig
): Promise<TranscriptionResult> => {
  try {
    // Step 1: Upload to AssemblyAI
    const uploadUrl = await uploadToAssemblyAI(audioBlob, config.assemblyAIKey);
    
    // Step 2: Start transcription
    const transcriptionId = await startTranscription(uploadUrl, config.assemblyAIKey);
    
    // Step 3: Poll for results
    const { text, status } = await pollTranscript(transcriptionId, config.assemblyAIKey);
    
    if (status !== 'completed' || !text) {
      throw new Error('Transcription failed or returned empty text');
    }
    
    // Step 4: Save to Airtable
    const airtableData: AirtableTranscript = {
      title,
      transcript: text,
      date: new Date().toISOString(),
      duration,
      notes,
    };
    
    const airtableId = await saveToAirtable(airtableData, config.airtable);
    
    return {
      text,
      audioDuration: duration,
      airtableId,
    };
  } catch (error) {
    console.error('Error in transcription process:', error);
    throw error;
  }
};

/**
 * Only handle the AssemblyAI portion without saving to Airtable
 * @param audioBlob Audio blob to transcribe
 * @param apiKey AssemblyAI API key
 * @returns Promise with transcription text
 */
export const transcribeOnly = async (
  audioBlob: Blob, 
  apiKey: string
): Promise<string> => {
  try {
    console.log(`TranscribeOnly: Processing blob of size ${audioBlob.size} bytes and type ${audioBlob.type}`);
    
    // Ensure we have a valid audio blob
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('No audio data available for transcription');
    }

    // Validate audio format
    if (!audioBlob.type.startsWith('audio/')) {
      console.warn('Invalid audio MIME type:', audioBlob.type);
      // Try to create a new blob with proper audio MIME type
      const arrayBuffer = await audioBlob.arrayBuffer();
      audioBlob = new Blob([arrayBuffer], { type: 'audio/webm' });
      console.log('Converted blob to audio/webm format');
    }

    // Ensure minimum size requirement (1KB)
    if (audioBlob.size < 1000) {
      throw new Error('Audio recording is too short. Please record at least 2-3 seconds of audio.');
    }
    
    // Step 1: Upload to AssemblyAI
    console.log('Starting AssemblyAI upload process...');
    const uploadUrl = await uploadToAssemblyAI(audioBlob, apiKey);
    
    // Step 2: Start transcription
    console.log(`Upload successful, starting transcription with URL: ${uploadUrl.substring(0, 30)}...`);
    const transcriptionId = await startTranscription(uploadUrl, apiKey);
    
    // Step 3: Poll for results
    console.log(`Transcription started with ID: ${transcriptionId}, now polling for results...`);
    const { text, status } = await pollTranscript(transcriptionId, apiKey);
    
    if (status !== 'completed' || !text) {
      throw new Error('Transcription failed or returned empty text');
    }
    
    console.log(`Transcription completed with ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('Error in transcription process:', error);
    throw error;
  }
}; 