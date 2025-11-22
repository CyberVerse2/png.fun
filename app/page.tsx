'use client';

import * as React from 'react';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import { ChallengeHeader } from '@/components/challenge-header';
import { VoteStack } from '@/components/vote-stack';
import { LeaderboardScreen } from '@/components/leaderboard-screen';
import { ProfileScreen } from '@/components/profile-screen';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { HumanVerificationModal } from '@/components/human-verification-modal';
import { AlreadySubmittedModal } from '@/components/already-submitted-modal';
import { PhotoPreviewScreen } from '@/components/photo-preview-screen';
import { SuccessScreen } from '@/components/success-screen';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@/components/minikit-provider';
import { supabase } from '@/lib/supabase';
import { MiniKit } from '@worldcoin/minikit-js';

// Mock data
const mockPhotos = [
  {
    id: '1',
    imageUrl: '/sunset-beach.png',
    username: 'SunsetChaser',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    rank: 1,
    wld: 450,
    potentialWld: 1000
  },
  {
    id: '2',
    imageUrl: '/city-skyline-night.png',
    username: 'CityLights',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    rank: 2,
    wld: 380,
    potentialWld: 800
  },
  {
    id: '3',
    imageUrl: '/coffee-morning-light.jpg',
    username: 'CaffeineKing',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    rank: 5,
    wld: 210,
    potentialWld: 500
  },
  {
    id: '4',
    imageUrl: '/majestic-mountain-vista.png',
    username: 'PeakSeeker',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    rank: 3,
    wld: 340,
    potentialWld: 750
  },
  {
    id: '5',
    imageUrl: '/street-art-graffiti.png',
    username: 'UrbanArtist',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    rank: 8,
    wld: 150,
    potentialWld: 300
  }
];

const mockLeaderboard = [
  {
    rank: 1,
    username: 'PhotoPro',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 12450,
    wins: 24,
    imageUrl: '/winning-photo.jpg'
  },
  {
    rank: 2,
    username: 'SnapMaster',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 11200,
    wins: 19,
    imageUrl: '/second-place-photo.jpg'
  },
  {
    rank: 3,
    username: 'LensLegend',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 10800,
    wins: 17,
    imageUrl: '/third-place-photo.jpg'
  },
  {
    rank: 4,
    username: 'ShutterBug',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 9500,
    wins: 15,
    imageUrl: '/placeholder.svg?height=400&width=600'
  },
  {
    rank: 5,
    username: 'PixelPerfect',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 8900,
    wins: 12,
    imageUrl: '/placeholder.svg?height=400&width=600'
  }
];

const mockProfile = {
  username: 'You',
  avatarUrl: '/placeholder.svg?height=96&width=96',
  wld: 5420,
  wins: 8,
  streak: 12,
  totalWldEarned: 145,
  submissions: [
    {
      id: '1',
      imageUrl: '/user-photo-1.jpg',
      challenge: 'Golden Hour',
      votes: 234,
      rank: 3
    },
    {
      id: '2',
      imageUrl: '/user-photo-2.jpg',
      challenge: 'Street Life',
      votes: 189,
      rank: 7
    },
    {
      id: '3',
      imageUrl: '/user-photo-3.jpg',
      challenge: "Nature's Beauty",
      votes: 312,
      rank: 1
    },
    {
      id: '4',
      imageUrl: '/user-photo-4.jpg',
      challenge: 'Urban Jungle',
      votes: 156,
      rank: 12
    }
  ],
  predictions: [
    {
      id: '1',
      challenge: "Today's Challenge",
      status: 'active' as const,
      amount: 50,
      imageUrl: '/placeholder.svg?height=200&width=200',
      photographer: {
        username: 'LensQueen',
        avatarUrl: '/placeholder.svg?height=40&width=40'
      }
    },
    {
      id: '2',
      challenge: "Yesterday's Winner",
      status: 'won' as const,
      amount: 120,
      imageUrl: '/placeholder.svg?height=200&width=200',
      photographer: {
        username: 'ShutterBug',
        avatarUrl: '/placeholder.svg?height=40&width=40'
      }
    },
    {
      id: '3',
      challenge: 'Two Days Ago',
      status: 'lost' as const,
      amount: 30,
      imageUrl: '/placeholder.svg?height=200&width=200',
      photographer: {
        username: 'PixelPerfect',
        avatarUrl: '/placeholder.svg?height=40&width=40'
      }
    }
  ]
};

