
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Atualiza o estado para que o próximo render mostre a UI de fallback.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
          <div className="mb-8">
            <span className="text-8xl block mb-6 drop-shadow-sm">🍳</span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
              Ops! O Chef derrubou a panela.
            </h1>
            <p className="text-gray-500 font-medium max-w-xs mx-auto">
              Ocorreu um erro inesperado no aplicativo. Mas não se preocupe, vamos limpar tudo!
            </p>
          </div>
          
          <button
            onClick={this.handleReload}
            className="bg-chef-green text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-green-600 transition-all active:scale-95 text-sm uppercase tracking-widest"
          >
            Tentar Novamente
          </button>
          
          <p className="mt-12 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
            Chef.ai Recovery System
          </p>
        </div>
      );
    }

    // Fixed: In React class components, children must be accessed via this.props.children
    return this.props.children;
  }
}
