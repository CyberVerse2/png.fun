import { hashNonce } from '@/auth/wallet/client-helpers';
import { MiniAppWalletAuthSuccessPayload, MiniKit, verifySiweMessage } from '@worldcoin/minikit-js';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/lib/supabase';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        nonce: { type: 'text' },
        signedNonce: { type: 'text' },
        finalPayloadJson: { type: 'text' }
      },
      authorize: async (credentials) => {
        const { nonce, signedNonce, finalPayloadJson } = credentials as {
          nonce: string;
          signedNonce: string;
          finalPayloadJson: string;
        };

        const expectedSignedNonce = await hashNonce({ nonce });
        if (signedNonce !== expectedSignedNonce) return null;

        const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);
        if (!result.isValid) return null;

        // Get user info from MiniKit
        const userInfo = await MiniKit.getUserInfo(finalPayload.address);

        // Create or update user in Supabase
        if (supabaseAdmin) {
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('wallet_address', finalPayload.address)
            .single();

          const userData = {
            wallet_address: finalPayload.address,
            username: userInfo?.username || null,
            profile_picture_url: userInfo?.profilePictureUrl || null,
            updated_at: new Date().toISOString()
          };

          if (existingUser) {
            await supabaseAdmin
              .from('users')
              .update(userData)
              .eq('wallet_address', finalPayload.address);
          } else {
            await supabaseAdmin.from('users').insert(userData);
          }
        }

        return {
          id: finalPayload.address,
          walletAddress: finalPayload.address,
          username: userInfo?.username || null,
          profilePictureUrl: userInfo?.profilePictureUrl || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.username = token.username as string | null;
        session.user.profilePictureUrl = token.profilePictureUrl as string | null;
      }
      return session;
    }
  }
});
