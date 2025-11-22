'use client';

import { ReactNode, useEffect, createContext, useContext, useState, useCallback } from 'react';
import { MiniKit, WalletAuthInput } from '@worldcoin/minikit-js';

interface UserData {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UserContextType {
  user: UserData;
  authenticate: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType>({
  user: { isAuthenticated: false, isLoading: true },
  authenticate: async () => false
});

export const useUser = () => useContext(UserContext).user;
export const useAuth = () => useContext(UserContext).authenticate;

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>({ isAuthenticated: false, isLoading: true });

  useEffect(() => {
    MiniKit.install('app_a9e1e8a3c65d60bcf0432ec93883b524');

    const checkExistingSession = async () => {
      // Check if MiniKit has an existing session (MiniKit persists sessions natively)
      console.log('[MiniKitProvider] Checking for existing MiniKit session...');
      console.log('[MiniKitProvider] MiniKit.user:', MiniKit.user);

      if (MiniKit.isInstalled() && MiniKit.user?.username) {
        // MiniKit has a persisted session
        console.log('[MiniKitProvider] Found existing MiniKit session:', {
          username: MiniKit.user.username,
          hasProfilePicture: !!MiniKit.user.profilePictureUrl
        });

        // Query database to get wallet address for this username
        try {
          console.log(
            '[MiniKitProvider] Querying DB for user with username:',
            MiniKit.user.username
          );
          const response = await fetch(
            `/api/user/by-username?username=${encodeURIComponent(MiniKit.user.username)}`
          );

          if (response.ok) {
            const { user: dbUser } = await response.json();
            console.log('[MiniKitProvider] Found user in DB:', dbUser);

            // User exists in DB - restore full session
            setUserData({
              walletAddress: dbUser.wallet_address,
              username: MiniKit.user.username,
              profilePictureUrl: MiniKit.user.profilePictureUrl,
              isAuthenticated: true, // ← User is authenticated!
              isLoading: false
            });
          } else {
            console.log('[MiniKitProvider] User not found in DB, needs to complete sign-in');
            // MiniKit has session but user not in our DB yet - need to authenticate
            setUserData({
              walletAddress: undefined,
              username: MiniKit.user.username,
              profilePictureUrl: MiniKit.user.profilePictureUrl,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } catch (error) {
          console.error('[MiniKitProvider] Error checking DB for user:', error);
          setUserData({
            walletAddress: undefined,
            username: MiniKit.user.username,
            profilePictureUrl: MiniKit.user.profilePictureUrl,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        // No session found
        console.log('[MiniKitProvider] No existing MiniKit session found');
        setUserData((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkExistingSession();
  }, []);

  // Memoize authenticate function to prevent unnecessary re-renders
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!MiniKit.isInstalled()) {
      console.log('MiniKit not installed, skipping auth');
      return false;
    }

    try {
      // Get nonce from backend
      console.log('[MiniKitProvider] Fetching nonce...');
      const res = await fetch('/api/nonce');
      const { nonce } = await res.json();
      console.log('[MiniKitProvider] Received nonce:', nonce);

      // Request wallet authentication
      console.log('[MiniKitProvider] Starting wallet auth with nonce:', nonce);
      console.log('[MiniKitProvider] MiniKit.isInstalled():', MiniKit.isInstalled());
      console.log('[MiniKitProvider] About to call MiniKit.commandsAsync.walletAuth...');

      const result = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: '0',
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: 'Sign in to PNG.FUN'
      } as WalletAuthInput);

      console.log('[MiniKitProvider] walletAuth returned:', result);
      const { commandPayload: generateMessageResult, finalPayload } = result;
      console.log('[MiniKitProvider] Wallet auth completed, status:', finalPayload?.status);

      if (finalPayload?.status === 'error') {
        console.error('[MiniKitProvider] Wallet auth error:', finalPayload);
        return false;
      }

      if (finalPayload.status === 'success') {
        // Verify on backend
        console.log('[MiniKitProvider] Verifying with backend, using nonce:', nonce);
        const verifyRes = await fetch('/api/complete-siwe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: finalPayload,
            nonce,
            username: MiniKit.user?.username,
            profilePictureUrl: MiniKit.user?.profilePictureUrl
          })
        });

        const verifyData = await verifyRes.json();

        if (verifyData.isValid) {
          // Get user data from MiniKit
          const newUserData = {
            walletAddress: finalPayload.address,
            username: MiniKit.user?.username,
            profilePictureUrl: MiniKit.user?.profilePictureUrl,
            isAuthenticated: true,
            isLoading: false
          };

          setUserData(newUserData);
          console.log('[MiniKitProvider] Authentication successful, session data:', {
            walletAddress: finalPayload.address,
            username: MiniKit.user?.username,
            hasPfp: !!MiniKit.user?.profilePictureUrl
          });

          // Note: MiniKit SDK persists session natively, no localStorage needed
          // Session will be available via MiniKit.user on subsequent page loads

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }, []); // Empty dependency array since authenticate doesn't depend on userData state

  return (
    <UserContext.Provider value={{ user: userData, authenticate }}>{children}</UserContext.Provider>
  );
}
