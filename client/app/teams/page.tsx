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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import SearchBox from "@/components/search.compontes";
const Page = () => {
  const [data, setData] = useState({
    name: "",
    description: "",
  });

  // 🔹 Fetch Teams
  const fetchTeams = async () => {
    const res = await api.get("/teams/", { withCredentials: true });
    return res.data;
  };

  const {
    data: teams,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`, { withCredentials: true });
    },
    onSuccess: () => {
      toast.success("Team deleted successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete team");
    },
  });
  const createTeamMutation = useMutation({
    // 🔹 Create Team Mutation
    mutationFn: async () =>
      await api.post("/teams/", data, { withCredentials: true }),
    onSuccess: () => {
      toast.success("Team created successfully");
      refetch();
    },
    onError: () => {
      toast.error("Team not created, try again");
    },
  });
  
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  console.log('s',selectedTeam?.id)

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
                    <Card
                      onClick={() => {
                        setSelectedTeam(team);
                        setOpen(true);
                      }}
                      key={team.id}
                      className="hover:shadow-md transition"
                    >
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
                              <DropdownMenuItem
                                onClick={() => deleteTeam.mutate(team.id)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  <Drawer direction="right" open={open} onOpenChange={setOpen}>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>{selectedTeam?.name}</DrawerTitle>
                        <DrawerDescription>
                          {selectedTeam?.description ||
                            "No description available."}
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="p-4 space-y-6">
                        {/* ===== TEAM BASIC INFO ===== */}
                        <section>
                          <h3 className="text-sm font-semibold mb-2">
                            Team Info
                          </h3>
                          <label>username</label>
                          <Input type="text" />
                          <p>
                            <strong>ID:</strong> {selectedTeam?.id}
                          </p>
                          {/* <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <strong>Created At:</strong>{" "}
                              {selectedTeam?.createdAt}
                            </p>
                            <p>
                              <strong>Last Updated:</strong>{" "}
                              {selectedTeam?.updatedAt}
                            </p>
                            <p>
                              <strong>Status:</strong> Active
                            </p>
                          </div> */}
                        </section>
                        <SearchBox />
                        {/* ===== MEMBERS SECTION ===== */}
                        <section>
                          <h3 className="text-sm font-semibold mb-2">
                            Members
                          </h3>

                          <div className="space-y-2">
                            {selectedTeam?.members?.length ? (
                              selectedTeam.members.map((member: any) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between p-2 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={member.avatar}
                                      alt={member.name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {member.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {member.role}
                                      </p>
                                    </div>
                                  </div>

                                  <Button variant="ghost" size="sm">
                                    Remove
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No members found.
                              </p>
                            )}{" "}
                          </div>
                        </section>
                      </div>
                    </DrawerContent>
                  </Drawer>
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
