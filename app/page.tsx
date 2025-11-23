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
import { useSession } from 'next-auth/react';
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
  const [votedSubmissionIds, setVotedSubmissionIds] = React.useState<Set<string>>(new Set());
  const [votesLoaded, setVotesLoaded] = React.useState(false);

  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);

  // Get authenticated session from NextAuth
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const walletAddress = session?.user?.walletAddress;

  // Don't show onboarding immediately - wait for DB check
  // This useEffect is now handled by the fetchUserData effect below

  // Fetch user ID and verification status from database after authentication attempt
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('[Frontend] Checking user data...', {
        isLoading,
        isAuthenticated,
        walletAddress
      });

      // Wait for auth attempt to complete
      if (isLoading) return;

      if (isAuthenticated && walletAddress && supabase) {
        console.log('[Frontend] User authenticated, fetching from database...');
        const { data, error } = await supabase
          .from('users')
          .select(
            'id, world_id_verified, onboarding_completed, notifications_enabled, username, profile_picture_url, total_wld_earned, total_wins'
          )
          .eq('wallet_address', walletAddress)
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
                        walletAddress: walletAddress,
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

          // If username/PFP is missing in DB, sync from session
          if (
            (!data.username || !data.profile_picture_url) &&
            (session?.user?.username || session?.user?.profilePictureUrl)
          ) {
            try {
              await fetch('/api/user/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  walletAddress: walletAddress,
                  username: session.user.username,
                  profilePictureUrl: session.user.profilePictureUrl
                })
              });
            } catch (e) {}
          }

          // Note: Removed auto-sync of notification status to prevent race conditions
          // DB is the source of truth for notifications_enabled
        }
      } else if (!isAuthenticated) {
        console.log('[Frontend] User not authenticated, showing onboarding for sign-in');
        setShowOnboarding(true);
      }

      setCheckingOnboarding(false);
    };

    fetchUserData();
  }, [isAuthenticated, walletAddress, isLoading, session]);

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
        // Don't fetch submissions here - wait for votes to load first
        // Submissions will be fetched when challenge + votes are ready
      } else {
        console.log('[Frontend] No active challenge found');
      }
    } catch (error) {
      console.error('[Frontend] Error fetching challenge:', error);
    }
  };

  // Fetch submissions for voting
  // Fetch user's votes for the current challenge
  const fetchUserVotes = async () => {
    if (!userId) {
      setVotesLoaded(true); // No user, so votes are "loaded" (empty)
      return;
    }

    console.log('[Frontend] Fetching user votes for userId:', userId);
    try {
      const res = await fetch(`/api/votes?voterId=${userId}`, { cache: 'no-store' });
      const data = await res.json();
      console.log('[Frontend] User votes response:', data.votes?.length || 0, 'votes');

      if (data.votes) {
        const votedIds = new Set<string>(
          data.votes.map((vote: any) => vote.submission_id as string)
        );
        console.log('[Frontend] Voted submission IDs:', Array.from(votedIds));
        setVotedSubmissionIds(votedIds);
      }
      setVotesLoaded(true);
    } catch (error) {
      console.error('[Frontend] Error fetching user votes:', error);
      setVotesLoaded(true); // Set to true even on error to avoid blocking
    }
  };

  const fetchSubmissions = async (challengeId: string) => {
    console.log('[Frontend] Fetching submissions for challenge:', challengeId);
    try {
      const res = await fetch(`/api/submissions?challengeId=${challengeId}`, { cache: 'no-store' });
      const data = await res.json();
      console.log('[Frontend] Submissions response:', data.submissions?.length || 0, 'submissions');
      if (data.submissions) {
        // Transform to match expected format
        const transformed = data.submissions
          .map((sub: any) => {
            // Fallback to local username if this is the current user's submission and API returned null
            let displayUsername = sub.user?.username;
            if (!displayUsername && sub.user_id === userId && session?.user?.username) {
              displayUsername = session.user.username;
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
          })
          // Filter out submissions the user has already voted on
          .filter((sub: any) => !votedSubmissionIds.has(sub.id));

        console.log(
          '[Frontend] Transformed submissions:',
          transformed.length,
          '(filtered out',
          data.submissions.length - transformed.length,
          'already voted)'
        );
        setSubmissions(transformed);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard (shows current challenge submissions ranked by votes)
  const fetchLeaderboard = async () => {
    console.log('[Frontend] Fetching leaderboard...');
    try {
      // Fetch current challenge submissions ranked by votes instead of lifetime earnings
      if (!challenge?.id) {
        console.log('[Frontend] No active challenge, using user leaderboard');
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
          if (walletAddress) {
            const userIndex = data.leaderboard.findIndex(
              (u: any) => u.wallet_address === walletAddress
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

          setLeaderboardData(transformed);
        }
        return;
      }

      // Fetch submissions for current challenge, ranked by votes
      const res = await fetch(`/api/submissions?challengeId=${challenge.id}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      console.log(
        '[Frontend] Challenge submissions leaderboard:',
        data.submissions?.length || 0,
        'submissions'
      );

      if (data.submissions) {
        let transformed = data.submissions.map((sub: any, index: number) => ({
          rank: index + 1,
          username: sub.user?.username || 'Anonymous',
          avatarUrl: sub.user?.profile_picture_url || '/placeholder.svg',
          wld: sub.total_wld_voted || 0, // Current WLD votes on this submission
          wins: 0,
          imageUrl: sub.photo_url || '/placeholder.svg',
          submissionId: sub.id,
          userId: sub.user_id
        }));

        // Calculate current user's rank from submissions
        if (userId) {
          const userSubmissionIndex = data.submissions.findIndex(
            (sub: any) => sub.user_id === userId
          );
          if (userSubmissionIndex !== -1) {
            const userSubmission = data.submissions[userSubmissionIndex];
            setUserStats((prev) => ({
              ...prev,
              rank: userSubmissionIndex + 1
            }));
            console.log(
              '[Frontend] Updated user rank from challenge leaderboard:',
              userSubmissionIndex + 1
            );
          }
        }

        // Fill with mock data if less than 10 submissions
        if (transformed.length < 10) {
          const needed = 10 - transformed.length;
          const mockDataToAdd = mockLeaderboard.slice(0, needed).map((mock, index) => ({
            ...mock,
            rank: transformed.length + index + 1
            // Keep original mock WLD values
          }));
          transformed = [...transformed, ...mockDataToAdd];
        }

        console.log('[Frontend] Challenge leaderboard transformed:', transformed.length, 'entries');
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

      // Fetch user votes (predictions)
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select(
          `
          id,
          wld_amount,
          status,
          submission:submissions(
            id,
            photo_url,
            user_id,
            challenge:challenges(title),
            user:users(username, profile_picture_url)
          )
        `
        )
        .eq('voter_id', userId)
        .order('created_at', { ascending: false });

      if (votesError) {
        console.error('[Frontend] Error fetching votes:', votesError);
      }

      const predictions = (votesData || []).map((vote: any) => ({
        id: vote.id,
        challenge: vote.submission?.challenge?.title || 'Challenge',
        status: vote.status || 'active', // 'active', 'won', 'lost'
        amount: vote.wld_amount || 0,
        imageUrl: vote.submission?.photo_url || '/placeholder.svg',
        photographer: {
          username: vote.submission?.user?.username || 'Anonymous',
          avatarUrl: vote.submission?.user?.profile_picture_url || '/placeholder.svg'
        }
      }));

      const profile = {
        username: userData.username || session?.user?.username || 'You',
        avatarUrl:
          userData.profile_picture_url || session?.user?.profilePictureUrl || '/placeholder.svg',
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

  // Fetch profile data and user votes when userId changes
  useEffect(() => {
    if (userId) {
      fetchProfileData();
      fetchUserVotes();
    }
  }, [userId]);

  // Fetch submissions when challenge is loaded AND votes are loaded
  // This prevents the flicker of showing voted submissions briefly
  useEffect(() => {
    if (challenge?.id && votesLoaded) {
      console.log(
        '[Frontend] Challenge and votes ready, fetching submissions with',
        votedSubmissionIds.size,
        'votes to filter'
      );
      fetchSubmissions(challenge.id);
    }
  }, [challenge?.id, votesLoaded]);

  // Show loading screen while checking user/onboarding
  if (isLoading || checkingOnboarding) {
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
      console.warn('[Frontend] No user ID available for voting');
      return;
    }

    console.log('[Frontend] Vote action:', { photoId, vote, userId });

    // Only create a vote for "up" (swipe right/yes)
    // "down" (swipe left) is just a skip, no vote created
    if (vote === 'up') {
      try {
        console.log('[Frontend] Creating vote with 1 WLD...');
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: photoId,
            voterId: userId,
            wldAmount: 1 // Each yes vote adds 1 WLD
          })
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            console.warn('[Frontend] Already voted on this submission');
          } else {
            console.error('[Frontend] Error creating vote:', data.error);
          }
          return;
        }

        console.log('[Frontend] Vote created successfully:', data.vote);

        // Add voted submission to the set so it won't appear again
        setVotedSubmissionIds((prev) => new Set([...prev, photoId]));

        // Refresh leaderboard to show updated rankings
        console.log('[Frontend] Refreshing leaderboard after vote...');
        await fetchLeaderboard();

        // Refresh submissions to show updated vote counts (and filter out voted submission)
        if (challenge?.id) {
          await fetchSubmissions(challenge.id);
        }
      } catch (error) {
        console.error('[Frontend] Failed to create vote:', error);
      }
    } else {
      console.log('[Frontend] Skipped (swiped left), no vote created');
      // For skip, just add to voted set so it doesn't appear again
      setVotedSubmissionIds((prev) => new Set([...prev, photoId]));
    }
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

    if (walletAddress) {
      try {
        const response = await fetch('/api/user/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: walletAddress,
            onboardingCompleted: true,
            notificationsEnabled: notificationsEnabled,
            username: session?.user?.username || MiniKit.user?.username,
            profilePictureUrl: session?.user?.profilePictureUrl || MiniKit.user?.profilePictureUrl
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update onboarding status');
        }

        console.log('[Frontend] DB updated successfully with username/PFP');
        setShowOnboarding(false);

        // Reload page to refresh all user data
        window.location.reload();
      } catch (error) {
        console.error('[Frontend] Error updating DB:', error);
        // Don't hide onboarding on error
      }
    } else {
      // No wallet address available yet - session might not be loaded
      // This should not happen since onboarding-screen now reloads if session is missing
      console.error('[Frontend] No wallet address available, session may not be loaded yet');
      console.log('[Frontend] Reloading page to refresh session...');
      window.location.reload();
    }
  };

  const handleOnboardingSuccessContinue = () => {
    setShowOnboardingSuccess(false);
  };

  const handleNotificationPromptComplete = async (enabled: boolean) => {
    console.log('📝 [NOTIFICATION PROMPT] Saving to DB - enabled:', enabled);
    setShowNotificationPrompt(false);

    if (walletAddress) {
      try {
        await fetch('/api/user/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: walletAddress,
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
                  username: session?.user?.username || 'You',
                  avatarUrl: session?.user?.profilePictureUrl || '/placeholder.svg',
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
        walletAddress={walletAddress}
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
