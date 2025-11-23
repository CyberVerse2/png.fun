'use client';

import { walletAuth } from '@/auth/wallet';
import { NeoButton } from './neo-button';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useState } from 'react';

interface AuthButtonProps {
  onSuccess?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const AuthButton = ({ onSuccess, disabled, children }: AuthButtonProps) => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();

  const onClick = useCallback(async () => {
    console.log('[AuthButton] ========================================');
    console.log('[AuthButton] Button clicked');
    console.log('[AuthButton] State check:', {
      isInstalled,
      isPending,
      disabled
    });

    if (!isInstalled || isPending || disabled) {
      console.log('[AuthButton] Action blocked:', {
        reason: !isInstalled ? 'MiniKit not installed' : isPending ? 'Already pending' : 'Disabled'
      });
      console.log('[AuthButton] ========================================');
      return;
    }

    setIsPending(true);
    console.log('[AuthButton] Starting authentication flow...');

    try {
      const success = await walletAuth();
      console.log('[AuthButton] Authentication flow completed:', {
        success,
        timestamp: new Date().toISOString()
      });

      if (success) {
        console.log('[AuthButton] ✓ Authentication successful!');
        if (onSuccess) {
          console.log('[AuthButton] Calling onSuccess callback...');
          onSuccess();
        }
      } else {
        console.warn('[AuthButton] ✗ Authentication failed or was cancelled');
      }
    } catch (error) {
      console.error('[AuthButton] ERROR during authentication:', error);
      console.error('[AuthButton] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsPending(false);
      console.log('[AuthButton] ========================================');
    }
  }, [isInstalled, isPending, disabled, onSuccess]);

  return (
    <NeoButton
      variant="primary"
      size="lg"
      onClick={onClick}
      disabled={isPending || disabled || !isInstalled}
      className="w-full"
    >
      {isPending ? 'Connecting...' : children || 'Connect World ID'}
    </NeoButton>
  );
};
