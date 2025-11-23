import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      walletAddress: string;
      username: string | null;
      profilePictureUrl: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    walletAddress: string;
    username: string | null;
    profilePictureUrl: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    walletAddress?: string;
    username?: string | null;
    profilePictureUrl?: string | null;
  }
}
