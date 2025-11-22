'use client';

import { ReactNode, useEffect, createContext, useContext, useState } from 'react';
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

    // Check local storage for existing session
    const storedSession = localStorage.getItem('minikit_user_session');
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        setUserData({
          ...sessionData,
          isAuthenticated: true,
          isLoading: false
        });
        console.log('[MiniKitProvider] Restored session from local storage');
        return;
      } catch (e) {
        console.error('[MiniKitProvider] Error parsing stored session:', e);
        localStorage.removeItem('minikit_user_session');
      }
    }

    // No session found, just stop loading
    // Do NOT auto-authenticate which causes the modal to pop up
    setUserData((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const authenticate = async (): Promise<boolean> => {
    if (!MiniKit.isInstalled()) {
      console.log('MiniKit not installed, skipping auth');
      return false;
    }

    try {
      // Get nonce from backend
      const res = await fetch('/api/nonce');
      const { nonce } = await res.json();

      // Request wallet authentication
      const { commandPayload: generateMessageResult, finalPayload } =
        await MiniKit.commandsAsync.walletAuth({
          nonce,
          requestId: '0', // Optional, but good practice
          expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          statement: 'Sign in to PNG.FUN'
        } as WalletAuthInput);

      if (finalPayload.status === 'success') {
        // Verify on backend
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

          // Persist session
          localStorage.setItem(
            'minikit_user_session',
            JSON.stringify({
              walletAddress: finalPayload.address,
              username: MiniKit.user?.username,
              profilePictureUrl: MiniKit.user?.profilePictureUrl
            })
          );

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  return (
    <UserContext.Provider value={{ user: userData, authenticate }}>{children}</UserContext.Provider>
  );
}
