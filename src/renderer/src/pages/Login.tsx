import { useState, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@renderer/lib/supabase'

export function Login(): JSX.Element {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState('s16103145@gmail.com')
  const [otp, setOtp] = useState('')
  const [isEmailFieldVisible, setIsEmailFieldVisible] = useState(true)
  const [isOtpFieldVisible, setIsOtpFieldVisible] = useState(false)

  async function signInWithOtp(): Promise<void> {
    setError(null)
    setPending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
    })

    console.log(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

    console.log('error', error)

    if (!error) {
      setIsEmailFieldVisible(false)
      setIsOtpFieldVisible(true)
    } else {
      setError(error.message)
      setPending(false)
      return
    }
  }
  async function signInWithOtp2(): Promise<void> {
    setError(null)
    setPending(true)
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'email',
    })

    console.log('error', error)
    console.log('data', data)

    if (!error) {
      navigate('/')
    } else {
      setError(error.message)
      setPending(false)
      return
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <div>
        {isEmailFieldVisible && (
          <input
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(e.currentTarget.value)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                signInWithOtp()
              }
            }}
            className="p-1.5 text-center outline-none border"
            placeholder="Enter Email"
            type="text"
          />
        )}
        {isOtpFieldVisible && (
          <input
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setOtp(e.currentTarget.value)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                signInWithOtp2()
              }
            }}
            className="p-1.5 text-center outline-none border"
            placeholder="Enter OTP"
            type="text"
          />
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {pending && 'loading'}
    </div>
  )
}
