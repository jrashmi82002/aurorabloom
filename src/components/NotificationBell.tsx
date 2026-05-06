import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNotifications } from "@/hooks/useNotifications";

const ICONS: Record<string, string> = {
  pro_access: "👑",
  broadcast: "📢",
  reminder: "⏰",
};

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, loading, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={markAllRead}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {items.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg">{ICONS[notification.type] ?? "ℹ️"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <p
                            className={`text-xs text-muted-foreground ${
                              notification.message.length > 100 ? "line-clamp-2" : ""
                            }`}
                          >
                            {notification.message}
                          </p>
                          {notification.message.length > 100 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="text-xs text-primary hover:underline mt-1">
                                  Read full message →
                                </button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    {ICONS[notification.type] ?? "ℹ️"} {notification.title}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {notification.message}
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
