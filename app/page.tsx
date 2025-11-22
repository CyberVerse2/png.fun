"use client"

import * as React from "react"
import { TopBar } from "@/components/top-bar"
import { BottomNav } from "@/components/bottom-nav"
import { ChallengeHeader } from "@/components/challenge-header"
import { VoteStack } from "@/components/vote-stack"
import { LeaderboardScreen } from "@/components/leaderboard-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { OnboardingScreen } from "@/components/onboarding-screen"
import { HumanVerificationModal } from "@/components/human-verification-modal"
import { PhotoPreviewScreen } from "@/components/photo-preview-screen"
import { SuccessScreen } from "@/components/success-screen"
import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

// Mock data
const mockPhotos = [
  {
    id: "1",
    imageUrl: "/sunset-beach.png",
    username: "SunsetChaser",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    rank: 1,
    wld: 450,
    potentialWld: 1000,
  },
  {
    id: "2",
    imageUrl: "/city-skyline-night.png",
    username: "CityLights",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    rank: 2,
    wld: 380,
    potentialWld: 800,
  },
  {
    id: "3",
    imageUrl: "/coffee-morning-light.jpg",
    username: "CaffeineKing",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    rank: 5,
    wld: 210,
    potentialWld: 500,
  },
  {
    id: "4",
    imageUrl: "/majestic-mountain-vista.png",
    username: "PeakSeeker",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    rank: 3,
    wld: 340,
    potentialWld: 750,
  },
  {
    id: "5",
    imageUrl: "/street-art-graffiti.png",
    username: "UrbanArtist",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    rank: 8,
    wld: 150,
    potentialWld: 300,
  },
]

const mockLeaderboard = [
  {
    rank: 1,
    username: "PhotoPro",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    wld: 12450,
    wins: 24,
    imageUrl: "/winning-photo.jpg",
  },
  {
    rank: 2,
    username: "SnapMaster",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    wld: 11200,
    wins: 19,
    imageUrl: "/second-place-photo.jpg",
  },
  {
    rank: 3,
    username: "LensLegend",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    wld: 10800,
    wins: 17,
    imageUrl: "/third-place-photo.jpg",
  },
  {
    rank: 4,
    username: "ShutterBug",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    wld: 9500,
    wins: 15,
    imageUrl: "/placeholder.svg?height=400&width=600",
  },
  {
    rank: 5,
    username: "PixelPerfect",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    wld: 8900,
    wins: 12,
    imageUrl: "/placeholder.svg?height=400&width=600",
  },
]

