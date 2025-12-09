
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Tour, TourStep } from './tour';
import { useAuth } from '../auth-provider';
import { LayoutDashboard, FileText, Settings, BarChart, Contact, ChevronsLeft, UserCircle } from 'lucide-react';

const TOUR_COMPLETED_KEY = 'tourCompleted_v2'; // Changed key to re-trigger for existing users

const tourSteps: TourStep[] = [
  {
    targetId: 'header',
    title: '¡Bienvenido a Nexo!',
    content: 'Este es tu centro de control para la gestión de facturas. ¡Vamos a dar un rápido paseo por las funciones principales!',
    icon: LayoutDashboard
  },
  {
    targetId: 'Dashboard',
    title: 'Dashboard',
    content: 'Aquí tienes un resumen visual del estado de tus comprobantes: cuántos has recibido, procesado y su valor total.',
    icon: LayoutDashboard
  },
  {
    targetId: 'Comprobantes',
    title: 'Comprobantes',
    content: 'Esta es la sección principal. Aquí puedes ver todas tus facturas y sincronizarlas desde tu correo.',
    icon: FileText
  },
  {
    targetId: 'Agenda',
    title: 'Agenda',
    content: 'Gestiona los datos de tus contactos: proveedores, clientes, y más, todo en un solo lugar.',
    icon: Contact
  },
  {
    targetId: 'Configuración',
    title: 'Configuración',
    content: 'Conecta tu cuenta de Google y personaliza la apariencia de la aplicación.',
    icon: Settings
  },
  {
    targetId: 'collapse-sidebar',
    title: 'Ocultar Barra Lateral',
    content: 'Puedes contraer la barra lateral para tener más espacio en pantalla. ¡Pruébalo!',
    icon: ChevronsLeft
  },
  {
    targetId: 'profile',
    title: 'Tu Perfil',
    content: 'Desde aquí puedes editar tu nombre, cerrar sesión o reiniciar este tour en cualquier momento.',
    icon: UserCircle
  },
];


interface TourContextType {
  startTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
      if (!tourCompleted) {
        // Use a small delay to ensure the UI is mounted
        setTimeout(() => setIsTourActive(true), 500);
      }
    }
  }, [user]);

  const handleCompleteTour = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setIsTourActive(false);
  }, []);

  const handleStartTour = useCallback(() => {
    // Reset completion state to allow re-taking the tour
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setIsTourActive(true);
  }, []);


  return (
    <TourContext.Provider value={{ startTour: handleStartTour }}>
      {children}
      {isTourActive && <Tour steps={tourSteps} onComplete={handleCompleteTour} />}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
