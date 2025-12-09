import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, UserCircle, MessageSquare } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="p-1 bg-primary rounded-md">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Nexo</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </div>
    </header>
  );
}
