'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NeoCard } from './neo-card';
import { Trophy, Zap, Flame } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';

interface ProfileData {
  username: string;
  avatarUrl: string;
  wld: number;
  wins: number;
  streak: number;
  totalWldEarned: number;
  submissions: Array<{
    id: string;
    imageUrl: string;
    challenge: string;
    votes: number;
    rank: number;
  }>;
  predictions: Array<{
    id: string;
    challenge: string;
    status: 'active' | 'won' | 'lost';
    amount: number;
    imageUrl: string;
    photographer: {
      username: string;
      avatarUrl: string;
    };
  }>;
}

interface ProfileScreenProps {
  data: ProfileData;
}

export function ProfileScreen({ data }: ProfileScreenProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Use real user data if authenticated, otherwise fall back to mock data
  const displayUsername =
    isAuthenticated && session?.user?.username ? session.user.username : data.username;
  const displayAvatar =
    isAuthenticated && session?.user?.profilePictureUrl
      ? session.user.profilePictureUrl
      : data.avatarUrl;
  const displayWalletAddress = session?.user?.walletAddress || null;

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-24 pt-6">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <Avatar className="h-24 w-24 border-[5px] border-foreground mx-auto mb-4 neo-shadow">
          <AvatarImage src={displayAvatar || '/placeholder.svg'} />
          <AvatarFallback className="text-3xl font-black">
            {displayUsername[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-black uppercase mb-2">{displayUsername}</h1>
        {displayWalletAddress && (
          <p className="text-xs text-muted-foreground mb-2 font-mono">
            {displayWalletAddress.slice(0, 6)}...{displayWalletAddress.slice(-4)}
          </p>
        )}
        <Badge className="bg-primary text-primary-foreground font-black border-2 border-foreground">
          <Zap className="h-3 w-3 mr-1" />
          {data.wld} WLD
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <NeoCard className="text-center p-2 py-3 flex flex-col items-center justify-center">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md inline-flex mb-1.5 shadow-sm">
            <Trophy className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="text-2xl font-black">{data.wins}</div>
          <div className="text-[10px] font-black uppercase text-muted-foreground">Wins</div>
        </NeoCard>

        <NeoCard className="text-center p-2 py-3 flex flex-col items-center justify-center">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md inline-flex mb-1.5 shadow-sm">
            <Flame className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="text-2xl font-black">{data.streak}</div>
          <div className="text-[10px] font-black uppercase text-muted-foreground">Streak</div>
        </NeoCard>

        <NeoCard className="text-center p-2 py-3 flex flex-col items-center justify-center">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md inline-flex mb-1.5 shadow-sm">
            <Zap className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="text-2xl font-black">{data.totalWldEarned}</div>
          <div className="text-[10px] font-black uppercase text-muted-foreground">Earned</div>
        </NeoCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="predictions" className="w-full">
        {/* Increased height to h-14, added p-1 padding, and ensured full width for a chunky neobrutalist look matching the reference image */}
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 neo-border neo-shadow mb-4">
          <TabsTrigger
            value="predictions"
            className="font-black uppercase h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Predictions
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            className="font-black uppercase h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-3">
          {data.predictions.map((prediction) => (
            <NeoCard key={prediction.id} className="p-3 overflow-hidden">
              <div className="flex gap-3">
                {/* Predicted Image */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <img
                    src={prediction.imageUrl || '/placeholder.svg'}
                    alt="Predicted winner"
                    className="w-full h-full object-cover rounded-md border-2 border-black"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-black text-xs uppercase text-muted-foreground truncate mr-2">
                        {prediction.challenge}
                      </div>
                      <Badge
                        className={`font-black uppercase text-[10px] h-5 ${
                          prediction.status === 'active'
                            ? 'bg-primary text-primary-foreground'
                            : prediction.status === 'won'
                            ? 'bg-green-600 text-white'
                            : 'bg-muted text-muted-foreground'
                        } border border-foreground`}
                      >
                        {prediction.status}
                      </Badge>
                    </div>

                    {/* Photographer Info */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Avatar className="h-4 w-4 border border-foreground">
                        <AvatarImage
                          src={prediction.photographer.avatarUrl || '/placeholder.svg'}
                        />
                        <AvatarFallback className="text-[8px]">
                          {prediction.photographer.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold truncate">
                        by {prediction.photographer.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-black">
                    <span>Bet:</span>
                    <span className="flex items-center gap-1 bg-black/5 px-1.5 py-0.5 rounded text-foreground">
                      <Zap className="h-3 w-3" fill="currentColor" />
                      {prediction.amount} WLD
                    </span>
                  </div>
                </div>
              </div>
            </NeoCard>
          ))}
        </TabsContent>

        <TabsContent value="submissions" className="grid grid-cols-2 gap-2">
          {data.submissions.map((submission) => (
            <NeoCard key={submission.id} className="overflow-hidden p-0">
              <div className="aspect-square bg-muted relative">
                <img
                  src={submission.imageUrl || '/placeholder.svg'}
                  alt={submission.challenge}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                  <div className="text-white text-xs font-black">#{submission.rank}</div>
                  <div className="text-white text-xs font-bold opacity-90">
                    {submission.votes} votes
                  </div>
                </div>
              </div>
            </NeoCard>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