// Helper function to calculate time remaining
function calculateTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

export default function Home() {
  const [showOnboarding, setShowOnboarding] = React.useState(false); // Start as false, check localStorage
  const [showOnboardingSuccess, setShowOnboardingSuccess] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'vote' | 'leaderboard'>('vote');
  const [showProfile, setShowProfile] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const [isVerificationOpen, setIsVerificationOpen] = React.useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = React.useState<string | null>(null);

  // Supabase data state
  const [challenge, setChallenge] = React.useState<any>(null);
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isWorldIdVerified, setIsWorldIdVerified] = React.useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = React.useState(false);
  const [showAlreadySubmittedModal, setShowAlreadySubmittedModal] = React.useState(false);

  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);

  // Get authenticated user
  const user = useUser();

  // Fetch user ID and verification status from database when wallet address is available
  useEffect(() => {
    const fetchUserData = async () => {
      // Wait for user auth to load
      if (user.isLoading) return;

      if (user.isAuthenticated && user.walletAddress && supabase) {
        console.log('[Frontend] Fetching user data for wallet:', user.walletAddress);
        const { data, error } = await supabase
          .from('users')
          .select('id, world_id_verified, onboarding_completed, notifications_enabled')
          .eq('wallet_address', user.walletAddress)
          .single();

        if (error) {
          console.error('[Frontend] Error fetching user data:', error);
          // If error (likely user doesn't exist yet), show onboarding
          setShowOnboarding(true);
        } else if (data) {
          console.log('[Frontend] User data found:', data);
          setUserId(data.id);
          setIsWorldIdVerified(data.world_id_verified || false);

          // Check onboarding status from DB
          if (data.onboarding_completed) {
            console.log('[Frontend] User has completed onboarding (DB)');
            setShowOnboarding(false);
          } else {
            console.log('[Frontend] User has NOT completed onboarding (DB)');
            setShowOnboarding(true);
          }

          // Sync notification status if MiniKit is installed
          if (MiniKit.isInstalled()) {
            try {
              const { finalPayload } = await MiniKit.commandsAsync.getPermissions();
              if (finalPayload.status === 'success') {
                const hasNotifications = finalPayload.permissions.notifications;
                if (hasNotifications !== data.notifications_enabled) {
                  console.log('[Frontend] Syncing notification status to DB:', hasNotifications);
                  // Update DB if mismatch
                  await fetch('/api/user/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      walletAddress: user.walletAddress,
                      notificationsEnabled: hasNotifications
                    })
                  });
                }
              }
            } catch (e) {
              console.error('[Frontend] Error checking permissions:', e);
            }
          }
        }
      } else if (!user.isAuthenticated) {
        // Not authenticated, show onboarding to guide them to sign in
        setShowOnboarding(true);
      }

      setCheckingOnboarding(false);
    };

    fetchUserData();
  }, [user.isAuthenticated, user.walletAddress, user.isLoading]);

  // Check if user has already submitted for current challenge
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (userId && challenge && supabase) {
        console.log('[Frontend] Checking for existing submission:', {
          userId,
          challengeId: challenge.id
        });
        const { data, error } = await supabase
          .from('submissions')
          .select('id')
          .eq('user_id', userId)
          .eq('challenge_id', challenge.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "Row not found" which is expected
          console.error('[Frontend] Error checking submission:', error);
        }

        if (data) {
          console.log(
            '[Frontend] User has already submitted for this challenge. Submission ID:',
            data.id
          );
          setHasSubmittedToday(true);
        } else {
          console.log('[Frontend] No existing submission found for this challenge.');
          setHasSubmittedToday(false);
        }
      } else {
        console.log('[Frontend] Skipping submission check - missing dependencies:', {
          hasUserId: !!userId,
          hasChallenge: !!challenge,
          hasSupabase: !!supabase
        });
      }
    };

    checkExistingSubmission();
  }, [userId, challenge]);

  // Fetch active challenge
  const fetchChallenge = async () => {
    console.log('[Frontend] Fetching active challenge...');
    try {
      const res = await fetch('/api/challenges');
      const data = await res.json();
      console.log('[Frontend] Challenge response:', data);
      if (data.challenge) {
        console.log(
          '[Frontend] Challenge loaded:',
          data.challenge.title,
          'Prize:',
          data.challenge.prize_pool,
          'WLD'
        );
        setChallenge(data.challenge);
        // Fetch submissions for this challenge
        fetchSubmissions(data.challenge.id);
      } else {
        console.log('[Frontend] No active challenge found');
      }
    } catch (error) {
      console.error('[Frontend] Error fetching challenge:', error);
    }
  };

  // Fetch submissions for voting
  const fetchSubmissions = async (challengeId: string) => {
    console.log('[Frontend] Fetching submissions for challenge:', challengeId);
    try {
      const res = await fetch(`/api/submissions?challengeId=${challengeId}`, { cache: 'no-store' });
      const data = await res.json();
      console.log('[Frontend] Submissions response:', data.submissions?.length || 0, 'submissions');
      if (data.submissions) {
        // Transform to match expected format
        const transformed = data.submissions.map((sub: any) => ({
          id: sub.id,
          imageUrl: sub.photo_url,
          username: sub.user?.username || 'Anonymous',
          avatarUrl: sub.user?.profile_picture_url || '/placeholder.svg',
          rank: sub.rank,
          wld: sub.total_wld_voted,
          potentialWld: sub.total_wld_voted * 2
        }));
        console.log('[Frontend] Transformed submissions:', transformed.length);
        setSubmissions(transformed);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    console.log('[Frontend] Fetching leaderboard...');
    try {
      const res = await fetch('/api/leaderboard?limit=10');
      const data = await res.json();
      console.log('[Frontend] Leaderboard response:', data.leaderboard?.length || 0, 'users');
      if (data.leaderboard) {
        const transformed = data.leaderboard.map((user: any, index: number) => ({
          rank: index + 1,
          username: user.username || 'Anonymous',
          avatarUrl: user.profile_picture_url || '/placeholder.svg',
          wld: user.total_wld_earned,
          wins: user.total_wins,
          imageUrl: '/placeholder.svg'
        }));
        console.log('[Frontend] Leaderboard transformed:', transformed.length, 'entries');
        setLeaderboardData(transformed);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching leaderboard:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchChallenge();
    fetchLeaderboard();
  }, []);

  // Show loading screen while checking user/onboarding
  if (user.isLoading || checkingOnboarding) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[100]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-xl font-black uppercase tracking-widest animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  const handleVote = async (photoId: string, vote: 'up' | 'down') => {
    if (!userId) {
      console.warn('No user ID available for voting');
      return;
    }

    // For now, we'll just log the vote
    // In production, this would trigger a WLD payment transaction
    console.log('Vote:', { photoId, vote, userId });

    // TODO: Integrate with World ID Pay command for actual WLD transfer
    // const wldAmount = 0.1 // Example amount
    // await fetch('/api/votes', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     submissionId: photoId,
    //     voterId: userId,
    //     wldAmount,
    //   }),
    // })
  };

  const handleCameraClick = () => {
    // Check if user has already submitted for today's challenge
    if (hasSubmittedToday) {
      console.log('[Frontend] User has already submitted for this challenge');
      setShowAlreadySubmittedModal(true);
      return;
    }

    setIsVerificationOpen(true);
  };

  const handleVerify = (photoUrl?: string) => {
    setIsVerificationOpen(false);
    if (photoUrl) {
      setCapturedPhotoUrl(photoUrl);
      setShowPhotoPreview(true);
    }
  };

  const handleRetake = () => {
    setShowPhotoPreview(false);
    setCapturedPhotoUrl(null);
    setIsVerificationOpen(true);
  };

  const handleSend = async () => {
    if (!capturedPhotoUrl || !challenge || !userId) {
      console.warn('Missing required data for submission:', {
        hasPhoto: !!capturedPhotoUrl,
        hasChallenge: !!challenge,
        hasUserId: !!userId
      });
      setShowPhotoPreview(false);
      setShowSuccess(true);
      return;
    }

    try {
      setLoading(true);

      // Submit photo to API
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          userId: userId,
          photoData: capturedPhotoUrl // base64 data URL
        })
      });

      const data = await response.json();

      if (response.ok && data.submission) {
        console.log('Submission created:', data.submission);
        // Refresh submissions to show the new one
        await fetchSubmissions(challenge.id);
      } else {
        console.error('Submission failed:', data.error);
      }
    } catch (error) {
      console.error('Error submitting photo:', error);
    } finally {
      setLoading(false);
      setShowPhotoPreview(false);
      setCapturedPhotoUrl(null);
      setShowSuccess(true);
    }
  };

  const handleSuccessContinue = () => {
    setShowSuccess(false);
  };

  const handleOnboardingComplete = async (notificationsEnabled: boolean) => {
    console.log(
      '[Frontend] Onboarding completed - updating DB. Notifications:',
      notificationsEnabled
    );

    if (user.walletAddress) {
      try {
        await fetch('/api/user/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: user.walletAddress,
            onboardingCompleted: true,
            notificationsEnabled: notificationsEnabled
          })
        });
        console.log('[Frontend] DB updated successfully');
      } catch (error) {
        console.error('[Frontend] Error updating DB:', error);
      }
    }

    setShowOnboarding(false);
    // Success screen is now handled within OnboardingScreen
    // setShowOnboardingSuccess(true)
  };

  const handleOnboardingSuccessContinue = () => {
    setShowOnboardingSuccess(false);
  };

  const handleTabChange = (tab: 'vote' | 'leaderboard') => {
    setActiveTab(tab);
    setShowProfile(false);
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (showOnboardingSuccess) {
    return <SuccessScreen type="onboarding" onContinue={handleOnboardingSuccessContinue} />;
  }

  return (
    <>
      <TopBar onProfileClick={() => setShowProfile(true)} />
      <div className="pt-16 pb-20 min-h-screen flex flex-col" style={{ overflowX: 'clip' }}>
        <AnimatePresence mode="wait">
          {showProfile ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <ProfileScreen data={mockProfile} />
            </motion.div>
          ) : activeTab === 'vote' ? (
            <motion.div
              key="vote"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 px-4 py-4 relative"
            >
              <div className="relative z-10">
                <ChallengeHeader
                  title={challenge?.title || 'Loading...'}
                  description={challenge?.description}
                  timeRemaining={challenge ? calculateTimeRemaining(challenge.end_time) : '...'}
                  submissionCount={submissions.length}
                  prizePool={challenge?.prize_pool ? `${challenge.prize_pool} WLD` : '...'}
                  isExpanded={isExpanded}
                  onToggle={() => setIsExpanded(!isExpanded)}
                />
              </div>
              <div className="relative z-50 flex-1 flex flex-col">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground font-bold">Loading submissions...</p>
                  </div>
                ) : submissions.length > 0 ? (
                  <VoteStack photos={submissions} onVote={handleVote} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-black mb-2">No submissions yet</p>
                      <p className="text-muted-foreground">Be the first to submit!</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <LeaderboardScreen entries={leaderboardData} currentUserRank={15} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCameraClick={handleCameraClick}
      />

      <HumanVerificationModal
        isOpen={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        onVerify={handleVerify}
        isVerified={isWorldIdVerified}
        walletAddress={user.walletAddress}
      />

      <AlreadySubmittedModal
        isOpen={showAlreadySubmittedModal}
        onOpenChange={setShowAlreadySubmittedModal}
      />

      {showPhotoPreview && capturedPhotoUrl && (
        <PhotoPreviewScreen
          photoUrl={capturedPhotoUrl}
          onRetake={handleRetake}
          onSend={handleSend}
        />
      )}

      {showSuccess && <SuccessScreen onContinue={handleSuccessContinue} />}
    </>
  );
}
