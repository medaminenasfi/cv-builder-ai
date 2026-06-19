'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Brain, BarChart3, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Enhancement',
      description: 'Let AI refine your bullets and achievements with professional language tailored to your tone.',
    },
    {
      icon: BarChart3,
      title: 'Real-time ATS Scoring',
      description: 'See your resume score instantly and identify gaps that keep you from landing interviews.',
    },
    {
      icon: Brain,
      title: 'Smart Job Matching',
      description: 'Paste any job description and get personalized suggestions to optimize your resume.',
    },
    {
      icon: CheckCircle2,
      title: 'Multiple Templates',
      description: 'Choose from 5 professionally designed templates that showcase your best work.',
    },
  ]

  const steps = [
    { num: '1', title: 'Sign Up', desc: 'Create your account in seconds' },
    { num: '2', title: 'Build', desc: 'Add your experience with AI guidance' },
    { num: '3', title: 'Optimize', desc: 'Get ATS score and improve with AI' },
    { num: '4', title: 'Share', desc: 'Get hired with a perfect resume' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-purple-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-semibold text-gray-900">ResumeAI</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block mb-4 px-3 py-1 bg-purple-100 rounded-full">
          <span className="text-xs font-semibold text-purple-700">AI-Powered Resume Builder</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-6 leading-tight">
          Land Your Dream Job with an{' '}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            ATS-Optimized Resume
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Stop guessing. Let AI help you build a resume that passes through ATS systems and gets you actual interviews.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/register">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg px-8 py-3 text-base font-medium hover:opacity-90 w-full sm:w-auto">
              Start Building Now
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button className="border border-purple-200 text-purple-700 bg-white rounded-lg px-8 py-3 text-base font-medium hover:bg-purple-50 w-full sm:w-auto">
              View Demo
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-purple-100">
          <div>
            <div className="text-3xl font-bold text-purple-600">10K+</div>
            <div className="text-sm text-gray-600">Resumes Built</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">92%</div>
            <div className="text-sm text-gray-600">Interview Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Professional Templates</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-gray-900 mb-4">Everything You Need to Succeed</h2>
          <p className="text-lg text-gray-600">Powerful tools to build, optimize, and perfect your resume</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="bg-white border border-purple-100 rounded-xl p-6 hover:border-purple-200 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mb-4">
                  <Icon size={24} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">4 simple steps to your perfect resume</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-gray-900 mb-4">Simple Pricing</h2>
          <p className="text-lg text-gray-600">Start free, upgrade when you need more</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white border border-purple-100 rounded-xl p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Free</h3>
            <p className="text-gray-600 mb-6">Perfect for getting started</p>
            <div className="text-3xl font-bold text-gray-900 mb-6">$0/mo</div>
            <ul className="space-y-3 mb-8">
              {['3 Resumes', '5 Templates', 'Basic AI Features', 'Email Support'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-purple-600" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="w-full">
              <Button className="w-full border border-purple-200 text-purple-700 bg-white rounded-lg py-2 text-sm font-medium hover:bg-purple-50">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 rounded-full">
              <span className="text-xs font-semibold">Most Popular</span>
            </div>
            <h3 className="text-2xl font-semibold mb-2">Pro</h3>
            <p className="text-white/80 mb-6">For serious job seekers</p>
            <div className="text-3xl font-bold mb-6">$9/mo</div>
            <ul className="space-y-3 mb-8">
              {['Unlimited Resumes', 'All Templates', 'Advanced AI', '100 AI Rewrites/mo', 'Priority Support'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={16} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="w-full">
              <Button className="w-full bg-white text-purple-600 rounded-lg py-2 text-sm font-medium hover:bg-white/90">
                Start Pro Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-semibold mb-4">Ready to Land Your Dream Job?</h2>
          <p className="text-lg text-white/90 mb-8">Join 10,000+ job seekers who&apos;ve already improved their resumes</p>
          <Link href="/register">
            <Button className="bg-white text-purple-600 rounded-lg px-8 py-3 text-base font-medium hover:bg-white/90">
              Get Started Free
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                  R
                </div>
                <span className="font-semibold text-gray-900">ResumeAI</span>
              </div>
              <p className="text-sm text-gray-600">Build better resumes with AI</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Features</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">About</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-100 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 ResumeAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
