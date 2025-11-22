'use client';

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { NeoButton } from '@/components/neo-button';
import { Bell } from 'lucide-react';
import { MiniKit, Permission } from '@worldcoin/minikit-js';
import { useState } from 'react';

interface NotificationPromptProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (enabled: boolean) => void;
}

export function NotificationPrompt({ isOpen, onOpenChange, onComplete }: NotificationPromptProps) {
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    if (!MiniKit.isInstalled()) {
      console.log('[NotificationPrompt] MiniKit not installed, skipping');
      onComplete(false);
      return;
    }

    setLoading(true);
    try {
      console.log('[NotificationPrompt] Requesting notification permission...');
      const { finalPayload } = await MiniKit.commandsAsync.requestPermission({
        permission: Permission.Notifications
      });

      console.log('[NotificationPrompt] Permission result:', finalPayload);

      if (finalPayload.status === 'success' || finalPayload.error_code === 'already_granted') {
        console.log('[NotificationPrompt] Notifications enabled');
        onComplete(true);
      } else {
        console.log('[NotificationPrompt] Notifications denied');
        onComplete(false);
      }
    } catch (error) {
      console.error('[NotificationPrompt] Error requesting permission:', error);
      onComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('[NotificationPrompt] User skipped notifications');
    onComplete(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-10 w-10 text-primary" />
          </div>
          <DrawerTitle className="text-2xl font-black uppercase">Enable Notifications</DrawerTitle>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Get notified when your photos receive votes, when you win challenges, and about new
            daily challenges!
          </p>
        </DrawerHeader>
        <DrawerFooter className="pb-8 px-6">
          <NeoButton
            variant="primary"
            size="lg"
            onClick={handleEnable}
            disabled={loading}
            className="w-full"
          >
            <Bell className="mr-2 h-5 w-5" />
            {loading ? 'Requesting...' : 'Enable Notifications'}
          </NeoButton>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="mt-3 text-sm font-bold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            Maybe Later
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
