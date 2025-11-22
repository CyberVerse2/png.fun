import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { NeoButton } from "@/components/neo-button"
import { ScanFace } from "lucide-react"
import { MiniKit, VerificationLevel, ISuccessResult, MiniAppVerifyActionPayload } from "@worldcoin/minikit-js"
import { useState, useCallback, useEffect } from "react"

interface HumanVerificationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onVerify: () => void
}

export function HumanVerificationModal({ isOpen, onOpenChange, onVerify }: HumanVerificationModalProps) {
  const [loading, setLoading] = useState(false)

  const handleVerify = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      console.warn("MiniKit not installed, falling back to mock verification for browser testing")
      // For browser testing without MiniKit
      onVerify()
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/verify")
      const { nonce } = await res.json()

      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: "verify-human", // Replace with your action
        verification_level: VerificationLevel.Orb, // or VerificationLevel.Device
      })

      if (finalPayload.status === "success") {
        const verifyRes = await fetch("/api/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: finalPayload as ISuccessResult,
            nonce,
          }),
        })

        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          onVerify()
        } else {
          console.error("Verification failed backend check")
        }
      }
    } catch (error) {
      console.error("Verification error:", error)
    } finally {
      setLoading(false)
    }
  }, [onVerify])

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-muted h-20 w-20 rounded-full flex items-center justify-center mb-4">
            <ScanFace className="h-10 w-10 text-muted-foreground" />
          </div>
          <DrawerTitle className="text-2xl font-black uppercase">Human Verification</DrawerTitle>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Please verify your World ID to capture and submit your daily challenge photo.
          </p>
        </DrawerHeader>
        <DrawerFooter className="pb-8 px-4">
          <NeoButton variant="primary" size="lg" onClick={handleVerify} className="w-full" disabled={loading}>
            <ScanFace className="mr-2 h-5 w-5" />
            {loading ? "Verifying..." : "Verify World ID"}
          </NeoButton>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
