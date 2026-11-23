import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label, error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="m-4 rounded-lg border border-bad/40 bg-bad/5 p-4 text-sm">
        <p className="font-semibold text-bad">Something went wrong{this.props.label ? ` in ${this.props.label}` : ''}.</p>
        <p className="mt-1 font-mono text-xs">{this.state.error.message}</p>
        <p className="mt-2 text-subtle">Your work is saved in this browser (IndexedDB). Reloading the page usually fixes this.</p>
        <button className="mt-3 rounded border border-border px-2 py-1" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}
