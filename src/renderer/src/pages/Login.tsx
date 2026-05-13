import { useState, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignInWithOtpMutation, useVerifyOtpMutation } from '@renderer/store/api/auth'

export function Login(): JSX.Element {
  const navigate = useNavigate()
  const [email, setEmail] = useState('s16103145@gmail.com')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const [signInWithOtp, signInState] = useSignInWithOtpMutation()
  const [verifyOtp, verifyState] = useVerifyOtpMutation()

  const pending = signInState.isLoading || verifyState.isLoading
  const error = signInState.error || verifyState.error

  async function handleSendOtp(): Promise<void> {
    const result = await signInWithOtp({ email })
    if (!result.error) setOtpSent(true)
  }

  async function handleVerifyOtp(): Promise<void> {
    const result = await verifyOtp({ email, token: otp })
    if (!result.error) navigate('/')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <div>
        {!otpSent && (
          <input
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(e.currentTarget.value)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                handleSendOtp()
              }
            }}
            className="p-1.5 text-center outline-none border"
            placeholder="Enter Email"
            type="text"
          />
        )}
        {otpSent && (
          <input
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setOtp(e.currentTarget.value)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                handleVerifyOtp()
              }
            }}
            className="p-1.5 text-center outline-none border"
            placeholder="Enter OTP"
            type="text"
          />
        )}
      </div>
      {error && (
        <p className="text-red-600 text-sm">{typeof error === 'string' ? error : error.message}</p>
      )}
      {pending && 'loading'}
    </div>
  )
}
