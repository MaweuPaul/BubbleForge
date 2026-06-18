(function () {
  "use strict";

  window.BUBBLEFORGE_SAMPLE_COMPONENTS = [
    {
      id: "button-primary",
      name: "Primary Button",
      category: "Buttons",
      description: "Simple primary button with a clean blue style.",
      access: "Free",
      bubbleJson: {
        bubbleforgeVersion: "0.0.1",
        type: "placeholder-bubble-component",
        id: "button-primary",
        name: "Primary Button",
        category: "Buttons",
        capturedFromBubble: false,
        note: "Replace this placeholder with real Bubble clipboard JSON after capture.",
        elements: [
          {
            type: "button",
            label: "Get Started",
            styles: {
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: 8,
              paddingX: 20,
              paddingY: 12
            }
          }
        ]
      }
    },
    {
      id: "button-loading",
      name: "Loading Button",
      category: "Buttons",
      description: "Button variant with a loading state placeholder.",
      access: "Free",
      bubbleJson: {
        bubbleforgeVersion: "0.0.1",
        type: "placeholder-bubble-component",
        id: "button-loading",
        name: "Loading Button",
        category: "Buttons",
        capturedFromBubble: false,
        states: ["default", "loading", "disabled"]
      }
    },
    {
      id: "pricing-card-standard",
      name: "SaaS Pricing Card",
      category: "Cards",
      description: "Compact pricing card for SaaS checkout sections.",
      access: "Free",
      bubbleJson: {
        bubbleforgeVersion: "0.0.1",
        type: "placeholder-bubble-component",
        id: "pricing-card-standard",
        name: "SaaS Pricing Card",
        category: "Cards",
        capturedFromBubble: false,
        layout: "vertical-card",
        slots: ["plan", "price", "features", "cta"]
      }
    },
    {
      id: "alert-info",
      name: "Info Alert",
      category: "Base components",
      description: "Inline information alert with title and supporting text.",
      access: "Free",
      bubbleJson: {
        bubbleforgeVersion: "0.0.1",
        type: "placeholder-bubble-component",
        id: "alert-info",
        name: "Info Alert",
        category: "Base components",
        capturedFromBubble: false,
        tone: "info"
      }
    },
    {
      id: "auth-input",
      name: "Auth Input",
      category: "Form components",
      description: "Email/password style input group for auth forms.",
      access: "Free",
      bubbleJson: {
        bubbleforgeVersion: "0.0.1",
        type: "placeholder-bubble-component",
        id: "auth-input",
        name: "Auth Input",
        category: "Form components",
        capturedFromBubble: false,
        fields: ["email", "password"]
      }
    },
    {
      id: "sidebar-nav-item",
      name: "Sidebar Nav Item",
      category: "Navigation",
      description: "Dashboard sidebar item with active and default states.",
      access: "Free",
      bubbleJson: {
        bubbleforgeVersion: "0.0.1",
        type: "placeholder-bubble-component",
        id: "sidebar-nav-item",
        name: "Sidebar Nav Item",
        category: "Navigation",
        capturedFromBubble: false,
        states: ["default", "hover", "active"]
      }
    }
  ];
})();
