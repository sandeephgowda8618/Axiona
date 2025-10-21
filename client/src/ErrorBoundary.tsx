import React from 'react'

interface State {
  hasError: boolean
  error?: Error | null
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console and to window so it's easy to copy-paste
    console.error('Uncaught error in React tree:', error, info)
    ;(window as any).__lastReactError = { error: String(error), info }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <h1 style={{ color: '#b91c1c' }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#111827' }}>{String(this.state.error)}</pre>
          <p>Please open DevTools Console and paste the error here so I can help debug.</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
