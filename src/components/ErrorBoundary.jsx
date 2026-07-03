import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error(error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
          <section
            aria-label="Something went wrong"
            role="alert"
            className="max-w-md text-center"
          >
            <h1 className="mb-3 text-2xl font-semibold">
              Something went wrong
            </h1>
            <p className="text-sm text-zinc-300">
              Reload this page to restore the editor. Local diagrams remain in
              this browser unless you clear site data.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
