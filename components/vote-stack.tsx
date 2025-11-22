"use client"

import * as React from "react"
import { PhotoCard } from "./photo-card"
import { NeoButton } from "./neo-button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion"

interface Photo {
  id: string
  imageUrl: string
  username: string
  avatarUrl: string
  rank?: number
  wld: number
  potentialWld: number
}

interface VoteStackProps {
  photos: Photo[]
  onVote: (photoId: string, vote: "up" | "down") => void
}

export function VoteStack({ photos, onVote }: VoteStackProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  // We'll use framer-motion's controls for programmatic animation (buttons)
  const controls = useAnimation()

  // Motion values for the top card
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

  // Determine color overlay based on drag direction
  // Red for left (bad), Green/Blue for right (good)
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  const handleDragEnd = async (event: any, info: any) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (offset > 100 || velocity > 500) {
      // Swiped right (Good/Up)
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } })
      onVote(photos[currentIndex].id, "up")
      setCurrentIndex((prev) => prev + 1)
      x.set(0)
      controls.set({ x: 0, opacity: 1 })
    } else if (offset < -100 || velocity < -500) {
      // Swiped left (Bad/Down)
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } })
      onVote(photos[currentIndex].id, "down")
      setCurrentIndex((prev) => prev + 1)
      x.set(0)
      controls.set({ x: 0, opacity: 1 })
    } else {
      // Reset
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } })
    }
  }

  const handleVote = async (vote: "up" | "down") => {
    if (currentIndex >= photos.length) return

    const direction = vote === "up" ? 500 : -500

    await controls.start({ x: direction, opacity: 0, transition: { duration: 0.2 } })
    onVote(photos[currentIndex].id, vote)
    setCurrentIndex((prev) => prev + 1)
    x.set(0)
    controls.set({ x: 0, opacity: 1 })
  }

  if (currentIndex >= photos.length) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black uppercase mb-2">All Done!</h2>
          <p className="font-bold text-muted-foreground">Check back tomorrow for new photos</p>
        </div>
      </div>
    )
  }

  const visiblePhotos = photos.slice(currentIndex, currentIndex + 3).reverse()

  return (
    <div className="flex-1 flex flex-col px-4 overflow-hidden">
      {/* Card Stack */}
      <div className="relative flex-1 flex items-center justify-center mb-6">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {visiblePhotos.map((photo, index) => {
            // visiblePhotos is reversed, so the last item is the top card (current index)
            const isTop = index === visiblePhotos.length - 1
            // Calculate original index relative to currentIndex for stacking logic
            const stackIndex = visiblePhotos.length - 1 - index

            if (isTop) {
              return (
                <motion.div
                  key={photo.id}
                  style={{
                    x,
                    rotate,
                    zIndex: 10,
                    transformOrigin: "bottom center", // Pivot from bottom for card-like feel
                  }}
                  animate={controls}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
                  whileTap={{ scale: 1.05, cursor: "grabbing" }} // Increased scale feedback
                >
                  <PhotoCard {...photo} className="w-full h-full shadow-xl" />
                  {/* Swipe Indicators */}
                  <motion.div
                    style={{ opacity: likeOpacity }}
                    className="absolute top-8 left-8 bg-green-500 text-white border-4 border-white px-4 py-2 rounded-lg transform -rotate-12 z-20 pointer-events-none"
                  >
                    <span className="text-2xl font-black uppercase">GOOD</span>
                  </motion.div>

                  <motion.div
                    style={{ opacity: nopeOpacity }}
                    className="absolute top-8 right-8 bg-red-500 text-white border-4 border-white px-4 py-2 rounded-lg transform rotate-12 z-20 pointer-events-none"
                  >
                    <span className="text-2xl font-black uppercase">NOPE</span>
                  </motion.div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={photo.id}
                className="absolute inset-0"
                initial={{ scale: 0.9, opacity: 0 }} // Entry animation for background cards
                animate={{
                  zIndex: index,
                  rotate: stackIndex * 1, // Reduced fan rotation to 1 degree
                  x: stackIndex * 2, // Reduced fan offset to 2px
                  y: 0,
                  scale: 1 - stackIndex * 0.02,
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  transformOrigin: "bottom center",
                }}
              >
                <PhotoCard {...photo} className="w-full h-full shadow-md" />
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <NeoButton
          size="icon"
          variant="primary"
          onClick={() => handleVote("down")}
          className="bg-red-500 hover:bg-red-600 border-black"
          drag="x"
          dragConstraints={{ left: -500, right: 500 }}
          dragElastic={0.5}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ThumbsDown className="h-8 w-8 text-white" strokeWidth={3} />
        </NeoButton>

        <NeoButton
          size="icon"
          variant="primary"
          onClick={() => handleVote("up")}
          className="bg-green-500 hover:bg-green-600 border-black"
          drag="x"
          dragConstraints={{ left: -500, right: 500 }}
          dragElastic={0.5}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ThumbsUp className="h-8 w-8 text-white" strokeWidth={3} />
        </NeoButton>
      </div>
    </div>
  )
}
