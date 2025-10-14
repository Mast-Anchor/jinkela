"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_DURATION = 5000;

type Status = "info" | "success" | "warning" | "error";

interface Options {
  title: string;
  status?: Status;
  description?: string;
  duration?: number;
}

interface InternalNotification extends Options {
  id: string;
  createdAt: number;
  duration: number;
}

interface NotificationContextValue {
  notify: (opts: Options) => string;
  close: (id: string) => void;
  closeAll: () => void;
}

interface NotificationProps {
  notification: InternalNotification;
  onClose: (id: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

function Notification({
  notification,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: NotificationProps) {
  const { id, title, description, status } = notification;

  return (
    <div
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={() => onMouseLeave(id)}
      className="pointer-events-auto w-full max-w-sm translate-y-0 transform-cpu rounded-lg bg-white opacity-100 shadow-lg outline-1 outline-black/5 transition duration-300 ease-out sm:translate-x-0 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10 starting:translate-y-2 starting:opacity-0 starting:sm:translate-x-2 starting:sm:translate-y-0"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="shrink-0">
            {status === "info" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 text-blue-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            )}

            {status === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 text-green-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            )}

            {status === "warning" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 text-yellow-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            )}

            {status === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 text-red-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            )}
          </div>

          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </p>

            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>

          <div className="ml-4 flex shrink-0">
            <button
              type="button"
              onClick={() => onClose(id)}
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:hover:text-white dark:focus:outline-indigo-500"
            >
              <span className="sr-only">Close</span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<InternalNotification[]>(
    []
  );

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remaining = useRef<Map<string, number>>(new Map());

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    timers.current.delete(id);
    remaining.current.delete(id);
  }, []);

  const remove = useCallback(
    (id: string) => {
      const timer = timers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
      clearNotification(id);
    },
    [clearNotification]
  );

  const close = useCallback(
    (id: string) => {
      remove(id);
    },
    [remove]
  );

  const closeAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    remaining.current.clear();
    setNotifications([]);
  }, []);

  const notify = useCallback(
    (opts: Options) => {
      const id = Date.now().toString();
      const duration = opts.duration ?? DEFAULT_DURATION;
      const now = Date.now();

      const notification: InternalNotification = {
        id,
        duration,
        createdAt: now,
        title: opts.title,
        status: opts.status ?? "info",
        description: opts.description,
      };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        const timer = setTimeout(() => remove(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [remove]
  );

  const pause = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);

      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        if (notification && notification.duration > 0) {
          const _ = Date.now() - notification.createdAt;
          remaining.current.set(id, Math.max(0, notification.duration - _));
        }
        return prev;
      });
    }
  }, []);

  const resume = useCallback(
    (id: string) => {
      const rem = remaining.current.get(id);

      if (rem !== undefined && rem > 0) {
        const timer = setTimeout(() => remove(id), rem);
        timers.current.set(id, timer);
        remaining.current.delete(id);
      }
    },
    [remove]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotifications((prev) => {
          const last = prev[0];
          if (last) {
            close(last.id);
            return prev.filter((n) => n.id !== last.id);
          }
          return prev;
        });
      }
    };

    addEventListener("keydown", handleKeyDown);

    return () => removeEventListener("keydown", handleKeyDown);
  }, [close]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = new Map();
      remaining.current = new Map();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={useMemo(
        () => ({ notify, close, closeAll }),
        [notify, close, closeAll]
      )}
    >
      {children}

      <div className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {notifications.map((n) => (
            <Notification
              key={n.id}
              notification={n}
              onClose={close}
              onMouseEnter={pause}
              onMouseLeave={resume}
            />
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
}
