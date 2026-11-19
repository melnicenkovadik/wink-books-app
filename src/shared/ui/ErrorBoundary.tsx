import { Component, type ReactNode } from 'react'
import { ErrorAlert } from './ErrorAlert'

type Props = {
  children: ReactNode
  message?: string
  // the error is cleared when this value changes, e.g. on navigation
  resetKey?: string
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  resetKey?: string
}

// Keeps a crash inside one part of the page: the rest of the app stays usable.
// It has to be a class, React has no hook for catching render errors.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (props.resetKey === state.resetKey) return null
    return { hasError: false, resetKey: props.resetKey }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback

    return (
      <ErrorAlert
        message={this.props.message ?? 'Something went wrong in this part of the page.'}
        onRetry={() => this.setState({ hasError: false })}
      />
    )
  }
}