const mockProfile = {
  username: "You",
  avatarUrl: "/placeholder.svg?height=96&width=96",
  wld: 5420,
  wins: 8,
  streak: 12,
  totalWldEarned: 145,
  submissions: [
    {
      id: "1",
      imageUrl: "/user-photo-1.jpg",
      challenge: "Golden Hour",
      votes: 234,
      rank: 3,
    },
    {
      id: "2",
      imageUrl: "/user-photo-2.jpg",
      challenge: "Street Life",
      votes: 189,
      rank: 7,
    },
    {
      id: "3",
      imageUrl: "/user-photo-3.jpg",
      challenge: "Nature's Beauty",
      votes: 312,
      rank: 1,
    },
    {
      id: "4",
      imageUrl: "/user-photo-4.jpg",
      challenge: "Urban Jungle",
      votes: 156,
      rank: 12,
    },
  ],
  predictions: [
    {
      id: "1",
      challenge: "Today's Challenge",
      status: "active" as const,
      amount: 50,
      imageUrl: "/placeholder.svg?height=200&width=200",
      photographer: {
        username: "LensQueen",
        avatarUrl: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "2",
      challenge: "Yesterday's Winner",
      status: "won" as const,
      amount: 120,
      imageUrl: "/placeholder.svg?height=200&width=200",
      photographer: {
        username: "ShutterBug",
        avatarUrl: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "3",
      challenge: "Two Days Ago",
      status: "lost" as const,
      amount: 30,
      imageUrl: "/placeholder.svg?height=200&width=200",
      photographer: {
        username: "PixelPerfect",
        avatarUrl: "/placeholder.svg?height=40&width=40",
      },
    },
  ],
}

// Helper function to calculate time remaining
function calculateTimeRemaining(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return "Ended"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}

export default function Home() {
  const [showOnboarding, setShowOnboarding] = React.useState(true)
  const [showOnboardingSuccess, setShowOnboardingSuccess] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"vote" | "leaderboard">("vote")
  const [showProfile, setShowProfile] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)

  const [isVerificationOpen, setIsVerificationOpen] = React.useState(false)
  const [showPhotoPreview, setShowPhotoPreview] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [capturedPhotoUrl, setCapturedPhotoUrl] = React.useState<string | null>(null)

  // Supabase data state
  const [challenge, setChallenge] = React.useState<any>(null)
  const [submissions, setSubmissions] = React.useState<any[]>([])
  const [leaderboardData, setLeaderboardData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)

  // Fetch active challenge
  const fetchChallenge = async () => {
    try {
      const res = await fetch('/api/challenges')
      const data = await res.json()
      if (data.challenge) {
        setChallenge(data.challenge)
        // Fetch submissions for this challenge
        fetchSubmissions(data.challenge.id)
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
    }
  }

  // Fetch submissions for voting
  const fetchSubmissions = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/submissions?challengeId=${challengeId}`)
      const data = await res.json()
      if (data.submissions) {
        // Transform to match expected format
        const transformed = data.submissions.map((sub: any) => ({
          id: sub.id,
          imageUrl: sub.photo_url,
          username: sub.user?.username || 'Anonymous',
          avatarUrl: sub.user?.profile_picture_url || '/placeholder.svg',
          rank: sub.rank,
          wld: sub.total_wld_voted,
          potentialWld: sub.total_wld_voted * 2,
        }))
        setSubmissions(transformed)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard?limit=10')
      const data = await res.json()
      if (data.leaderboard) {
        const transformed = data.leaderboard.map((user: any, index: number) => ({
          rank: index + 1,
          username: user.username || 'Anonymous',
          avatarUrl: user.profile_picture_url || '/placeholder.svg',
          wld: user.total_wld_earned,
          wins: user.total_wins,
          imageUrl: '/placeholder.svg',
        }))
        setLeaderboardData(transformed)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchChallenge()
    fetchLeaderboard()
  }, [])

  const handleVote = async (photoId: string, vote: "up" | "down") => {
    if (!userId) {
      console.warn('No user ID available for voting')
      return
    }

    // For now, we'll just log the vote
    // In production, this would trigger a WLD payment transaction
    console.log('Vote:', { photoId, vote, userId })

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
  }

  const handleCameraClick = () => {
    setIsVerificationOpen(true)
  }

  const handleVerify = (photoUrl?: string) => {
    setIsVerificationOpen(false)
    if (photoUrl) {
      setCapturedPhotoUrl(photoUrl)
      setShowPhotoPreview(true)
    }
  }

  const handleRetake = () => {
    setShowPhotoPreview(false)
    setCapturedPhotoUrl(null)
    setIsVerificationOpen(true)
  }

  const handleSend = () => {
    setShowPhotoPreview(false)
    setShowSuccess(true)
  }

  const handleSuccessContinue = () => {
    setShowSuccess(false)
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Success screen is now handled within OnboardingScreen
    // setShowOnboardingSuccess(true) 
  }

  const handleOnboardingSuccessContinue = () => {
    setShowOnboardingSuccess(false)
  }

  const handleTabChange = (tab: "vote" | "leaderboard") => {
    setActiveTab(tab)
    setShowProfile(false)
  }

  useEffect(() => {
    // Additional setup or side effects can be added here
  }, [])

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  if (showOnboardingSuccess) {
    return <SuccessScreen type="onboarding" onContinue={handleOnboardingSuccessContinue} />
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
          ) : activeTab === "vote" ? (
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
                  title={challenge?.title || "Loading..."}
                  timeRemaining={challenge ? calculateTimeRemaining(challenge.end_time) : "..."}
                  submissionCount={submissions.length}
                  prizePool={challenge?.prize_pool ? `${challenge.prize_pool} WLD` : "..."}
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
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onCameraClick={handleCameraClick} />

      <HumanVerificationModal
        isOpen={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        onVerify={handleVerify}
      />

      {showPhotoPreview && capturedPhotoUrl && (
        <PhotoPreviewScreen photoUrl={capturedPhotoUrl} onRetake={handleRetake} onSend={handleSend} />
      )}

      {showSuccess && <SuccessScreen onContinue={handleSuccessContinue} />}
    </>
  )
}
