
import * as React from "react";
// FIX: Corrected import for `ProjectDetailViewProps`. It is defined in `../types` not `../components/ui/project-detail-view`.
import { ProjectDetailView } from "../components/ui/project-detail-view";
import { ProjectDetailViewProps } from "../types";

const Demo = () => {
  // Mock data to showcase the component
  const projectData: ProjectDetailViewProps = {
    id: "demo-project-1",
    client: "Client X",
    completionPercentage: 35,
    value: 12000,
    breadcrumbs: [
      { label: "Client Projects", href: "#" },
      { label: "Website Redesign for Client X", href: "#" },
    ],
    title: "Website Redesign for Client X",
    status: "In-Progress",
    assignees: [
      { name: "Achmad Hakim", avatarUrl: "https://picsum.photos/seed/achmad/150/150" },
      { name: "Samantha Emanuel", avatarUrl: "https://picsum.photos/seed/samantha/150/150" },
    ],
    dateRange: {
      start: "June 3, 2025",
      end: "June 28, 2025",
    },
    tags: [
        { label: "Design", variant: "destructive" },
        { label: "Client Work", variant: "secondary" },
    ],
    description:
      "This task focuses on preparing a high-impact visual presentation that showcases the new website design concept for Client X. The goal is to clearly communicate the updated UI direction, design system, and user flow improvements to the client in a concise and engaging format.",
    attachments: [
      { id: "demo-att-1", name: "ClientX_UI_Redesign.pdf", size: "4.8 Mb", type: "pdf" },
      { id: "demo-att-2", name: "Homepage_Mockup.fig", size: "12.4 Mb", type: "figma" },
    ],
    subTasks: [
      {
        id: 1,
        task: "Schedule initial client meeting",
        category: "Discovery",
        status: "Completed",
        dueDate: "June 3, 2025",
      },
      {
        id: 2,
        task: "Gather business goals and user needs",
        category: "Discovery",
        status: "Completed",
        dueDate: "June 4, 2025",
      },
      {
        id: 3,
        task: "Review current website performance",
        category: "Discovery",
        status: "In Progress",
        dueDate: "June 5, 2025",
      },
       {
        id: 4,
        task: "Develop wireframes and prototypes",
        category: "Design",
        status: "Pending",
        dueDate: "June 12, 2025",
      },
    ],
    onBack: () => console.log("Back clicked"),
    onUpdate: (p) => console.log("Update", p),
  };

  return (
    <div className="flex items-start md:items-center justify-center min-h-screen p-4 sm:p-8 bg-muted/20 dark:bg-background">
      <ProjectDetailView {...projectData} />
    </div>
  );
};

export default Demo;
