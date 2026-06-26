import { useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { Editor } from "./components/editor/Editor";
import { useStore } from "./store/useStore";

function App() {
  const fetchPages = useStore(state => state.fetchPages);
  const isLoading = useStore(state => state.isLoading);

  useEffect(() => {
    fetchPages();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-muted">Loading...</div>
  }

  return (
    <Layout>
      <Editor />
    </Layout>
  );
}

export default App;
