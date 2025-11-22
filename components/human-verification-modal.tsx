'use client';

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { NeoButton } from '@/components/neo-button';
import { ScanFace, Camera, CheckCircle2 } from 'lucide-react';
import { MiniKit, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js';
import { useState, useCallback, useRef } from 'react';

interface HumanVerificationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (photoUrl?: string) => void;
  isVerified?: boolean;
  walletAddress?: string;
}

export function HumanVerificationModal({
  isOpen,
  onOpenChange,
  onVerify,
  isVerified = false,
  walletAddress
}: HumanVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(isVerified);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = useCallback(async () => {
    // Skip verification if already verified
    if (isVerified) {
      console.log('[Verification] User already verified, skipping World ID check');
      setVerified(true);
      return;
    }

    if (!MiniKit.isInstalled()) {
      console.warn('MiniKit not installed, falling back to mock verification for browser testing');
      // For browser testing without MiniKit - show camera button
      setVerified(true);
      return;
    }

    setLoading(true);
    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        app_id: 'app_a9e1e8a3c65d60bcf0432ec93883b524', // Add App ID here
        action: 'verifyhuman',
        verification_level: VerificationLevel.Orb,
        signal: '' // Signal is optional but usually expected to be empty string if not used
      });

      if (finalPayload.status === 'success') {
        console.log('World ID verification successful, sending to backend...');
        const verifyRes = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payload: finalPayload as ISuccessResult,
            action: 'verifyhuman',
            signal: '', // Match the signal used in client verification
            walletAddress: walletAddress // Pass wallet address to mark user as verified
          })
        });

        const verifyData = await verifyRes.json();
        console.log('Backend verification response:', verifyData);

        // Check if backend verification succeeded
        if (verifyData.status === 200 || verifyData.verifyRes?.success) {
          console.log('Backend verification successful! Showing camera button...');
          // Verification successful - show camera button
          setVerified(true);
        } else {
          console.error('Verification failed backend check:', verifyData);
        }
      } else {
        console.error('World ID verification failed:', finalPayload);
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  }, [isVerified, walletAddress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Reading file:', file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        console.log('Image loaded, calling onVerify with photo');
        onOpenChange(false);
        setVerified(false);
        onVerify(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-muted h-20 w-20 rounded-full flex items-center justify-center mb-4">
            {verified ? (
              <Camera className="h-10 w-10 text-muted-foreground" />
            ) : (
              <ScanFace className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <DrawerTitle className="text-2xl font-black uppercase">
            {verified ? 'Take Photo' : 'Human Verification'}
          </DrawerTitle>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            {verified
              ? 'Tap the button below to open your camera and capture your photo.'
              : 'Please verify your World ID to capture and submit your daily challenge photo.'}
          </p>
        </DrawerHeader>
        <DrawerFooter className="pb-3 px-6">
          {verified ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <NeoButton variant="primary" size="lg" onClick={handleCameraClick} className="w-full">
                <Camera className="mr-2 h-5 w-5" />
                Open Camera
              </NeoButton>
            </>
          ) : (
            <NeoButton
              variant="primary"
              size="lg"
              onClick={handleVerify}
              className="w-full"
              disabled={loading}
            >
              <ScanFace className="mr-2 h-5 w-5" />
              {loading ? 'Verifying...' : 'Verify World ID'}
            </NeoButton>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
