import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// import data from "./data.json";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
// interface tasks {
//   id: number;
//   title: string;
//   type: string;
//   status: string;
//   priority: string;
// }
export default function Page() {
  const router = useRouter();
  const [data, setData] = useState([]);
  useEffect(() => {
    const handleData = async () => {
      try {
        const res = await api.get("/tasks/", { withCredentials: true });
        if (res.status === 200 && Array.isArray(res.data.tasks)) {
          const formatted = res.data.tasks.map((t: any) => ({
            id: String(t.id ?? ""), // تأكد أن القيمة نصية
            title: String(t.title ?? ""), // العنوان
            type: String(t.description ?? ""), // الوصف كنوع
            status: String(t.status ?? ""), // الحالة
            priority: String(t.priority ?? ""), // الأولوية
          }));
          setData(formatted);
        }
      } catch (err) {
        console.error(err);
      }
    };
    handleData();
  }, [router]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <SectionCards /> */}
              <div className="px-4 lg:px-6">
                {/* <ChartAreaInteractive /> */}
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
