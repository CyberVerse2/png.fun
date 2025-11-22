"use client"

import * as React from "react"
import { NeoButton } from "./neo-button"
import { NeoCard } from "./neo-card"
import { Camera, ThumbsUp, Trophy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface OnboardingScreenProps {
  onComplete: () => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = React.useState(0)

  const steps = [
    {
      icon: (
        <div className="bg-primary text-primary-foreground p-6 rounded-full inline-flex items-center justify-center neo-shadow">
          <Camera className="h-10 w-10" strokeWidth={3} />
        </div>
      ),
      title: "Capture Moments",
      description: "Submit your best photos for daily challenges and compete with others",
    },
    {
      icon: (
        <div className="bg-primary text-primary-foreground p-6 rounded-full inline-flex items-center justify-center neo-shadow">
          <ThumbsUp className="h-10 w-10" strokeWidth={3} />
        </div>
      ),
      title: "Vote & Judge",
      description: "Help decide winners by voting on submissions from the community",
    },
    {
      icon: (
        <div className="bg-primary text-primary-foreground p-6 rounded-full inline-flex items-center justify-center neo-shadow">
          <Trophy className="h-10 w-10" strokeWidth={3} />
        </div>
      ),
      title: "Win Prizes",
      description: "Top photos earn WLD, streaks, and real cash prizes daily",
    },
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="text-5xl font-black uppercase mb-2 tracking-tight"
          >
            PNG.FUN
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm font-bold text-muted-foreground uppercase"
          >
            Social Photo Gaming
          </motion.div>
        </div>

        {/* Content Card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <NeoCard className="mb-8 p-8 text-center h-[300px] flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="text-primary mb-6 flex justify-center cursor-pointer"
                >
                  {steps[step].icon}
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-black uppercase mb-4"
                >
                  {steps[step].title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-bold text-muted-foreground leading-relaxed max-w-xs mx-auto"
                >
                  {steps[step].description}
                </motion.p>
              </NeoCard>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{
                width: index === step ? 32 : 12,
                backgroundColor: index === step ? "var(--primary)" : "var(--muted)",
                scale: index === step ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-3 rounded-full cursor-pointer"
              onClick={() => setStep(index)}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>

        {/* Action Button */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <NeoButton variant="primary" size="lg" onClick={handleNext} className="w-full">
            {step < steps.length - 1 ? "Next" : "Get Started"}
          </NeoButton>
        </motion.div>

        {/* Skip */}
        {step < steps.length - 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1, color: "var(--foreground)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="w-full mt-4 text-sm font-bold text-muted-foreground uppercase tracking-wide transition-colors"
          >
            Skip
          </motion.button>
        )}
      </div>
    </div>
  )
}
