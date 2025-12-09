
'use client';

import { useState, createContext, useContext, ReactNode, useCallback } from 'react';

type LogLevel = 'INFO' | 'ERROR' | 'SUCCESS';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

export type LogFunction = (level: LogLevel, message: string, details?: any) => void;

interface LogContextType {
  logs: LogEntry[];
  addLog: LogFunction;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: LogLevel, message: string, details?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined,
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
    
    // Also log to console for debugging
    switch(level) {
        case 'INFO':
            console.info(`[INFO] ${message}`, details || '');
            break;
        case 'SUCCESS':
            console.log(`[SUCCESS] ${message}`, details || '');
            break;
        case 'ERROR':
            console.error(`[ERROR] ${message}`, details || '');
            break;
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export const useLogs = (): LogContextType => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
};
