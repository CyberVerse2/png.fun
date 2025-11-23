'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NeoCard } from './neo-card';
import { NeoButton } from './neo-button';
import { Trophy, Zap } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl: string;
  wld: number;
  wins: number;
  imageUrl: string;
}

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  currentUser?: Partial<LeaderboardEntry>;
}

export function LeaderboardScreen({
  entries,
  currentUserRank,
  currentUser
}: LeaderboardScreenProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'all-time'>('today');
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Debug logging for sticky card
  console.log('[LeaderboardScreen] Sticky card check:', {
    currentUserRank,
    isGreaterThan3: currentUserRank ? currentUserRank > 3 : false,
    currentUser,
    shouldShow: currentUserRank && currentUserRank > 3
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-24">
      <div className="flex gap-2 mb-6 sticky top-5 z-10 bg-background/95 backdrop-blur pt-5 pb-2 -mt-4">
        <NeoButton
          className="flex-1"
          variant={timeframe === 'today' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTimeframe('today')}
        >
          Today
        </NeoButton>
        <NeoButton
          className="flex-1"
          variant={timeframe === 'all-time' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTimeframe('all-time')}
        >
          All Time
        </NeoButton>
      </div>

      {/* Yesterday's Winner - Only show when in "today" view */}
      <AnimatePresence>
        {timeframe === 'today' && entries[0] && (
          <motion.div
            key="yesterday-winner"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <NeoCard className="overflow-hidden p-0 mt-5">
              <div className="bg-primary py-3 px-4 border-b-2 border-black flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-primary-foreground fill-current" />
                <h2 className="text-primary-foreground font-black uppercase text-sm tracking-wider">
                  Yesterday's Winner
                </h2>
              </div>
              <div className="relative aspect-video bg-muted">
                <img
                  src={entries[0].imageUrl || '/placeholder.svg'}
                  alt={`Winner ${entries[0].username}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="mb-2">
                    <span className="inline-block bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase mb-1">
                      Theme
                    </span>
                    <h3 className="text-xl font-black leading-tight">"Golden Hour Glow"</h3>
                  </div>

                  <div className="flex items-center gap-3 mt-3 bg-black/40 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                    <Avatar className="h-10 w-10 border-2 border-primary rounded-lg">
                      <AvatarImage src={entries[0].avatarUrl || '/placeholder.svg'} />
                      <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                        {entries[0].username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-black text-sm">{entries[0].username}</div>
                      <div className="font-bold text-xs opacity-90 flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-yellow-400" />
                        Winner
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </NeoCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium */}
      {topThree.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-xs font-black uppercase text-muted-foreground mb-3">Top 3</h2>
          <div className="flex items-end gap-2 mb-6">
            {/* 2nd Place */}
            <PodiumCard entry={topThree[1]} height="h-48" />

            {/* 1st Place */}
            <PodiumCard entry={topThree[0]} height="h-56" isFirst />

            {/* 3rd Place */}
            <PodiumCard entry={topThree[2]} height="h-40" />
          </div>
        </motion.div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-muted-foreground mb-3">Ranking</h2>
          {rest.map((entry, index) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <LeaderboardRowCard entry={entry} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Current user rank (sticky) */}
      {currentUserRank && currentUserRank > 3 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 left-4 right-4 z-20"
        >
          <LeaderboardRowCard
            entry={{
              rank: currentUserRank,
              username: currentUser?.username || 'You',
              avatarUrl: currentUser?.avatarUrl || '/placeholder.svg?height=40&width=40',
              wld: currentUser?.wld || 0,
              wins: currentUser?.wins || 0,
              imageUrl: currentUser?.imageUrl || '/placeholder.svg?height=400&width=400'
            }}
            isSticky
          />
        </motion.div>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  height,
  isFirst = false
}: {
  entry: LeaderboardEntry;
  height: string;
  isFirst?: boolean;
}) {
  return (
    <div className="flex-1">
      <NeoCard className={`${height} overflow-hidden p-0 relative bg-card`}>
        <img
          src={entry.imageUrl || '/placeholder.svg'}
          alt={entry.username}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-center">
          <div className="text-2xl font-black mb-1">#{entry.rank}</div>
          <div className="text-xs font-black truncate">{entry.username}</div>
          <div className="text-xs font-bold opacity-90">{entry.wld} WLD</div>
        </div>
        {isFirst && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm">
              <Trophy className="h-4 w-4" strokeWidth={3} />
            </div>
          </div>
        )}
      </NeoCard>
    </div>
  );
}

function LeaderboardRowCard({
  entry,
  isSticky = false
}: {
  entry: LeaderboardEntry;
  isSticky?: boolean;
}) {
  return (
    <NeoCard
      className={`p-3 transition-transform active:scale-95 overflow-visible ${
        isSticky
          ? 'bg-primary text-primary-foreground border-white shadow-[4px_4px_0px_0px_#ffffff]'
          : 'bg-card'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Visual Focal Point: Submission Image with Overlay Profile */}
        <div className="relative h-14 w-14 flex-shrink-0">
          {/* Submission Image */}
          <img
            src={entry.imageUrl || '/placeholder.svg'}
            alt="Submission"
            className="h-full w-full object-cover rounded-lg border-2 border-black"
          />

          {/* Rank Badge (Top Left) */}
          <div
            className={`absolute -top-2 -left-2 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-md text-[10px] font-black border-2 shadow-sm ${
              isSticky
                ? 'bg-white text-primary border-primary'
                : 'bg-primary text-primary-foreground border-white'
            }`}
          >
            #{entry.rank}
          </div>

          {/* Profile Picture Overlay (Bottom Right) */}
          <div className="absolute -bottom-2 -right-2">
            <Avatar
              className={`h-8 w-8 rounded-lg border-2 ${
                isSticky ? 'border-primary' : 'border-white'
              } shadow-sm`}
            >
              <AvatarImage src={entry.avatarUrl || '/placeholder.svg'} />
              <AvatarFallback className="bg-muted text-[10px] font-black rounded-lg text-black">
                {entry.username[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 ml-1">
          <div className="flex items-center justify-between mb-0.5">
            <div className={`font-black truncate text-sm ${isSticky ? 'text-black' : ''}`}>
              {entry.username}
            </div>
            {isSticky && (
              <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                Top 15%
              </span>
            )}
          </div>

          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              isSticky ? 'opacity-90' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                isSticky ? 'bg-black/20 text-black' : 'bg-muted text-foreground'
              }`}
            >
              <Zap
                className={`h-3 w-3 ${isSticky ? 'text-yellow-300' : 'text-primary'}`}
                fill="currentColor"
              />
              {entry.wld} WLD
            </span>
          </div>
        </div>
      </div>
    </NeoCard>
  );
}
