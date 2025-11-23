'use client';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js';
import { useState } from 'react';

/**
 * This component sends WLD payments to the PNG.FUN smart contract
 * The payment command does an ERC20 transfer to the contract address
 * Includes a reference field that you can search for on-chain
 */
export const Pay = () => {
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);

  const onClickPay = async () => {
    // Send payment to PNG.FUN contract
    const contractAddress = process.env.NEXT_PUBLIC_PNG_FUN_CONTRACT_ADDRESS || '0xF29d3AEaf0cCD69F909FD999AebA1033C6859eAF';
    setButtonState('pending');

    const res = await fetch('/api/initiate-payment', {
      method: 'POST',
    });
    const { id } = await res.json();

    const result = await MiniKit.commandsAsync.pay({
      reference: id,
      to: contractAddress,
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(0.1, Tokens.WLD).toString(),
        },
      ],
      description: 'Payment to PNG.FUN Challenge Contract',
    });

    console.log(result.finalPayload);
    if (result.finalPayload.status === 'success') {
      setButtonState('success');
      // It's important to actually check the transaction result on-chain
      // You should confirm the reference id matches for security
      // Read more here: https://docs.world.org/mini-apps/commands/pay#verifying-the-payment
    } else {
      setButtonState('failed');
      setTimeout(() => {
        setButtonState(undefined);
      }, 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <LiveFeedback
        label={{
          failed: 'Failed',
          pending: 'Sending...',
          success: 'Success!',
        }}
        state={buttonState}
        className="w-auto"
      >
        <Button
          onClick={onClickPay}
          disabled={buttonState === 'pending'}
          size="sm"
          variant="primary"
          className="text-xs px-3 py-1"
        >
          Test Pay
        </Button>
      </LiveFeedback>
    </div>
  );
};
