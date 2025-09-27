
import * as React from 'react';
import toast from 'react-hot-toast';

type NotificationContextType = {
    showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// This is a simple implementation that can be extended.
// For example, you can add different icons or styles based on the type.
export const notificationHandler = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    switch (type) {
        case 'success':
            toast.success(message);
            break;
        case 'error':
            toast.error(message);
            break;
        case 'info':
        default:
            toast(message);
            break;
    }
};
