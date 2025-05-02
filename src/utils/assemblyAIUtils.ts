// AssemblyAI API integration utilities
import { AssemblyAI } from 'assemblyai';
import type { PiiPolicy } from 'assemblyai';

export interface CustomSpelling {
  from: string[];
  to: string;
}

export interface TranscriptionConfig {
  audio_start_from?: number;
  audio_end_at?: number;
  auto_chapters?: boolean;
  auto_highlights?: boolean;
  boost_param?: 'low' | 'default' | 'high';
  content_safety?: boolean;
  content_safety_confidence?: number;
  custom_spelling?: CustomSpelling[];
  disfluencies?: boolean;
  entity_detection?: boolean;
  filter_profanity?: boolean;
  format_text?: boolean;
  iab_categories?: boolean;
  language_code?: string;
  language_confidence_threshold?: number;
  language_detection?: boolean;
  multichannel?: boolean;
  punctuate?: boolean;
  redact_pii?: boolean;
  redact_pii_audio?: boolean;
  redact_pii_audio_quality?: 'mp3' | 'wav';
  redact_pii_policies?: PiiPolicy[];
  redact_pii_sub?: 'entity_name' | 'hash';
  sentiment_analysis?: boolean;
  speaker_labels?: boolean;
  speakers_expected?: number;
  speech_model?: 'best' | 'nano';
  speech_threshold?: number;
  summarization?: boolean;
  summary_model?: 'informative' | 'conversational' | 'catchy';
  summary_type?: 'bullets' | 'bullets_verbose' | 'gist' | 'headline' | 'paragraph';
  topics?: string[];
  webhook_auth_header_name?: string;
  webhook_auth_header_value?: string;
  webhook_url?: string;
  word_boost?: string[];
}

const DEFAULT_CONFIG: TranscriptionConfig = {
  language_code: 'en_us',
  punctuate: true,
  format_text: true,
  auto_highlights: true,
  entity_detection: true,
  speaker_labels: true,
  speakers_expected: 2,
  summarization: true,
  summary_model: 'informative',
  summary_type: 'bullets',
  speech_model: 'best',
  speech_threshold: 0.5
};

/**
 * Uploads an audio blob and transcribes it using AssemblyAI SDK
 * @param blob Audio blob to upload
 * @param apiKey AssemblyAI API key
 * @returns Promise with transcription text
 */
export const transcribeAudioWithSDK = async (
  blob: Blob,
  apiKey: string
): Promise<{ text: string; id: string }> => {
  try {
    console.log(`Transcribing audio blob of size ${blob.size} bytes and type ${blob.type}`);
    
    // Make sure the blob is a valid audio file and has sufficient size
    if (!blob.type.startsWith('audio/') || blob.size < 1000) {
      throw new Error('Invalid audio blob: Too small or not an audio type');
    }
    
    // Initialize AssemblyAI client
    const client = new AssemblyAI({ apiKey });
    
    // Determine correct file extension and mime type based on the actual blob type
    let fileName = 'recording.mp3';
    let fileType = blob.type;
    
    if (blob.type.includes('webm')) {
      fileName = 'recording.webm';
      fileType = 'audio/webm';
      console.log('Using WebM format for AssemblyAI transcription');
    } else if (blob.type.includes('wav')) {
      fileName = 'recording.wav';
      fileType = 'audio/wav';
      console.log('Using WAV format for AssemblyAI transcription');
    } else {
      // Default to MP3
      fileName = 'recording.mp3';
      fileType = 'audio/mp3';
      console.log('Using MP3 format for AssemblyAI transcription');
    }
    
    // Create a new blob with the correct type to ensure content-type header is correct
    const typedBlob = new Blob([await blob.arrayBuffer()], { type: fileType });
    
    // Convert the blob to a File object that the SDK can handle
    const file = new File([typedBlob], fileName, { type: fileType });
    
    console.log('Starting transcription with AssemblyAI SDK...');
    const transcript = await client.transcripts.transcribe({ audio: file });
    
    console.log('Transcription completed successfully!');
    console.log(`Transcript ID: ${transcript.id}`);
    console.log(`Text length: ${transcript.text.length} characters`);
    
    return {
      text: transcript.text,
      id: transcript.id
    };
  } catch (error) {
    console.error('Error transcribing with AssemblyAI SDK:', error);
    throw error;
  }
};

