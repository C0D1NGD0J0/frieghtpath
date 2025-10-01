"use client";

import { useState, useEffect } from "react";
import { useAuth, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { socketService } from "@/lib/socket";
import styles from "./page.module.scss";
import {
  Provider,
  Status,
  CompletionMetrics,
  ErrorPayload,
  SessionCreatedPayload,
  StatusPayload,
  ChunkPayload,
  CompletePayload,
} from "@/lib/types";

interface ModelResponse {
  content: string;
  status: Status;
  error?: string;
  metrics?: CompletionMetrics;
}

const AVAILABLE_PROVIDERS: Provider[] = [
  { provider: "google", displayName: "Google Gemini" },
  { provider: "anthropic", displayName: "Anthropic Claude" },
];

export default function Home() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "google",
    "anthropic",
  ]);
  const [responses, setResponses] = useState<Record<string, ModelResponse>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;

    const initSocket = async () => {
      const token = await getToken();
      if (!token) return;

      const socket = socketService.connect(token);

      socket.on("error", (data: ErrorPayload) => {
        console.error("Socket error:", data.message || data.error);
        alert(data.message || data.error || "Unknown error occurred");
        setIsStreaming(false);
      });

      socket.on("sessionCreated", (data: SessionCreatedPayload) => {
        setSessionId(data.sessionId);
      });

      socket.on("modelStatus", (data: StatusPayload) => {
        setResponses((prev) => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            content: prev[data.model]?.content || "",
            status: data.status,
          },
        }));
      });

      socket.on("modelChunk", (data: ChunkPayload) => {
        setResponses((prev) => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            content: (prev[data.model]?.content || "") + data.chunk,
            status: "streaming",
          },
        }));
      });

      socket.on("modelComplete", (data: CompletePayload) => {
        setResponses((prev) => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            status: "complete",
            metrics: data.metrics,
          },
        }));
        setIsStreaming(false);
      });

      socket.on("modelError", (data: ErrorPayload) => {
        setResponses((prev) => ({
          ...prev,
          [data.model]: {
            ...prev[data.model],
            status: "error",
            error: data.error,
          },
        }));
      });
    };

    initSocket();

    return () => {
      socketService.disconnect();
    };
  }, [isSignedIn, getToken]);

  const handleSubmit = () => {
    if (!prompt.trim() || selectedProviders.length < 2 || isStreaming) return;

    setIsStreaming(true);
    setSessionId(null);
    setResponses({});

    const socket = socketService.getSocket();
    if (!socket) {
      setIsStreaming(false);
      alert("Socket not connected. Please refresh the page.");
      return;
    }

    socket.emit("startComparison", {
      prompt,
      providers: selectedProviders,
    });

    setPrompt("");
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) => {
      if (prev.includes(provider)) {
        return prev.filter((p) => p !== provider);
      }
      return [...prev, provider];
    });
  };

  if (!isSignedIn) {
    return (
      <div className={styles.container}>
        <h1>Please sign in to use the AI Playground</h1>
        <Link href="/sign-in">Sign In</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>AI Model Playground</h1>
          <p>Compare AI responses side-by-side</p>
        </div>
        <SignOutButton>
          <button className={styles.logoutButton}>Sign Out</button>
        </SignOutButton>
      </header>

      <div className={styles.controls}>
        <div className={styles.modelSelector}>
          <h3>Select Providers (minimum 2):</h3>
          <div className={styles.modelOptions}>
            {AVAILABLE_PROVIDERS.map((p) => (
              <label key={p.provider} className={styles.modelOption}>
                <input
                  type="checkbox"
                  checked={selectedProviders.includes(p.provider)}
                  onChange={() => toggleProvider(p.provider)}
                  disabled={isStreaming}
                />
                <span>{p.displayName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.promptInput}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            disabled={isStreaming}
            rows={4}
          />
          <button
            onClick={handleSubmit}
            disabled={
              !prompt.trim() || selectedProviders.length < 2 || isStreaming
            }
          >
            {isStreaming ? "Streaming..." : "Compare Providers"}
          </button>
        </div>
      </div>

      <div className={styles.responses}>
        {Object.entries(responses).map(([modelName, response]) => (
          <div key={modelName} className={styles.responseColumn}>
            <div className={styles.modelHeader}>
              <h3>{modelName}</h3>
              <span
                className={`${styles.status} ${
                  styles[response?.status || "idle"]
                }`}
              >
                {response?.status || "idle"}
              </span>
            </div>
            <div className={styles.content}>
              {response?.content || "Waiting..."}
            </div>
            {response?.metrics && (
              <div className={styles.metrics}>
                <span>
                  Duration:{" "}
                  {(response.metrics.durationInMilliseconds / 1000).toFixed(2)}s
                </span>
                <span>Tokens: {response.metrics.tokensUsed}</span>
                <span>Cost: ${response.metrics.estimatedCost.toFixed(4)}</span>
              </div>
            )}
            {response?.error && (
              <div className={styles.error}>Error: {response.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
