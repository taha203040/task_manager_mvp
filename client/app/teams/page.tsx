"use client";

import { AppSidebar } from "@/components/app-sidebar";
import ProtectedRoute from "@/components/Protected";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { api } from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const [data, setData] = useState({
    name: "",
    description: "",
  });

  // 🔹 Fetch Teams
  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await api.get("/teams/", { withCredentials: true });
      return res.data;
    },
  });

  // 🔹 Create Team Mutation
  const createTeamMutation = useMutation({
    mutationFn: async () =>
      await api.post("/teams/", data, { withCredentials: true }),
    onSuccess: () => {
      toast.success("Team created successfully");
    },
    onError: () => {
      toast.error("Team not created, try again");
    },
  });

  return (
    <SidebarProvider>
      <Toaster />
      <ProtectedRoute>
        <div className="flex h-full w-screen">
          <AppSidebar className="w-1/6" />
          <div className="flex-1 flex flex-col bg-background">
            {/* ─── Header / Create Team Dialog ─────────────────────────────── */}
            <div className="p-6 border-b flex justify-between items-center">
              <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Team</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create a new team</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createTeamMutation.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Team name</Label>
                      <Input
                        placeholder="Enter team name"
                        value={data.name}
                        onChange={(e) =>
                          setData({ ...data, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Short description"
                        value={data.description}
                        onChange={(e) =>
                          setData({ ...data, description: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createTeamMutation.isPending}
                    >
                      {createTeamMutation.isPending
                        ? "Creating..."
                        : "Create Team"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* ─── Team List Section ──────────────────────────────────────── */}
            <div className="flex-1 p-6 w-5/6">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-full animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {teams?.map((team: any) => (
                    <Card key={team.id} className="hover:shadow-md transition">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <CardTitle className="truncate">
                              {team.name}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                              {team.description || "No description"}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                ⋮
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Save</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </SidebarProvider>
  );
};

export default Page;