export const uploadToAssemblyAI = async (blob: Blob, apiKey: string): Promise<string> => {
  try {
    console.log(`Uploading audio blob of size ${blob.size} bytes and type ${blob.type}`);
    
    // Validate blob size
    if (blob.size < 1000) {
      throw new Error('Audio file is too small (less than 1KB). Please record a longer audio sample.');
    }
    
    // Initialize AssemblyAI client
    const client = new AssemblyAI({ apiKey });
    
    // Determine correct file extension and mime type based on the actual blob type
    let fileName = 'recording.mp3';
    let fileType = blob.type;
    
    if (blob.type.includes('webm')) {
      fileName = 'recording.webm';
      fileType = 'audio/webm';
      console.log('Using WebM format for AssemblyAI upload');
    } else if (blob.type.includes('wav')) {
      fileName = 'recording.wav';
      fileType = 'audio/wav';
      console.log('Using WAV format for AssemblyAI upload');
    } else {
      // Default to MP3
      fileName = 'recording.mp3';
      fileType = 'audio/mp3';
      console.log('Using MP3 format for AssemblyAI upload');
    }
    
    // Create a new blob with the correct type to ensure content-type header is correct
    const typedBlob = new Blob([await blob.arrayBuffer()], { type: fileType });
    
    // Convert the blob to a File object that the SDK can handle
    const file = new File([typedBlob], fileName, { type: fileType });
    
    console.log(`Uploading as ${fileName} with type ${fileType}, size: ${file.size} bytes`);
    
    // Upload the file using the SDK's upload method
    const uploadUrl = await client.files.upload(file);
    
    if (!uploadUrl) {
      throw new Error('Failed to upload file: No URL received');
    }
    
    console.log(`Successfully uploaded file. URL: ${uploadUrl}`);
    return uploadUrl;
  } catch (error) {
    console.error('Error uploading to AssemblyAI:', error);
    throw error;
  }
};

export const startTranscription = async (
  audioUrl: string, 
  apiKey: string,
  config: Partial<TranscriptionConfig> = {}
): Promise<string> => {
  try {
    console.log(`Starting transcription for URL: ${audioUrl}`);
    
    // Initialize AssemblyAI client
    const client = new AssemblyAI({ apiKey });
    
    // Merge default config with provided config
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      audio_url: audioUrl
    };

    // Validate config values
    if (finalConfig.content_safety_confidence && 
        (finalConfig.content_safety_confidence < 25 || finalConfig.content_safety_confidence > 100)) {
      throw new Error('Content safety confidence must be between 25 and 100');
    }

    if (finalConfig.speech_threshold && 
        (finalConfig.speech_threshold < 0 || finalConfig.speech_threshold > 1)) {
      throw new Error('Speech threshold must be between 0 and 1');
    }

    if (finalConfig.speakers_expected && 
        (finalConfig.speakers_expected < 1 || finalConfig.speakers_expected > 10)) {
      throw new Error('Number of expected speakers must be between 1 and 10');
    }
    
    // Start a transcription job
    const transcriptResponse = await client.transcripts.create(finalConfig);
    
    if (!transcriptResponse?.id) {
      throw new Error('Failed to start transcription: No transcript ID received');
    }
    
    console.log(`Successfully started transcription with ID: ${transcriptResponse.id}`);
    return transcriptResponse.id;
  } catch (error) {
    console.error('Error starting transcription:', error);
    throw error;
  }
};

export interface TranscriptionResult {
  text: string;
  status: string;
  confidence?: number;
  words?: any[];
  utterances?: any[];
  chapters?: any[];
  entities?: any[];
  highlights?: any[];
  summary?: string;
  sentiment_analysis_results?: any[];
  content_safety_labels?: any;
  iab_categories_result?: any;
}

export const pollTranscript = async (
  id: string,
  apiKey: string,
  maxAttempts: number = 30,
  interval: number = 3000
): Promise<TranscriptionResult> => {
  let attempts = 0;
  
  console.log(`Starting to poll for transcript ID: ${id}`);
  
  // Initialize AssemblyAI client
  const client = new AssemblyAI({ apiKey });
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for transcript ID: ${id}`);
      
      // Get the transcript
      const transcript = await client.transcripts.get(id);
      
      console.log(`Current transcript status: ${transcript.status}`);
      
      if (transcript.status === 'completed') {
        console.log(`Transcription completed! Text length: ${transcript.text?.length || 0} characters`);
        return {
          text: transcript.text || '',
          status: 'completed',
          confidence: transcript.confidence,
          words: transcript.words,
          utterances: transcript.utterances,
          chapters: transcript.chapters,
          entities: transcript.entities,
          highlights: transcript.auto_highlights_result?.results,
          summary: transcript.summary,
          sentiment_analysis_results: transcript.sentiment_analysis_results,
          content_safety_labels: transcript.content_safety_labels,
          iab_categories_result: transcript.iab_categories_result
        };
      }
      
      if (transcript.status === 'error') {
        console.error(`Transcription error: ${transcript.error}`);
        throw new Error(`Transcription error: ${transcript.error}`);
      }
      
      // Wait before next poll
      console.log(`Waiting ${interval/1000} seconds before next poll...`);
      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      console.error('Error polling transcript:', error);
      throw error;
    }
  }
  
  console.warn(`Polling timed out after ${maxAttempts} attempts.`);
  return {
    text: '',
    status: 'timeout'
  };
}; 