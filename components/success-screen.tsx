"use client"

import { NeoButton } from "@/components/neo-button"
import { Check, Trophy, Bell, Download } from "lucide-react"
import { motion } from "framer-motion"

interface SuccessScreenProps {
  onContinue: () => void
  type?: "challenge" | "onboarding"
}

export function SuccessScreen({ onContinue, type = "challenge" }: SuccessScreenProps) {
  const isOnboarding = type === "onboarding"

  return (
    <div className="fixed inset-0 z-[70] bg-primary flex flex-col items-center justify-center p-6 text-primary-foreground">
      {/* Animated Success Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50 animate-pulse"></div>
        <div className="relative bg-white text-primary p-6 rounded-full border-4 border-black neo-shadow scale-110">
          <Check className="h-16 w-16 stroke-[4]" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black uppercase mb-4 text-center tracking-tighter"
      >
        {isOnboarding ? (
          <>
            You're
            <br />
            All Set!
          </>
        ) : (
          <>
            Challenge
            <br />
            Completed!
          </>
        )}
      </motion.h1>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 rounded-xl p-4 mb-8 w-full max-w-xs border-2 border-white/20 backdrop-blur-sm"
      >
        {isOnboarding ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-lg font-bold border-b border-white/20 pb-2">
              <Download className="h-5 w-5 text-white" />
              <span>App Added</span>
              <Check className="h-5 w-5 ml-auto text-green-300" strokeWidth={3} />
            </div>
            <div className="flex items-center gap-3 text-lg font-bold">
              <Bell className="h-5 w-5 text-white" />
              <span>Notifications On</span>
              <Check className="h-5 w-5 ml-auto text-green-300" strokeWidth={3} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-2 text-xl font-bold">
              <Trophy className="h-6 w-6 text-yellow-300 fill-yellow-300" />
              <span>Earned</span>
            </div>
            <div className="text-center text-3xl font-black text-white">+50 WLD</div>
          </>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg mb-8 text-center font-medium text-primary-foreground/90 max-w-xs"
      >
        {isOnboarding
          ? "Thanks for enabling notifications. You're now ready to join the daily challenges!"
          : "Your photo has been submitted to the stack. Good luck!"}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-xs"
      >
        <NeoButton
          onClick={onContinue}
          className="w-full bg-white text-black border-black hover:bg-gray-100 text-lg h-14"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          {isOnboarding ? "Let's Go" : "Continue"}
        </NeoButton>
      </motion.div>
    </div>
  )
}
