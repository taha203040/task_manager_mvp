import { AppSidebar } from "@/components/app-sidebar";
import ProtectedRoute from "@/components/Protected";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Dialog } from "@radix-ui/react-dialog";

import React from "react";

const Page = () => {
  return (
    <SidebarProvider>
      <ProtectedRoute>
        <div className="flex h-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <Dialog>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <Label>Project name</Label>
                    <Input type="text" />
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex-1 p-4">
              {/* Team list will be implemented here */}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </SidebarProvider>
  );
};

export default Page;
