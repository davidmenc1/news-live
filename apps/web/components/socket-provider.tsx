"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import type { Article } from "@/lib/types";
import { toast } from "sonner";

interface SocketContextValue {
  isConnected: boolean;
  newArticle: Article | null;
}

const SocketContext = createContext<SocketContextValue>({
  isConnected: false,
  newArticle: null,
});

/**
 * Hook to access the socket context
 */
export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages Socket.io connection and broadcasts new article events
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [newArticle, setNewArticle] = useState<Article | null>(null);

  // Handle new article - update state and show toast
  const handleNewArticle = useCallback((article: Article) => {
    setNewArticle(article);

    toast(`New: ${article.title}`, {
      description: `${article.category} · ${article.author}`,
      action: {
        label: "Read",
        onClick: () => {
          window.location.href = `/articles/${article.id}`;
        },
      },
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      console.log("Socket connected");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_article", handleNewArticle);

    connectSocket();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_article", handleNewArticle);
      disconnectSocket();
    };
  }, [handleNewArticle]);

  return (
    <SocketContext.Provider value={{ isConnected, newArticle }}>
      {children}
    </SocketContext.Provider>
  );
}
