"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, X, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getCategoryColor } from "@/lib/utils";
import { useSocket } from "@/components/socket-provider";
import type { Article } from "@/lib/types";

/**
 * Real-time notification panel showing recent articles
 */
export function NotificationPanel() {
  const { isConnected, newArticle } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Article[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Add new articles to notifications
  const addNotification = useCallback((article: Article) => {
    if (processedIdsRef.current.has(article.id)) return;
    processedIdsRef.current.add(article.id);

    setNotifications((prev) => [article, ...prev].slice(0, 10));
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Watch for new articles from socket
  useEffect(() => {
    if (newArticle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- valid real-time pattern
      addNotification(newArticle);
    }
  }, [newArticle, addNotification]);

  // Clear unread count when panel opens
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // Clear all notifications
  const handleClear = () => {
    setNotifications([]);
    setUnreadCount(0);
    processedIdsRef.current.clear();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute bottom-14 right-0 w-80 max-h-[400px] overflow-hidden shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Live Updates</CardTitle>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-xs h-7 px-2"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-destructive" />
                  <span>Disconnected</span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[300px] p-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No new articles yet
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium line-clamp-2">
                          {article.title}
                        </h4>
                        <Badge variant="outline" className={cn("text-xs shrink-0", getCategoryColor(article.category))}>
                          {article.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {article.author} ·{" "}
                        {new Date(article.createdAt).toLocaleTimeString("cs-CZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Toggle Button */}
      <Button
        size="icon"
        onClick={handleToggle}
        className="relative rounded-full shadow-lg h-12 w-12"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {/* Connection indicator */}
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
            isConnected ? "bg-green-500" : "bg-destructive"
          }`}
        />
      </Button>
    </div>
  );
}

