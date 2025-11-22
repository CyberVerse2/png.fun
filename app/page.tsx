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
import { NotificationPrompt } from '@/components/notification-prompt';
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
    username: 'PhotoPro',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 12450,
    wins: 24,
    imageUrl: '/winning-photo.jpg'
  },
  {
    username: 'SnapMaster',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 11200,
    wins: 19,
    imageUrl: '/second-place-photo.jpg'
  },
  {
    username: 'LensLegend',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 10800,
    wins: 17,
    imageUrl: '/third-place-photo.jpg'
  },
  {
    username: 'ShutterBug',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 9500,
    wins: 15,
    imageUrl: '/placeholder.svg?height=400&width=600'
  },
  {
    username: 'PixelPerfect',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 8900,
    wins: 12,
    imageUrl: '/placeholder.svg?height=400&width=600'
  },
  {
    username: 'FocusFanatic',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 8200,
    wins: 10,
    imageUrl: '/placeholder.svg?height=400&width=600'
  },
  {
    username: 'ApertureAce',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 7500,
    wins: 8,
    imageUrl: '/placeholder.svg?height=400&width=600'
  },
  {
    username: 'ISOIdol',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 6800,
    wins: 7,
    imageUrl: '/placeholder.svg?height=400&width=600'
  },
  {
    username: 'CameraKing',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 6200,
    wins: 5,
    imageUrl: '/placeholder.svg?height=400&width=600'
  },
  {
    username: 'ViewFinder',
    avatarUrl: '/placeholder.svg?height=40&width=40',
    wld: 5900,
    wins: 4,
    imageUrl: '/placeholder.svg?height=400&width=600'
  }
];

