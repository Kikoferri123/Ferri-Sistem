import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: `${error.name}: ${error.message}\n${error.stack}` };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fee', minHeight: '100vh' }}>
          <h1 style={{ color: 'red', fontSize: 24 }}>Erro no Frontend</h1>
          <p style={{ marginTop: 10 }}>Algo deu errado. Copie o texto abaixo e envie:</p>
          <pre style={{ background: '#fff', padding: 20, border: '1px solid #ccc', marginTop: 20, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12 }}>
            {this.state.error}
          </pre>
          <button onClick={() => { this.setState({ hasError: false, error: '' }); window.location.href = '/'; }}
            style={{ marginTop: 20, padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Voltar ao Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
