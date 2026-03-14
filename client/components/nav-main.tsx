"use client";

import {
  IconCirclePlusFilled,
  IconMail,
  IconCheck,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
// import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const router = useRouter();
  let count = 19;
  const [data, setData] = useState<
    {
      id: string;
      team_id: string;
      invited_by: string;
      name?: string;
    }[]
  >([]);
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await api.get("/invites/user/", {
          withCredentials: true,
        });
        if (res.data) {
          const invitesWithTeamData = await Promise.all(
            res.data.map(async (invite: any) => {
              try {
                const teamRes = await api.get(`/teams/${invite.id}`, {
                  withCredentials: true,
                });
                return {
                  ...invite,
                  team_name: teamRes.data.name || "Unknown Team",
                };
              } catch (error) {
                console.error(`Failed to fetch team ${invite.team_id}:`, error);
                return {
                  ...invite,
                  team_name: "Unknown Team",
                };
              }
            })
          );
          setData(invitesWithTeamData);
          console.log("Fetched invites with team data:", invitesWithTeamData);
        }
      } catch (error) {
        console.error("Failed to fetch invites:", error);
      }
    };
    fetchInvites();
  }, []);
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="size-8 group-data-[collapsible=icon]:opacity-0 relative"
                  variant="outline"
                >
                  <IconMail />
                  {/* <IconMail /> */}
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[#fff] text-xs text-destructive-foreground">
                    {count > 0 && (count > 9 ? "+9" : count)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">  
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {data.map((invitation, i) => (
                    <DropdownMenuItem
                      key={invitation.id}
                      className="flex flex-col items-start gap-2 p-4 cursor-default"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-semibold">
                          {invitation.name || "Unknown Team"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Invited by: {invitation.invited_by}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You've been invited to join the "
                        {invitation.name || "Unknown Team"}" team.
                      </p>
                      <div className="flex w-full gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-white hover:bg-green-50"
                        >
                          <IconCheck color="green" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconX color="red" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => {
                  router.push(`${item.url}`);
                }}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
