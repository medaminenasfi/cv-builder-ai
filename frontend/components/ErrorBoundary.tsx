'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl m-4">
            <p className="font-semibold text-red-800">Something went wrong</p>
            <p className="text-sm text-red-600 mt-1">{this.state.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 text-sm bg-white border border-red-200 rounded-lg text-red-700"
            >
              Try again
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
