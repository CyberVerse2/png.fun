'use client';

import { NeoButton } from '@/components/neo-button';
import { RefreshCw, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PhotoPreviewScreenProps {
  photoUrl: string;
  onRetake: () => void;
  onSend: () => Promise<void> | void;
}

export function PhotoPreviewScreen({ photoUrl, onRetake, onSend }: PhotoPreviewScreenProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendClick = async () => {
    setIsSending(true);
    try {
      await onSend();
      // Note: isSending state will be reset when component unmounts
      // (which happens when PhotoPreviewScreen closes after successful send)
    } catch (error) {
      console.error('Error sending photo:', error);
      // Reset loading state on error so user can retry
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      <div className="relative flex-1 w-full bg-background">
        {/* Mock Camera View / Photo Preview */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-foreground neo-shadow">
            <img
              src={photoUrl || '/placeholder.svg'}
              alt="Captured photo"
              className="h-full w-full object-cover"
            />

            {/* Overlay UI */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
              <div className="bg-black/30 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
                PREVIEW
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-background p-6 pb-12 flex items-center justify-between gap-4">
        <NeoButton variant="secondary" onClick={onRetake} disabled={isSending} className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retake
        </NeoButton>
        <NeoButton
          variant="primary"
          onClick={handleSendClick}
          disabled={isSending}
          className="flex-1"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting..
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </>
          )}
        </NeoButton>
      </div>
    </div>
  );
}
