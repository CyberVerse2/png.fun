"use client"

import * as React from "react"
import { TopBar } from "@/components/top-bar"
import { BottomNav } from "@/components/bottom-nav"
import { ChallengeHeader } from "@/components/challenge-header"
import { VoteStack } from "@/components/vote-stack"
import { LeaderboardScreen } from "@/components/leaderboard-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { OnboardingScreen } from "@/components/onboarding-screen"
// import { HumanVerificationModal } from "@/components/human-verification-modal"
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

export default function Home() {
  const [showOnboarding, setShowOnboarding] = React.useState(true)
  const [showOnboardingSuccess, setShowOnboardingSuccess] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"vote" | "leaderboard">("vote")
  const [showProfile, setShowProfile] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)

  const [isVerificationOpen, setIsVerificationOpen] = React.useState(false)
  const [showPhotoPreview, setShowPhotoPreview] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)
  // Mock captured photo
  const capturedPhotoUrl = "/placeholder.svg?height=800&width=600&text=Captured+Photo"

  const handleVote = (photoId: string, vote: "up" | "down") => {}

  const handleCameraClick = () => {
    setIsVerificationOpen(true)
  }

  const handleVerify = () => {
    setIsVerificationOpen(false)
    // Simulate "camera" delay or transition if desired, but for now direct:
    setShowPhotoPreview(true)
  }

  const handleRetake = () => {
    setShowPhotoPreview(false)
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
      <div className="pt-16 pb-20 min-h-screen flex flex-col overflow-hidden">
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
              className="flex flex-col flex-1 px-4 py-4"
            >
              <ChallengeHeader
                title="Capture Your Best Sunset"
                timeRemaining="8h 42m remaining"
                submissionCount={2453}
                prizePool="500 WLD"
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
              />
              <VoteStack photos={mockPhotos} onVote={handleVote} />
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
              <LeaderboardScreen entries={mockLeaderboard} currentUserRank={15} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onCameraClick={handleCameraClick} />

      {/* HumanVerificationModal removed as per user deletion */}
      {/* <HumanVerificationModal
        isOpen={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        onVerify={handleVerify}
      /> */}

      {showPhotoPreview && (
        <PhotoPreviewScreen photoUrl={capturedPhotoUrl} onRetake={handleRetake} onSend={handleSend} />
      )}

      {showSuccess && <SuccessScreen onContinue={handleSuccessContinue} />}
    </>
  )
}
