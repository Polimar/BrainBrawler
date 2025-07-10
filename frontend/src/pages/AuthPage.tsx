import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppDispatch, RootState } from '../store/store'
import { login, register, clearError } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [mounted, setMounted] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      navigate('/app')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLogin) {
      await dispatch(login({
        emailOrUsername: formData.username || formData.email,
        password: formData.password
      }))
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match!')
        return
      }
      await dispatch(register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      }))
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    dispatch(clearError())
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500/10 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-purple-500/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-blue-500/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 right-1/3 w-28 h-28 bg-yellow-500/10 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Auth Container */}
      <div className={`w-full max-w-md ${mounted ? 'animate-fade-in-scale' : 'opacity-0'}`}>
        {/* Logo Header */}
        <div className="text-center mb-8">
          <img 
            src="/logo.jpg" 
            alt="BrainBrawler" 
            className="w-20 h-20 mx-auto rounded-2xl brain-glow animate-pulse-glow mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">BrainBrawler</h1>
          <p className="text-gray-300">
            {isLogin ? 'Welcome back, Brain Brawler!' : 'Join the ultimate trivia challenge!'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="glass-card p-8">
          <div className="flex rounded-xl bg-white/10 p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a cool username"
                  className="input-field"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {isLogin ? 'Username or Email' : 'Email'}
              </label>
              <input
                type={isLogin ? "text" : "email"}
                name={isLogin ? "username" : "email"}
                value={isLogin ? formData.username : formData.email}
                onChange={handleInputChange}
                placeholder={isLogin ? "Enter username or email" : "Enter your email"}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="input-field"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="input-field"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg relative"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </div>
              ) : (
                <>
                  {isLogin ? '🚀 Start Playing' : '🎮 Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <span className="text-gray-300">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={toggleMode}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 glass-card p-4">
          <h3 className="text-white font-medium mb-3 text-center">🎯 Try Demo Accounts</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-purple-400 font-medium">Admin</div>
              <div className="text-gray-400">admin / password123</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-blue-400 font-medium">Premium</div>
              <div className="text-gray-400">premiumuser / password123</div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthPage 