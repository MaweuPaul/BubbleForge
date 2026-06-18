window.BUBBLEFORGE_SAMPLE_COMPONENTS = [
  {
    id: "comp-button-solid",
    category: "Buttons",
    name: "Solid Button",
    description: "A standard solid action button that adopts your brand color.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 44,
            "width": 150,
            "zindex": 2,
            "icon": "material outlined star_border",
            "order": 1,
            "fit_width": true,
            "fit_height": true,
            "single_width": false,
            "min_width_css": "80px",
            "single_height": false,
            "min_height_css": "44px",
            "horiz_alignment": "center",
            "collapse_when_hidden": true,
            "border_roundness": 6,
            "border_style": "solid",
            "border_width": 0,
            "boxshadow_style": "outset",
            "boxshadow_color": "rgba(0,0,0,0.1)",
            "boxshadow_blur_radius": 4,
            "boxshadow_vertical_offset": 2,
            "bgcolor": "{{PRIMARY_COLOR}}",
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "text": {
              "type": "TextExpression",
              "entries": {
                "0": "Submit"
              }
            }
          },
          "type": "Button",
          "id": "bTSoB",
          "default_name": "BF: Solid Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-button-outline",
    category: "Buttons",
    name: "Outline Button",
    description: "A button with a transparent background and dynamic border.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 44,
            "width": 150,
            "zindex": 2,
            "order": 2,
            "fit_width": true,
            "fit_height": true,
            "single_width": false,
            "min_width_css": "80px",
            "single_height": false,
            "min_height_css": "44px",
            "horiz_alignment": "center",
            "collapse_when_hidden": true,
            "border_roundness": 6,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "{{PRIMARY_COLOR}}",
            "bgcolor": "rgba(255,255,255,0)",
            "font_color": "{{PRIMARY_COLOR}}",
            "font_size": 14,
            "font_bold": true,
            "text": {
              "type": "TextExpression",
              "entries": {
                "0": "Secondary"
              }
            }
          },
          "type": "Button",
          "id": "bTOuB",
          "default_name": "BF: Outline Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-button-ghost",
    category: "Buttons",
    name: "Ghost Button",
    description: "A text-only button that adopts the brand color on hover.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 44,
            "width": 150,
            "zindex": 2,
            "order": 3,
            "fit_width": true,
            "fit_height": true,
            "single_width": false,
            "min_width_css": "80px",
            "single_height": false,
            "min_height_css": "44px",
            "horiz_alignment": "center",
            "collapse_when_hidden": true,
            "border_style": "none",
            "bgcolor": "rgba(255,255,255,0)",
            "font_color": "{{PRIMARY_COLOR}}",
            "font_size": 14,
            "font_bold": true,
            "text": {
              "type": "TextExpression",
              "entries": {
                "0": "Cancel"
              }
            }
          },
          "type": "Button",
          "id": "bTGhB",
          "default_name": "BF: Ghost Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-button-pill",
    category: "Buttons",
    name: "Pill Button",
    description: "A fully rounded button.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 44,
            "width": 150,
            "zindex": 2,
            "order": 4,
            "fit_width": true,
            "fit_height": true,
            "single_width": false,
            "min_width_css": "80px",
            "single_height": false,
            "min_height_css": "44px",
            "horiz_alignment": "center",
            "collapse_when_hidden": true,
            "border_roundness": 999,
            "border_style": "solid",
            "border_width": 0,
            "bgcolor": "{{PRIMARY_COLOR}}",
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "text": {
              "type": "TextExpression",
              "entries": {
                "0": "Pill Action"
              }
            }
          },
          "type": "Button",
          "id": "bTPiL",
          "default_name": "BF: Pill Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-pricing-card",
    category: "Cards",
    name: "Premium Pricing Card",
    description: "A beautifully styled, responsive flexbox pricing card with inner elements.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 400,
            "width": 300,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 16,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e2e8f0",
            "boxshadow_style": "outset",
            "boxshadow_color": "rgba(15,23,42,0.08)",
            "boxshadow_blur_radius": 24,
            "boxshadow_vertical_offset": 8,
            "padding_top": 32,
            "padding_bottom": 32,
            "padding_left": 32,
            "padding_right": 32,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bCardP",
          "default_name": "BF: Pricing Card Group"
        },
        {
          "properties": {
            "height": 24,
            "width": 100,
            "font_size": 14,
            "font_bold": true,
            "font_color": "{{PRIMARY_COLOR}}",
            "text": { "type": "TextExpression", "entries": { "0": "PRO PLAN" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bCardT1",
          "current_parent": "bCardP",
          "default_name": "BF: Plan Label"
        },
        {
          "properties": {
            "height": 60,
            "width": 200,
            "font_size": 42,
            "font_bold": true,
            "font_color": "#0f172a",
            "text": { "type": "TextExpression", "entries": { "0": "$29/mo" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bCardT2",
          "current_parent": "bCardP",
          "default_name": "BF: Plan Price"
        },
        {
          "properties": {
            "height": 100,
            "width": 200,
            "font_size": 15,
            "font_color": "#475569",
            "line_spacing": 1.6,
            "text": { "type": "TextExpression", "entries": { "0": "✓ Unlimited projects\n✓ Advanced analytics\n✓ 24/7 Priority support\n✓ Custom domains" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bCardT3",
          "current_parent": "bCardP",
          "default_name": "BF: Plan Features"
        },
        {
          "properties": {
            "height": 48,
            "width": 236,
            "bgcolor": "{{PRIMARY_COLOR}}",
            "font_color": "#ffffff",
            "font_size": 15,
            "font_bold": true,
            "border_roundness": 8,
            "text": { "type": "TextExpression", "entries": { "0": "Get Started" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bCardB",
          "current_parent": "bCardP",
          "default_name": "BF: Plan Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-alert-box",
    category: "Cards",
    name: "Success Alert Banner",
    description: "A soft, tinted alert box for success messages.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 64,
            "width": 400,
            "container_layout": "row",
            "bgcolor": "#dcfce7",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#bbf7d0",
            "padding_top": 16,
            "padding_bottom": 16,
            "padding_left": 20,
            "padding_right": 20
          },
          "type": "Group",
          "id": "bAlrt",
          "default_name": "BF: Success Alert"
        },
        {
          "properties": {
            "height": 24,
            "width": 300,
            "font_size": 14,
            "font_bold": true,
            "font_color": "#166534",
            "text": { "type": "TextExpression", "entries": { "0": "Successfully saved your changes." } }
          },
          "type": "Text",
          "id": "bAlrtT",
          "current_parent": "bAlrt",
          "default_name": "BF: Alert Text"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-command-card",
    category: "Cards",
    name: "Command Palette Card",
    description: "A shadcn-inspired command panel with search, grouped actions, and muted rows.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 360,
            "width": 520,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "boxshadow_style": "outset",
            "boxshadow_color": "rgba(0,0,0,0.08)",
            "boxshadow_blur_radius": 28,
            "boxshadow_vertical_offset": 12,
            "padding_top": 12,
            "padding_bottom": 12,
            "padding_left": 12,
            "padding_right": 12,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bCmdP",
          "default_name": "BF: Command Palette"
        },
        {
          "properties": {
            "height": 44,
            "width": 496,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "border_roundness": 6,
            "font_size": 14,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Search commands..." } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bCmdS",
          "current_parent": "bCmdP",
          "default_name": "BF: Command Search"
        },
        {
          "properties": {
            "height": 20,
            "width": 496,
            "font_size": 12,
            "font_bold": true,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "SUGGESTIONS" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bCmdH",
          "current_parent": "bCmdP",
          "default_name": "BF: Command Group Label"
        },
        {
          "properties": {
            "height": 44,
            "width": 496,
            "bgcolor": "#f4f4f5",
            "border_roundness": 6,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Create new component" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bCmdR1",
          "current_parent": "bCmdP",
          "default_name": "BF: Command Row Active"
        },
        {
          "properties": {
            "height": 44,
            "width": 496,
            "bgcolor": "#ffffff",
            "border_roundness": 6,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Open component library" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bCmdR2",
          "current_parent": "bCmdP",
          "default_name": "BF: Command Row"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-settings-card",
    category: "Cards",
    name: "Settings Card",
    description: "A clean settings panel with section title, description, and toggled rows.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 310,
            "width": 560,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "padding_top": 24,
            "padding_bottom": 24,
            "padding_left": 24,
            "padding_right": 24,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bSetG",
          "default_name": "BF: Settings Card"
        },
        {
          "properties": {
            "height": 28,
            "width": 512,
            "font_size": 18,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Notifications" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bSetT",
          "current_parent": "bSetG",
          "default_name": "BF: Settings Title"
        },
        {
          "properties": {
            "height": 40,
            "width": 512,
            "font_size": 14,
            "font_color": "#71717a",
            "line_spacing": 1.45,
            "text": { "type": "TextExpression", "entries": { "0": "Choose what updates your team receives from BubbleForge." } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bSetD",
          "current_parent": "bSetG",
          "default_name": "BF: Settings Description"
        },
        {
          "properties": {
            "height": 64,
            "width": 512,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "border_roundness": 8,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Product updates        Enabled" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bSetR1",
          "current_parent": "bSetG",
          "default_name": "BF: Settings Row"
        },
        {
          "properties": {
            "height": 64,
            "width": 512,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "border_roundness": 8,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Weekly summaries       Disabled" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bSetR2",
          "current_parent": "bSetG",
          "default_name": "BF: Settings Row"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-metric-card",
    category: "Cards",
    name: "Metric Card",
    description: "A dashboard stat card with label, value, trend, and muted supporting copy.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 176,
            "width": 320,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "padding_top": 22,
            "padding_bottom": 22,
            "padding_left": 22,
            "padding_right": 22,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bMetG",
          "default_name": "BF: Metric Card"
        },
        {
          "properties": {
            "height": 20,
            "width": 276,
            "font_size": 13,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Monthly recurring revenue" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bMetL",
          "current_parent": "bMetG",
          "default_name": "BF: Metric Label"
        },
        {
          "properties": {
            "height": 46,
            "width": 276,
            "font_size": 34,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "$42,580" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bMetV",
          "current_parent": "bMetG",
          "default_name": "BF: Metric Value"
        },
        {
          "properties": {
            "height": 24,
            "width": 116,
            "bgcolor": "#ecfdf5",
            "border_roundness": 999,
            "font_size": 12,
            "font_bold": true,
            "font_color": "#047857",
            "text": { "type": "TextExpression", "entries": { "0": "+12.5% this month" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bMetB",
          "current_parent": "bMetG",
          "default_name": "BF: Metric Badge"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-login-panel",
    category: "Form components",
    name: "Login Panel",
    description: "A shadcn-inspired auth panel with labels, inputs, helper copy, and primary action.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 420,
            "width": 400,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 10,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "padding_top": 30,
            "padding_bottom": 30,
            "padding_left": 30,
            "padding_right": 30,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bLogG",
          "default_name": "BF: Login Panel"
        },
        {
          "properties": {
            "height": 32,
            "width": 340,
            "font_size": 24,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Welcome back" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bLogT",
          "current_parent": "bLogG",
          "default_name": "BF: Login Title"
        },
        {
          "properties": {
            "height": 44,
            "width": 340,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "border_roundness": 6,
            "font_size": 14,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Email address" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bLogE",
          "current_parent": "bLogG",
          "default_name": "BF: Email Input Placeholder"
        },
        {
          "properties": {
            "height": 44,
            "width": 340,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "border_roundness": 6,
            "font_size": 14,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Password" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bLogP",
          "current_parent": "bLogG",
          "default_name": "BF: Password Input Placeholder"
        },
        {
          "properties": {
            "height": 44,
            "width": 340,
            "bgcolor": "#18181b",
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "border_roundness": 6,
            "text": { "type": "TextExpression", "entries": { "0": "Sign in" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bLogB",
          "current_parent": "bLogG",
          "default_name": "BF: Login Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-data-table",
    category: "Tables",
    name: "Data Table Shell",
    description: "A clean bordered table shell for admin dashboards and CRM layouts.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 300,
            "width": 720,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bTblG",
          "default_name": "BF: Data Table Shell"
        },
        {
          "properties": {
            "height": 44,
            "width": 720,
            "bgcolor": "#fafafa",
            "font_size": 13,
            "font_bold": true,
            "font_color": "#52525b",
            "text": { "type": "TextExpression", "entries": { "0": "Customer                 Status              Value              Updated" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTblH",
          "current_parent": "bTblG",
          "default_name": "BF: Table Header"
        },
        {
          "properties": {
            "height": 48,
            "width": 720,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Acme Inc.                Active              $4,200             Today" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTblR1",
          "current_parent": "bTblG",
          "default_name": "BF: Table Row"
        },
        {
          "properties": {
            "height": 48,
            "width": 720,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Northstar Labs           Pending             $1,840             Yesterday" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTblR2",
          "current_parent": "bTblG",
          "default_name": "BF: Table Row"
        }
      ],
      "type": "copy"
    }
  }
];
