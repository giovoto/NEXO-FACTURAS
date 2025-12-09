
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, X, Sparkles } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  icon: LucideIcon;
}

interface TourProps {
  steps: TourStep[];
  onComplete: () => void;
}

export function Tour({ steps, onComplete }: TourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isClosing, setIsClosing] = useState(false);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    const updatePosition = () => {
      const targetElement = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        
        const cardWidth = 350;
        const cardHeightEstimate = 250;
        const gap = 20;

        let top = rect.top + rect.height / 2 - cardHeightEstimate / 2;
        let left = rect.right + gap;

        // Adjust if it goes off-screen to the right
        if (left + cardWidth > window.innerWidth) {
            left = rect.left - cardWidth - gap;
        }
        
        // Adjust if it goes off-screen to the left
        if (left < 0) {
          left = gap;
        }

        // Adjust vertically
        if (top < gap) {
            top = gap;
        }
        if (top + cardHeightEstimate > window.innerHeight) {
            top = window.innerHeight - cardHeightEstimate - gap;
        }

        setPosition({ top, left });
      } else {
        // If target is not found, center the tour card
        setTargetRect(null);
        setPosition({ 
          top: window.innerHeight / 2 - 150, 
          left: window.innerWidth / 2 - 175 
        });
      }
    };
    
    // Initial positioning and on resize
    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep]);

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };
  
  const handleComplete = () => {
      setIsClosing(true);
      setTimeout(onComplete, 300);
  }

  const Icon = currentStep.icon;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 z-[100]"
        onClick={handleComplete}
      />
      {targetRect && (
        <div
          className="fixed z-[101] border-2 border-primary border-dashed rounded-lg bg-primary/10 transition-all duration-300 pointer-events-none"
          style={{
            top: targetRect.top - 5, left: targetRect.left - 5,
            width: targetRect.width + 10, height: targetRect.height + 10,
          }}
        />
      )}
      
        {!isClosing && (
          <div
            key={currentStepIndex}
            className="fixed z-[102] w-[350px]"
            style={{
              top: position.top, 
              left: position.left
            }}
          >
            <Card className="shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary"/>
                    </div>
                    <CardTitle>{currentStep.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleComplete}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentStep.content}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Paso {currentStepIndex + 1} de {steps.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrev} disabled={currentStepIndex === 0}>
                    <ArrowLeft className="h-4 w-4"/>
                  </Button>
                  <Button onClick={handleNext}>
                    {currentStepIndex === steps.length - 1 ? (
                      <>Finalizar <Sparkles className="h-4 w-4 ml-2"/></>
                    ) : (
                      <ArrowRight className="h-4 w-4"/>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      
    </>
  );
}
