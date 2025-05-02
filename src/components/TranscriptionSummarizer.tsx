import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Clipboard, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SummaryPoint {
  text: string;
  category?: string;
}

export function TranscriptionSummarizer() {
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState<SummaryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const summarizeTranscription = async () => {
    if (!transcription.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a transcription to summarize",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Here you would typically call an API to process the transcription
      // For now, we'll use a simple mock implementation
      const mockSummary = [
        { text: "Project timeline extended by 2 weeks", category: "Timeline" },
        { text: "New feature requirements added to scope", category: "Scope" },
        { text: "Team to focus on performance optimization", category: "Focus" },
        { text: "Budget increased by 15%", category: "Budget" }
      ];
      
      setSummary(mockSummary);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to summarize transcription",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const text = summary
      .map(point => `• ${point.text}${point.category ? ` (${point.category})` : ''}`)
      .join('\n');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Transcription Summarizer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your audio transcription here..."
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            className="min-h-[200px]"
          />
          <Button 
            onClick={summarizeTranscription}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Summarizing...
              </>
            ) : (
              'Summarize'
            )}
          </Button>
        </CardContent>
      </Card>

      {summary.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Summary</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {summary.map((point, index) => (
                  <div key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <div>
                      <p className="font-medium">{point.text}</p>
                      {point.category && (
                        <p className="text-sm text-muted-foreground">
                          {point.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 