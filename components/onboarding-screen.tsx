'use client';

import * as React from 'react';
import { NeoButton } from './neo-button';
import { NeoCard } from './neo-card';
import { Camera, Trophy, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SuccessScreen } from './success-screen';
import { NotificationPrompt } from './notification-prompt';
import { MiniKit } from '@worldcoin/minikit-js';
import { useSession } from 'next-auth/react';
import { walletAuth } from '@/auth/wallet';

interface OnboardingScreenProps {
  onComplete: (notificationsEnabled: boolean) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = React.useState(0);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const steps = [
    {
      icon: (
        <div className="bg-primary text-primary-foreground p-6 rounded-full inline-flex items-center justify-center neo-shadow">
          <Camera className="h-10 w-10" strokeWidth={3} />
        </div>
      ),
      title: 'Daily Challenges',
      description: 'Capture and submit photos for themed challenges every day'
    },
    {
      icon: (
        <div className="bg-primary text-primary-foreground p-6 rounded-full inline-flex items-center justify-center neo-shadow">
          <Users className="h-10 w-10" strokeWidth={3} />
        </div>
      ),
      title: 'Vote & Predict',
      description: 'Vote on photos and predict winners to earn bonus rewards'
    },
    {
      icon: (
        <div className="bg-primary text-primary-foreground p-6 rounded-full inline-flex items-center justify-center neo-shadow">
          <Trophy className="h-10 w-10" strokeWidth={3} />
        </div>
      ),
      title: 'Win Prizes',
      description: 'Top photos earn WLD, streaks, and real cash prizes daily'
    }
  ];

  // Log component mount and auth state changes
  React.useEffect(() => {
    console.log('[Onboarding] Component mounted/updated. Auth state:', {
      isAuthenticated,
      isMiniKitInstalled: MiniKit.isInstalled()
    });
    // Note: Removed auto-authentication to prevent double nonce generation
    // User should explicitly trigger authentication by clicking button
  }, [isAuthenticated]);

  const handleGetStarted = async () => {
    console.log('[Onboarding] handleGetStarted triggered');

    // 1. Authenticate if needed
    if (!isAuthenticated) {
      console.log('[Onboarding] User not authenticated, triggering login...');
      setIsConnecting(true);
      try {
        const success = await walletAuth();
        console.log('[Onboarding] Authentication result:', success);

        if (!success) {
          console.log('[Onboarding] Authentication failed or cancelled');
          setIsConnecting(false);
          return;
        }
      } catch (error) {
        console.log('[Onboarding] Authentication error:', error);
        setIsConnecting(false);
        return;
      } finally {
        setIsConnecting(false);
      }
    } else {
      console.log('[Onboarding] User already authenticated, proceeding...');
    }

    // 2. Show success screen
    setShowSuccess(true);
  };

  // Handle success screen continue - shows Notifications modal
  const handleSuccessContinue = () => {
    setShowSuccess(false);
    setShowNotifications(true);
  };

  // Handle notifications complete - updates DB and finishes onboarding
  const handleNotificationsComplete = async (enabled: boolean) => {
    console.log('[Onboarding] Notifications complete, enabled:', enabled);
    setShowNotifications(false);
    setNotificationsEnabled(enabled);

    // Complete onboarding - parent will handle DB update with session data
    onComplete(enabled);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Last step - complete onboarding
      handleGetStarted();
    }
  };

  if (showSuccess) {
    return <SuccessScreen type="onboarding" onContinue={handleSuccessContinue} />;
  }

  return (
    <>
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'backOut' }}
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
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <NeoCard className="mb-8 p-8 text-center h-[300px] flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
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
                  backgroundColor: index === step ? 'var(--primary)' : 'var(--muted)',
                  scale: index === step ? 1.1 : 1
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-3 rounded-full cursor-pointer"
                onClick={() => setStep(index)}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          {/* Action Button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <NeoButton
              variant="primary"
              size="lg"
              onClick={handleNext}
              className="w-full"
              disabled={isConnecting}
            >
              {isConnecting
                ? 'Connecting...'
                : step < steps.length - 1
                ? 'Next'
                : isAuthenticated
                ? 'Get Started'
                : 'Connect World ID'}
            </NeoButton>
          </motion.div>

          {/* Skip */}
          {step < steps.length - 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.1, color: 'var(--foreground)' }}
              whileTap={{ scale: 0.95 }}
              disabled={isConnecting}
              onClick={async () => {
                // If not authenticated, authenticate first
                if (!isAuthenticated) {
                  setIsConnecting(true);
                  try {
                    const success = await walletAuth();
                    if (!success) {
                      alert('Please connect your wallet to continue');
                      setIsConnecting(false);
                      return;
                    }
                  } catch (error) {
                    alert('Please connect your wallet to continue');
                    setIsConnecting(false);
                    return;
                  } finally {
                    setIsConnecting(false);
                  }
                }
                // Skip to last step instead of bypassing the flow
                setStep(steps.length - 1);
              }}
              className="w-full mt-4 text-sm font-bold text-muted-foreground uppercase tracking-wide transition-colors"
            >
              Skip
            </motion.button>
          )}
        </div>
      </div>

      {/* Notifications Modal - appears after success screen */}
      <NotificationPrompt
        isOpen={showNotifications}
        onOpenChange={setShowNotifications}
        onComplete={handleNotificationsComplete}
      />
    </>
  );
}
