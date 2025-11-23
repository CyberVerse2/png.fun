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
    const initializeAndAuth = async () => {
      console.log('[MiniKit] Initializing MiniKit...');
      MiniKit.install('app_a7a17919b878ba65fbcbcc116bde80be');

      // Auto-attempt sign-in on app launch
      if (MiniKit.isInstalled()) {
        console.log('[MiniKit] Attempting auto-authentication...');
        try {
          const res = await fetch('/api/nonce');
          const { nonce } = await res.json();

          const result = await MiniKit.commandsAsync.walletAuth({
            nonce,
            requestId: '0',
            expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            statement: 'Sign in to PNG.FUN'
          } as WalletAuthInput);

          const { finalPayload } = result;

          if (finalPayload?.status === 'success') {
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
              console.log('[MiniKit] Auto-authentication successful');
              setUserData({
                walletAddress: finalPayload.address,
                username: MiniKit.user?.username,
                profilePictureUrl: MiniKit.user?.profilePictureUrl,
                isAuthenticated: true,
                isLoading: false
              });
              return;
            }
          }
        } catch (error) {
          console.log('[MiniKit] Auto-authentication failed or cancelled:', error);
        }
      }

      // If auto-auth fails or MiniKit not installed, set loading to false
      setUserData((prev) => ({ ...prev, isLoading: false }));
    };

    initializeAndAuth();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!MiniKit.isInstalled()) return false;

    try {
      const res = await fetch('/api/nonce');
      const { nonce } = await res.json();

      const result = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: '0',
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: 'Sign in to PNG.FUN'
      } as WalletAuthInput);

      const { finalPayload } = result;

      if (finalPayload?.status === 'error') return false;

      if (finalPayload.status === 'success') {
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
          setUserData({
            walletAddress: finalPayload.address,
            username: MiniKit.user?.username,
            profilePictureUrl: MiniKit.user?.profilePictureUrl,
            isAuthenticated: true,
            isLoading: false
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []); // Empty dependency array since authenticate doesn't depend on userData state

  return (
    <UserContext.Provider value={{ user: userData, authenticate }}>{children}</UserContext.Provider>
  );
}