// Mock profile data removed - now using real data from database

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
  const [showOnboarding, setShowOnboarding] = React.useState(false); // Start as false, check DB for onboarding status
  const [showOnboardingSuccess, setShowOnboardingSuccess] = React.useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = React.useState(false);
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
  const [userSubmission, setUserSubmission] = React.useState<any>(null);
  const [showAlreadySubmittedModal, setShowAlreadySubmittedModal] = React.useState(false);
  const [userStats, setUserStats] = React.useState<{ wld: number; wins: number; rank?: number }>({
    wld: 0,
    wins: 0
  });
  const [profileData, setProfileData] = React.useState<any>(null);

  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);

  // Get authenticated user
  const user = useUser();

  // Don't show onboarding immediately - wait for DB check
  // This useEffect is now handled by the fetchUserData effect below

  // Fetch user ID and verification status from database after authentication attempt
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('[Frontend] Checking user data...', {
        isLoading: user.isLoading,
        isAuthenticated: user.isAuthenticated,
        walletAddress: user.walletAddress
      });

      // Wait for auth attempt to complete
      if (user.isLoading) return;

      if (user.isAuthenticated && user.walletAddress && supabase) {
        console.log('[Frontend] User authenticated, fetching from database...');
        const { data, error } = await supabase
          .from('users')
          .select(
            'id, world_id_verified, onboarding_completed, notifications_enabled, username, profile_picture_url, total_wld_earned, total_wins'
          )
          .eq('wallet_address', user.walletAddress)
          .single();

        if (error) {
          console.log('[Frontend] Error fetching user data, showing onboarding:', error);
          setShowOnboarding(true);
        } else if (data) {
          console.log('[Frontend] User data fetched:', {
            userId: data.id,
            onboardingCompleted: data.onboarding_completed
          });

          setUserId(data.id);
          setIsWorldIdVerified(data.world_id_verified || false);

          // Store user stats for leaderboard
          setUserStats({
            wld: data.total_wld_earned || 0,
            wins: data.total_wins || 0
          });

          // Check onboarding status from DB - this is the source of truth
          if (data.onboarding_completed) {
            console.log('[Frontend] Onboarding already completed, hiding onboarding screen');
            setShowOnboarding(false);

            // Check if notifications need to be enabled
            if (!data.notifications_enabled && MiniKit.isInstalled()) {
              try {
                const { finalPayload } = await MiniKit.commandsAsync.getPermissions();
                if (finalPayload.status === 'success') {
                  const hasNotifications = finalPayload.permissions.notifications;
                  if (!hasNotifications) {
                    setShowNotificationPrompt(true);
                  } else {
                    // Auto-sync if already granted
                    await fetch('/api/user/status', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        walletAddress: user.walletAddress,
                        notificationsEnabled: true
                      })
                    });
                  }
                }
              } catch (e) {}
            }
          } else {
            console.log('[Frontend] Onboarding not completed, showing onboarding screen');
            setShowOnboarding(true);
          }

          // If username/PFP is missing in DB, sync from MiniKit
          if (
            (!data.username || !data.profile_picture_url) &&
            (MiniKit.user?.username || MiniKit.user?.profilePictureUrl)
          ) {
            try {
              await fetch('/api/user/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  walletAddress: user.walletAddress,
                  username: MiniKit.user.username,
                  profilePictureUrl: MiniKit.user.profilePictureUrl
                })
              });
            } catch (e) {}
          }

          // Note: Removed auto-sync of notification status to prevent race conditions
          // DB is the source of truth for notifications_enabled
        }
      } else if (!user.isAuthenticated) {
        console.log('[Frontend] User not authenticated, showing onboarding for sign-in');
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
          .select('*')
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
          setUserSubmission(data);
        } else {
          console.log('[Frontend] No existing submission found for this challenge.');
          setHasSubmittedToday(false);
          setUserSubmission(null);
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
        const transformed = data.submissions.map((sub: any) => {
          // Fallback to local username if this is the current user's submission and API returned null
          let displayUsername = sub.user?.username;
          if (!displayUsername && sub.user_id === userId && user.username) {
            displayUsername = user.username;
          }

          return {
            id: sub.id,
            imageUrl: sub.photo_url,
            username: displayUsername || 'Anonymous',
            avatarUrl: sub.user?.profile_picture_url || '/placeholder.svg',
            rank: sub.rank,
            wld: sub.total_wld_voted,
            potentialWld: sub.total_wld_voted * 2
          };
        });
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
        let transformed = data.leaderboard.map((user: any, index: number) => ({
          rank: index + 1,
          username: user.username || 'Anonymous',
          avatarUrl: user.profile_picture_url || '/placeholder.svg',
          wld: user.total_wld_earned || 0,
          wins: user.total_wins || 0,
          imageUrl: user.latest_photo_url || '/placeholder.svg',
          walletAddress: user.wallet_address
        }));

        // Calculate current user's rank and update stats
        if (user.walletAddress) {
          const userIndex = data.leaderboard.findIndex(
            (u: any) => u.wallet_address === user.walletAddress
          );
          if (userIndex !== -1) {
            const userData = data.leaderboard[userIndex];
            setUserStats({
              wld: userData.total_wld_earned || 0,
              wins: userData.total_wins || 0,
              rank: userIndex + 1
            });
            console.log('[Frontend] Updated user stats from leaderboard:', {
              wld: userData.total_wld_earned,
              wins: userData.total_wins,
              rank: userIndex + 1
            });
          }
        }

        // Fill with mock data if less than 10 users
        if (transformed.length < 10) {
          const needed = 10 - transformed.length;
          const mockDataToAdd = mockLeaderboard.slice(0, needed).map((mock, index) => ({
            ...mock,
            rank: transformed.length + index + 1
          }));
          transformed = [...transformed, ...mockDataToAdd];
        }

        console.log('[Frontend] Leaderboard transformed:', transformed.length, 'entries');
        setLeaderboardData(transformed);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching leaderboard:', error);
    }
  };

  // Fetch profile data
  const fetchProfileData = async () => {
    if (!userId || !supabase) return;

    console.log('[Frontend] Fetching profile data for user:', userId);
    try {
      // Fetch user stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, profile_picture_url, total_wld_earned, total_wins, current_streak')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('[Frontend] Error fetching user data:', userError);
        return;
      }

      // Fetch user submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(
          `
          id,
          photo_url,
          total_wld_voted,
          created_at,
          challenge:challenges(title)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('[Frontend] Error fetching submissions:', submissionsError);
      }

      // Fetch user votes (predictions) - for now, we'll use empty array as votes table might not have the structure yet
      const predictions: any[] = [];

      const profile = {
        username: userData.username || user.username || 'You',
        avatarUrl: userData.profile_picture_url || user.profilePictureUrl || '/placeholder.svg',
        wld: userData.total_wld_earned || 0,
        wins: userData.total_wins || 0,
        streak: userData.current_streak || 0,
        totalWldEarned: userData.total_wld_earned || 0,
        submissions: (submissionsData || []).map((sub: any, index: number) => ({
          id: sub.id,
          imageUrl: sub.photo_url,
          challenge: sub.challenge?.title || 'Challenge',
          votes: sub.total_wld_voted || 0,
          rank: index + 1 // Simplified ranking
        })),
        predictions: predictions
      };

      console.log('[Frontend] Profile data fetched:', profile);
      setProfileData(profile);
    } catch (error) {
      console.error('[Frontend] Error fetching profile data:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchChallenge();
    fetchLeaderboard();
  }, []);

  // Fetch profile data when userId changes
  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  // Show loading screen while checking user/onboarding
  if (user.isLoading || checkingOnboarding) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-100">
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
      console.error('[Frontend] Missing required data for submission:', {
        hasPhoto: !!capturedPhotoUrl,
        hasChallenge: !!challenge,
        hasUserId: !!userId
      });
      setShowPhotoPreview(false);
      return;
    }

    console.log('[Frontend] Starting submission process...', {
      challengeId: challenge.id,
      userId: userId,
      photoDataLength: capturedPhotoUrl.length
    });

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

      console.log('[Frontend] Submission response status:', response.status);
      const data = await response.json();
      console.log('[Frontend] Submission response data:', data);

      if (response.ok && data.submission) {
        console.log('[Frontend] Submission created successfully:', data.submission.id);
        // Update local state immediately to reflect submission
        setHasSubmittedToday(true);
        setUserSubmission(data.submission);

        console.log('[Frontend] Refreshing data after submission...');
        // Refresh submissions to show the new one
        await fetchSubmissions(challenge.id);
        // Refresh leaderboard to update rankings and user stats
        await fetchLeaderboard();
        // Also refresh profile data if on profile tab
        if (userId) {
          await fetchProfileData();
        }

        console.log('[Frontend] All data refreshed, showing success screen');
        // Show success screen only after successful submission
        setShowSuccess(true);
      } else {
        console.error('[Frontend] Submission failed:', data.error);
      }
    } catch (error) {
      console.error('[Frontend] Error submitting photo:', error);
    } finally {
      setLoading(false);
      setShowPhotoPreview(false);
      setCapturedPhotoUrl(null);
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
        const response = await fetch('/api/user/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: user.walletAddress,
            onboardingCompleted: true,
            notificationsEnabled: notificationsEnabled,
            username: user.username || MiniKit.user?.username,
            profilePictureUrl: user.profilePictureUrl || MiniKit.user?.profilePictureUrl
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update onboarding status');
        }

        console.log('[Frontend] DB updated successfully with username/PFP');
        setShowOnboarding(false);
      } catch (error) {
        console.error('[Frontend] Error updating DB:', error);
        // Don't hide onboarding on error
      }
    } else {
      // No wallet address, should not happen but handle gracefully
      console.error('[Frontend] No wallet address available');
    }
  };

  const handleOnboardingSuccessContinue = () => {
    setShowOnboardingSuccess(false);
  };

  const handleNotificationPromptComplete = async (enabled: boolean) => {
    console.log('📝 [NOTIFICATION PROMPT] Saving to DB - enabled:', enabled);
    setShowNotificationPrompt(false);

    if (user.walletAddress) {
      try {
        await fetch('/api/user/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: user.walletAddress,
            notificationsEnabled: enabled
          })
        });
        console.log('✅ [NOTIFICATION PROMPT] DB updated successfully');
      } catch (error) {
        console.error('❌ [NOTIFICATION PROMPT] Error:', error);
      }
    }
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
              {profileData ? (
                <ProfileScreen data={profileData} />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <div className="text-xl font-black uppercase tracking-widest animate-pulse">
                      Loading Profile...
                    </div>
                  </div>
                </div>
              )}
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
              <LeaderboardScreen
                entries={leaderboardData}
                currentUserRank={userStats.rank || 15}
                currentUser={{
                  username: user.username || 'You',
                  avatarUrl: user.profilePictureUrl || '/placeholder.svg',
                  wld: userStats.wld,
                  wins: userStats.wins,
                  imageUrl: userSubmission?.photo_url || '/placeholder.svg'
                }}
              />
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

      <NotificationPrompt
        isOpen={showNotificationPrompt}
        onOpenChange={setShowNotificationPrompt}
        onComplete={handleNotificationPromptComplete}
      />
    </>
  );
}
