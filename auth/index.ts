import { hashNonce } from '@/auth/wallet/client-helpers';
import { MiniAppWalletAuthSuccessPayload, MiniKit, verifySiweMessage } from '@worldcoin/minikit-js';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'World ID Wallet',
      credentials: {
        nonce: { type: 'text' },
        signedNonce: { type: 'text' },
        finalPayloadJson: { type: 'text' }
      },
      authorize: async (credentials) => {
        console.log('[Auth] [NextAuth] ========================================');
        console.log('[Auth] [NextAuth] Authorize function called');
        console.log('[Auth] [NextAuth] Credentials received:', {
          hasNonce: !!credentials?.nonce,
          hasSignedNonce: !!credentials?.signedNonce,
          hasFinalPayload: !!credentials?.finalPayloadJson
        });

        if (!credentials?.nonce || !credentials?.signedNonce || !credentials?.finalPayloadJson) {
          console.error('[Auth] [NextAuth] ERROR: Missing required credentials');
          console.log('[Auth] [NextAuth] ========================================');
          return null;
        }

        const { nonce, signedNonce, finalPayloadJson } = credentials as {
          nonce: string;
          signedNonce: string;
          finalPayloadJson: string;
        };

        console.log('[Auth] [NextAuth] Step 1: Verifying nonce integrity...');
        console.log('[Auth] [NextAuth] Nonce:', nonce.substring(0, 8) + '...');
        console.log(
          '[Auth] [NextAuth] Signed nonce received:',
          signedNonce.substring(0, 16) + '...'
        );

        // Verify the nonce hasn't been tampered with
        const expectedSignedNonce = await hashNonce({ nonce });
        console.log(
          '[Auth] [NextAuth] Expected signed nonce:',
          expectedSignedNonce.substring(0, 16) + '...'
        );

        if (signedNonce !== expectedSignedNonce) {
          console.error('[Auth] [NextAuth] ✗ Nonce verification FAILED - nonce was tampered with!');
          console.log('[Auth] [NextAuth] Comparison:', {
            received: signedNonce.substring(0, 16),
            expected: expectedSignedNonce.substring(0, 16),
            match: signedNonce === expectedSignedNonce
          });
          console.log('[Auth] [NextAuth] ========================================');
          return null;
        }

        console.log('[Auth] [NextAuth] ✓ Nonce verification passed');

        console.log('[Auth] [NextAuth] Step 2: Parsing SIWE payload...');
        let finalPayload: MiniAppWalletAuthSuccessPayload;
        try {
          finalPayload = JSON.parse(finalPayloadJson) as MiniAppWalletAuthSuccessPayload;
          console.log('[Auth] [NextAuth] Payload parsed successfully:', {
            address: finalPayload.address,
            hasMessage: !!finalPayload.message,
            hasSignature: !!finalPayload.signature
          });
        } catch (error) {
          console.error('[Auth] [NextAuth] ERROR: Failed to parse finalPayloadJson:', error);
          console.log('[Auth] [NextAuth] ========================================');
          return null;
        }

        // Verify the SIWE message
        console.log('[Auth] [NextAuth] Step 3: Verifying SIWE message signature...');
        const result = await verifySiweMessage(finalPayload, nonce);
        console.log('[Auth] [NextAuth] SIWE verification result:', {
          isValid: result.isValid,
          error: result.error
        });

        if (!result.isValid) {
          console.error('[Auth] [NextAuth] ✗ SIWE verification FAILED:', result.error);
          console.log('[Auth] [NextAuth] ========================================');
          return null;
        }

        console.log('[Auth] [NextAuth] ✓ SIWE message verified successfully');

        // Get user info from MiniKit
        console.log('[Auth] [NextAuth] Step 4: Fetching user info from MiniKit...');
        console.log('[Auth] [NextAuth] Wallet address:', finalPayload.address);

        let userInfo;
        try {
          userInfo = await MiniKit.getUserInfo(finalPayload.address);
          console.log('[Auth] [NextAuth] User info retrieved:', {
            hasUsername: !!userInfo?.username,
            hasProfilePicture: !!userInfo?.profilePictureUrl,
            username: userInfo?.username || 'null',
            profilePictureUrl: userInfo?.profilePictureUrl ? 'present' : 'null'
          });
        } catch (error) {
          console.error('[Auth] [NextAuth] WARNING: Failed to fetch user info:', error);
          console.log('[Auth] [NextAuth] Continuing with null user info...');
          userInfo = null;
        }

        const user = {
          id: finalPayload.address,
          walletAddress: finalPayload.address,
          username: userInfo?.username || null,
          profilePictureUrl: userInfo?.profilePictureUrl || null
        };

        console.log('[Auth] [NextAuth] ✓ User object created:', {
          id: user.id.substring(0, 10) + '...',
          username: user.username || 'null',
          hasProfilePicture: !!user.profilePictureUrl
        });
        console.log('[Auth] [NextAuth] ========================================');

        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log('[Auth] [JWT Callback] ========================================');
      console.log('[Auth] [JWT Callback] JWT callback triggered:', {
        hasUser: !!user,
        hasToken: !!token,
        trigger: trigger || 'default'
      });

      // Add user data to the token on sign in
      if (user) {
        console.log('[Auth] [JWT Callback] Adding user data to token...');
        console.log('[Auth] [JWT Callback] User data:', {
          id: user.id?.substring(0, 10) + '...',
          walletAddress: user.walletAddress?.substring(0, 10) + '...',
          username: user.username || 'null',
          hasProfilePicture: !!user.profilePictureUrl
        });

        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;

        console.log('[Auth] [JWT Callback] ✓ Token updated with user data');
      } else {
        console.log('[Auth] [JWT Callback] No user data, returning existing token');
        console.log('[Auth] [JWT Callback] Existing token data:', {
          hasUserId: !!token.userId,
          hasWalletAddress: !!token.walletAddress,
          username: token.username || 'null'
        });
      }

      console.log('[Auth] [JWT Callback] ========================================');
      return token;
    },
    async session({ session, token }) {
      console.log('[Auth] [Session Callback] ========================================');
      console.log('[Auth] [Session Callback] Session callback triggered');
      console.log('[Auth] [Session Callback] Token data:', {
        hasUserId: !!token.userId,
        hasWalletAddress: !!token.walletAddress,
        username: token.username || 'null',
        hasProfilePicture: !!token.profilePictureUrl
      });

      // Add user data from token to session
      if (token.userId) {
        console.log('[Auth] [Session Callback] Adding token data to session...');
        session.user.id = token.userId as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.username = token.username as string | null;
        session.user.profilePictureUrl = token.profilePictureUrl as string | null;

        console.log('[Auth] [Session Callback] ✓ Session updated:', {
          id: session.user.id?.substring(0, 10) + '...',
          walletAddress: session.user.walletAddress?.substring(0, 10) + '...',
          username: session.user.username || 'null',
          hasProfilePicture: !!session.user.profilePictureUrl
        });
      } else {
        console.warn(
          '[Auth] [Session Callback] WARNING: No userId in token, session may be incomplete'
        );
      }

      console.log('[Auth] [Session Callback] ========================================');
      return session;
    }
  },
  pages: {
    signIn: '/', // Redirect to homepage for sign in
    error: '/' // Redirect to homepage on error
  }
});
