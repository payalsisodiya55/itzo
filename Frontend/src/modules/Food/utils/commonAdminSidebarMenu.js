export const commonAdminSidebarMenu = [
  {
    type: "section",
    label: "Settings",
    items: [
      {
        type: "link",
        label: "App Settings",
        path: "/admin/global-settings/app",
        icon: "Settings",
      },
      {
        type: "link",
        label: "Admin Settings",
        path: "/admin/global-settings/admin",
        icon: "UserCog",
      },
      {
        type: "expandable",
        label: "Customization",
        icon: "Palette",
        subItems: [
          {
            label: "Modules",
            path: "/admin/global-settings/modules",
            icon: "LayoutGrid",
          }
        ]
      }
    ]
  }
];
