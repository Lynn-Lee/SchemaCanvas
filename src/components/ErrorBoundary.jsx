import { Component } from "react";

// Intentionally independent of the async i18next resource loader: this
// boundary must still render readable text if the crash happens before the
// active language bundle has finished loading.
const FALLBACK_COPY = {
  zh: {
    title: "发生错误",
    description:
      "重新加载此页面可恢复编辑器。除非清除站点数据，本地图表会继续保留在当前浏览器中。",
  },
  en: {
    title: "Something went wrong",
    description:
      "Reload this page to restore the editor. Local diagrams remain in this browser unless you clear site data.",
  },
};

function resolveFallbackCopy() {
  let language = "zh";
  try {
    language = localStorage.getItem("i18nextLng") || "zh";
  } catch {
    // Storage can throw (private browsing, disabled cookies); keep the default.
  }
  return FALLBACK_COPY[language] || FALLBACK_COPY.zh;
}

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
      const copy = resolveFallbackCopy();
      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
          <section
            aria-label={copy.title}
            role="alert"
            className="max-w-md text-center"
          >
            <h1 className="mb-3 text-2xl font-semibold">{copy.title}</h1>
            <p className="text-sm text-zinc-300">{copy.description}</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
