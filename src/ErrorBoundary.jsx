import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: '#1a0000', color: '#ff6666', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2>Something broke:</h2>
          {this.state.error.toString()}
          {'\n\n'}
          {this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}
