
"use client";

import React, { useState, useRef, useCallback, type DragEvent, type ClipboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Paperclip, Plus, Send, Mic, Image as LucideImage, X, FileText, StopCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  name: string;
  type: 'image'; // Expand later for other file types if needed
  dataUri: string;
  file?: File; // Original file object, optional
}

interface AITaskAssistantInputProps {
  onSubmit: (description: string, imageDataUris?: string[]) => void;
  isLoading: boolean;
}

const AITaskAssistantInput: React.FC<AITaskAssistantInputProps> = ({ onSubmit, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Voice Input State
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechApiAvailable, setIsSpeechApiAvailable] = useState(false);
  const [microphonePermissionStatus, setMicrophonePermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTranscriptRef = useRef<string>(''); // To hold final transcript parts


  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_FILES = 3;
  const MAX_FILE_SIZE_MB = 5;

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setIsSpeechApiAvailable(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptPart = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptPart += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscriptPart) {
            accumulatedTranscriptRef.current += finalTranscriptPart + ' '; // Add space after each final part
        }
        setInputText(accumulatedTranscriptRef.current + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        let errorMessage = 'Speech recognition error.';
        if (event.error === 'no-speech') errorMessage = 'No speech detected. Please try again.';
        else if (event.error === 'audio-capture') errorMessage = 'Microphone problem. Please check your microphone.';
        else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please enable it in browser settings.';
          setMicrophonePermissionStatus('denied');
        }
        toast({ title: "Voice Input Error", description: errorMessage, variant: "destructive" });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

    } else {
      setIsSpeechApiAvailable(false);
    }

    // Cleanup function
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort(); // Stop any active recognition
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current = null;
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isRecording) { // If user types while not recording, assume typed input is the new base
        accumulatedTranscriptRef.current = e.target.value;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      if (mediaFiles.length + files.length > MAX_FILES) {
        toast({ title: "Upload Limit", description: `You can upload a maximum of ${MAX_FILES} images.`, variant: "destructive" });
        return;
      }
      Array.from(files).forEach(file => processFile(file));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsPopoverOpen(false);
  };

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File Too Large", description: `Image "${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`, variant: "destructive" });
        return;
    }
    if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: `"${file.name}" is not a supported image type.`, variant: "destructive" });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      setMediaFiles(prev => [
        ...prev,
        { id: Date.now().toString() + Math.random(), name: file.name, type: 'image', dataUri, file }
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const items = event.clipboardData?.items;
    if (items && mediaFiles.length < MAX_FILES) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            event.preventDefault();
            processFile(new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type }));
            break; 
          }
        }
      }
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleToggleRecording = async () => {
    if (!isSpeechApiAvailable) {
      toast({ title: "Voice Input Not Supported", description: "Your browser does not support speech recognition.", variant: "destructive" });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      // Check permission status before attempting to start
      if (microphonePermissionStatus === 'denied') {
        toast({ title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser settings.", variant: "destructive" });
        return;
      }
      
      try {
        // Attempt to get microphone permission if not already granted
        // This is a common pattern, as starting recognition often implicitly asks
        if (microphonePermissionStatus === 'prompt') {
            // Some browsers require a direct user media request first.
            // This might be redundant if recognition.start() also prompts.
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                setMicrophonePermissionStatus('granted');
            } catch (permError: any) {
                 if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
                    setMicrophonePermissionStatus('denied');
                    toast({ title: "Microphone Access Denied", description: "Please enable microphone access.", variant: "destructive" });
                    return;
                 }
                 throw permError; // Re-throw other errors
            }
        }

        if (recognitionRef.current) {
          accumulatedTranscriptRef.current = inputText; // Sync accumulated with current input before starting new recording
          recognitionRef.current.start();
          setIsRecording(true);
          toast({ title: "Recording Started", description: "Listening for your input...", variant: "default" });
        }
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        toast({ title: "Could Not Start Recording", description: "Please ensure microphone access is allowed.", variant: "destructive" });
        setIsRecording(false);
      }
    }
    setIsPopoverOpen(false);
  };


  const handleSubmit = () => {
    if (isLoading || (!inputText.trim() && mediaFiles.length === 0)) return;
    if (isRecording) {
      recognitionRef.current?.stop(); // Stop recording if active before submit
    }
    const imageDataUris = mediaFiles.map(mf => mf.dataUri);
    onSubmit(inputText.trim(), imageDataUris);
    setInputText('');
    setMediaFiles([]);
    accumulatedTranscriptRef.current = ''; // Clear accumulated transcript
  };

  const isSubmitDisabled = isLoading || (inputText.trim() === '' && mediaFiles.length === 0);
  const isVoiceOptionDisabled = !isSpeechApiAvailable || microphonePermissionStatus === 'denied';


  return (
    <div className="space-y-2">
      {mediaFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md bg-background/30">
          {mediaFiles.map(mf => (
            <div key={mf.id} className="relative group bg-muted p-1.5 rounded-md shadow-sm">
              {mf.type === 'image' && (
                <img src={mf.dataUri} alt={mf.name} className="h-12 w-12 object-cover rounded" />
              )}
              <button
                onClick={() => handleRemoveMedia(mf.id)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${mf.name}`}
              >
                <X className="h-3 w-3" />
              </button>
              <p className="text-xs text-muted-foreground truncate max-w-[4rem] mt-0.5" title={mf.name}>{mf.name}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 p-2 border border-input rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={isLoading || mediaFiles.length >= MAX_FILES}>
              <Plus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1 bg-popover text-popover-foreground">
            <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={handleToggleRecording}
                disabled={isVoiceOptionDisabled}
                title={isVoiceOptionDisabled ? (isSpeechApiAvailable ? "Microphone access denied" : "Voice input not available") : (isRecording ? "Stop Voice Recording" : "Start Voice Recording")}
            >
              {isRecording ? <StopCircle className="mr-2 h-4 w-4 text-destructive animate-pulse" /> : <Mic className={cn("mr-2 h-4 w-4", isVoiceOptionDisabled && "opacity-50")} />} 
              {isRecording ? "Stop Voice" : "Record Voice"}
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={handleTriggerUpload} disabled={mediaFiles.length >= MAX_FILES}>
              <LucideImage className="mr-2 h-4 w-4" /> Upload Image
            </Button>
          </PopoverContent>
        </Popover>
        <Input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onPaste={handlePaste}
          placeholder="Describe your goal or task... (or paste an image)"
          className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
          onKeyDown={(e) => { if (e.key === 'Enter' && !isSubmitDisabled) handleSubmit(); }}
        />
        <Button variant="ghost" size="icon" onClick={handleSubmit} disabled={isSubmitDisabled} className={cn("text-muted-foreground", !isSubmitDisabled && "text-primary hover:text-primary/80")}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>
       {microphonePermissionStatus === 'denied' && isSpeechApiAvailable && (
        <p className="text-xs text-destructive text-center px-1 pt-1">
            Microphone access is denied. Please enable it in your browser settings to use voice input.
        </p>
      )}
      {!isSpeechApiAvailable && (
         <p className="text-xs text-muted-foreground text-center px-1 pt-1">
            Voice input (speech-to-text) is not supported by your browser.
        </p>
      )}
    </div>
  );
};

export default AITaskAssistantInput;

