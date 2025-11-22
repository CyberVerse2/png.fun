"use client"

import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { NeoButton } from "@/components/neo-button"
import { ScanFace } from "lucide-react"

interface HumanVerificationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onVerify: () => void
}

export function HumanVerificationModal({ isOpen, onOpenChange, onVerify }: HumanVerificationModalProps) {
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
          <NeoButton variant="primary" size="lg" onClick={onVerify} className="w-full">
            <ScanFace className="mr-2 h-5 w-5" />
            Verify World ID
          </NeoButton>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
