import { useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { Editor } from "./components/editor/Editor";
import { useStore } from "./store/useStore";

function App() {
  const { fetchPages, isLoading } = useStore();

  useEffect(() => {
    fetchPages();
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
