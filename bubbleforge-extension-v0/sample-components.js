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
  },
  {
    id: "comp-shadcn-dashboard-header",
    category: "Navigation",
    name: "Dashboard Header",
    description: "A shadcn-style app header with title, breadcrumb copy, and compact actions.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 88,
            "width": 760,
            "container_layout": "row",
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "border_roundness": 8,
            "padding_top": 18,
            "padding_bottom": 18,
            "padding_left": 22,
            "padding_right": 22,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bHdrG",
          "default_name": "BF: Dashboard Header"
        },
        {
          "properties": {
            "height": 28,
            "width": 420,
            "font_size": 22,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Components" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bHdrT",
          "current_parent": "bHdrG",
          "default_name": "BF: Header Title"
        },
        {
          "properties": {
            "height": 20,
            "width": 420,
            "font_size": 13,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Library / Components / Buttons" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bHdrB",
          "current_parent": "bHdrG",
          "default_name": "BF: Breadcrumb"
        },
        {
          "properties": {
            "height": 38,
            "width": 132,
            "bgcolor": "#18181b",
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "border_roundness": 6,
            "text": { "type": "TextExpression", "entries": { "0": "New component" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bHdrA",
          "current_parent": "bHdrG",
          "default_name": "BF: Header Action"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-empty-state",
    category: "Cards",
    name: "Empty State",
    description: "A centered empty state with muted copy and a clear primary action.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 280,
            "width": 520,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "dashed",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "padding_top": 40,
            "padding_bottom": 40,
            "padding_left": 40,
            "padding_right": 40,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bEmpG",
          "default_name": "BF: Empty State"
        },
        {
          "properties": {
            "height": 32,
            "width": 440,
            "font_size": 20,
            "font_bold": true,
            "font_color": "#18181b",
            "horiz_alignment": "center",
            "text": { "type": "TextExpression", "entries": { "0": "No components yet" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bEmpT",
          "current_parent": "bEmpG",
          "default_name": "BF: Empty Title"
        },
        {
          "properties": {
            "height": 48,
            "width": 440,
            "font_size": 14,
            "font_color": "#71717a",
            "horiz_alignment": "center",
            "line_spacing": 1.5,
            "text": { "type": "TextExpression", "entries": { "0": "Generate your first component or import one from the shared library." } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bEmpD",
          "current_parent": "bEmpG",
          "default_name": "BF: Empty Description"
        },
        {
          "properties": {
            "height": 40,
            "width": 156,
            "bgcolor": "#18181b",
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "border_roundness": 6,
            "text": { "type": "TextExpression", "entries": { "0": "Create component" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bEmpB",
          "current_parent": "bEmpG",
          "default_name": "BF: Empty Action"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-invoice-card",
    category: "Cards",
    name: "Invoice Card",
    description: "A billing card with invoice metadata, total, status pill, and action button.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 240,
            "width": 420,
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
          "id": "bInvG",
          "default_name": "BF: Invoice Card"
        },
        {
          "properties": {
            "height": 26,
            "width": 260,
            "font_size": 18,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Invoice #BF-1048" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bInvT",
          "current_parent": "bInvG",
          "default_name": "BF: Invoice Title"
        },
        {
          "properties": {
            "height": 24,
            "width": 72,
            "bgcolor": "#ecfdf5",
            "border_roundness": 999,
            "font_size": 12,
            "font_bold": true,
            "font_color": "#047857",
            "text": { "type": "TextExpression", "entries": { "0": "Paid" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bInvP",
          "current_parent": "bInvG",
          "default_name": "BF: Invoice Status"
        },
        {
          "properties": {
            "height": 48,
            "width": 376,
            "font_size": 34,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "$1,248.00" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bInvV",
          "current_parent": "bInvG",
          "default_name": "BF: Invoice Amount"
        },
        {
          "properties": {
            "height": 40,
            "width": 140,
            "bgcolor": "#18181b",
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "border_roundness": 6,
            "text": { "type": "TextExpression", "entries": { "0": "Download PDF" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bInvB",
          "current_parent": "bInvG",
          "default_name": "BF: Invoice Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-team-list",
    category: "Lists",
    name: "Team List",
    description: "A compact team member list with role metadata and status badges.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 280,
            "width": 520,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "padding_top": 14,
            "padding_bottom": 14,
            "padding_left": 14,
            "padding_right": 14,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bTeamG",
          "default_name": "BF: Team List"
        },
        {
          "properties": {
            "height": 56,
            "width": 492,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Paul Maweu                 Owner        Active" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTeamR1",
          "current_parent": "bTeamG",
          "default_name": "BF: Team Row"
        },
        {
          "properties": {
            "height": 56,
            "width": 492,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Amina Otieno              Designer     Invited" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTeamR2",
          "current_parent": "bTeamG",
          "default_name": "BF: Team Row"
        },
        {
          "properties": {
            "height": 56,
            "width": 492,
            "font_size": 14,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Daniel Kim                Developer    Active" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTeamR3",
          "current_parent": "bTeamG",
          "default_name": "BF: Team Row"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-activity-feed",
    category: "Lists",
    name: "Activity Feed",
    description: "A timeline-style activity feed for dashboards and admin panels.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 320,
            "width": 460,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "padding_top": 20,
            "padding_bottom": 20,
            "padding_left": 20,
            "padding_right": 20,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bActG",
          "default_name": "BF: Activity Feed"
        },
        {
          "properties": {
            "height": 26,
            "width": 420,
            "font_size": 18,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Recent activity" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bActT",
          "current_parent": "bActG",
          "default_name": "BF: Activity Title"
        },
        {
          "properties": {
            "height": 62,
            "width": 420,
            "font_size": 14,
            "font_color": "#18181b",
            "line_spacing": 1.45,
            "text": { "type": "TextExpression", "entries": { "0": "Component generated\n2 minutes ago" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bActR1",
          "current_parent": "bActG",
          "default_name": "BF: Activity Row"
        },
        {
          "properties": {
            "height": 62,
            "width": 420,
            "font_size": 14,
            "font_color": "#18181b",
            "line_spacing": 1.45,
            "text": { "type": "TextExpression", "entries": { "0": "Library synced\n18 minutes ago" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bActR2",
          "current_parent": "bActG",
          "default_name": "BF: Activity Row"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-shadcn-toast",
    category: "Base components",
    name: "Toast Notification",
    description: "A compact success toast with title, body, and subtle elevation.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 92,
            "width": 360,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 8,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "boxshadow_style": "outset",
            "boxshadow_color": "rgba(0,0,0,0.12)",
            "boxshadow_blur_radius": 22,
            "boxshadow_vertical_offset": 10,
            "padding_top": 16,
            "padding_bottom": 16,
            "padding_left": 16,
            "padding_right": 16,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bTstG",
          "default_name": "BF: Toast Notification"
        },
        {
          "properties": {
            "height": 22,
            "width": 328,
            "font_size": 14,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Component saved" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTstT",
          "current_parent": "bTstG",
          "default_name": "BF: Toast Title"
        },
        {
          "properties": {
            "height": 22,
            "width": 328,
            "font_size": 13,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Your component is now available in My Library." } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTstD",
          "current_parent": "bTstG",
          "default_name": "BF: Toast Description"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-common-top-navbar",
    category: "Navigation",
    name: "Top Navbar",
    description: "A common SaaS navbar with brand, links, and primary action.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 72,
            "width": 960,
            "container_layout": "row",
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "padding_top": 16,
            "padding_bottom": 16,
            "padding_left": 24,
            "padding_right": 24,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bNavG",
          "default_name": "BF: Top Navbar"
        },
        {
          "properties": {
            "height": 28,
            "width": 160,
            "font_size": 20,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "BubbleForge" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bNavB",
          "current_parent": "bNavG",
          "default_name": "BF: Brand"
        },
        {
          "properties": {
            "height": 24,
            "width": 320,
            "font_size": 14,
            "font_color": "#52525b",
            "text": { "type": "TextExpression", "entries": { "0": "Components     Pricing     Docs" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bNavL",
          "current_parent": "bNavG",
          "default_name": "BF: Nav Links"
        },
        {
          "properties": {
            "height": 38,
            "width": 118,
            "bgcolor": "#18181b",
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "border_roundness": 6,
            "text": { "type": "TextExpression", "entries": { "0": "Get started" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bNavA",
          "current_parent": "bNavG",
          "default_name": "BF: Navbar Action"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-common-sidebar",
    category: "Navigation",
    name: "App Sidebar",
    description: "A standard app sidebar with logo, navigation items, and account footer.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 640,
            "width": 260,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "padding_top": 20,
            "padding_bottom": 20,
            "padding_left": 14,
            "padding_right": 14,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bSideG",
          "default_name": "BF: App Sidebar"
        },
        {
          "properties": {
            "height": 32,
            "width": 232,
            "font_size": 18,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Workspace" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bSideB",
          "current_parent": "bSideG",
          "default_name": "BF: Sidebar Brand"
        },
        {
          "properties": {
            "height": 40,
            "width": 232,
            "bgcolor": "#f4f4f5",
            "border_roundness": 6,
            "font_size": 14,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Dashboard" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bSideA",
          "current_parent": "bSideG",
          "default_name": "BF: Sidebar Active Item"
        },
        {
          "properties": {
            "height": 132,
            "width": 232,
            "font_size": 14,
            "font_color": "#52525b",
            "line_spacing": 2.15,
            "text": { "type": "TextExpression", "entries": { "0": "Components\nAI Generator\nBilling\nSettings" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bSideL",
          "current_parent": "bSideG",
          "default_name": "BF: Sidebar Links"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-common-tabs",
    category: "Base components",
    name: "Tabs",
    description: "A common tab control with active state and three options.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 44,
            "width": 420,
            "container_layout": "row",
            "bgcolor": "#f4f4f5",
            "border_roundness": 8,
            "padding_top": 4,
            "padding_bottom": 4,
            "padding_left": 4,
            "padding_right": 4,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bTabsG",
          "default_name": "BF: Tabs"
        },
        {
          "properties": {
            "height": 36,
            "width": 136,
            "bgcolor": "#ffffff",
            "border_roundness": 6,
            "boxshadow_style": "outset",
            "boxshadow_color": "rgba(0,0,0,0.08)",
            "boxshadow_blur_radius": 8,
            "font_size": 14,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Overview" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTabsA",
          "current_parent": "bTabsG",
          "default_name": "BF: Active Tab"
        },
        {
          "properties": {
            "height": 36,
            "width": 136,
            "font_size": 14,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Analytics" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTabsB",
          "current_parent": "bTabsG",
          "default_name": "BF: Tab"
        },
        {
          "properties": {
            "height": 36,
            "width": 136,
            "font_size": 14,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Reports" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bTabsC",
          "current_parent": "bTabsG",
          "default_name": "BF: Tab"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-common-modal",
    category: "Modals",
    name: "Confirmation Modal",
    description: "A centered confirmation dialog with title, body copy, and two actions.",
    access: "Pro",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 260,
            "width": 440,
            "container_layout": "column",
            "bgcolor": "#ffffff",
            "border_roundness": 10,
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#e4e4e7",
            "boxshadow_style": "outset",
            "boxshadow_color": "rgba(0,0,0,0.16)",
            "boxshadow_blur_radius": 34,
            "boxshadow_vertical_offset": 18,
            "padding_top": 26,
            "padding_bottom": 26,
            "padding_left": 26,
            "padding_right": 26,
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bModG",
          "default_name": "BF: Confirmation Modal"
        },
        {
          "properties": {
            "height": 30,
            "width": 388,
            "font_size": 20,
            "font_bold": true,
            "font_color": "#18181b",
            "text": { "type": "TextExpression", "entries": { "0": "Delete component?" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bModT",
          "current_parent": "bModG",
          "default_name": "BF: Modal Title"
        },
        {
          "properties": {
            "height": 64,
            "width": 388,
            "font_size": 14,
            "font_color": "#71717a",
            "line_spacing": 1.55,
            "text": { "type": "TextExpression", "entries": { "0": "This action cannot be undone. The component will be removed from your library." } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bModD",
          "current_parent": "bModG",
          "default_name": "BF: Modal Description"
        },
        {
          "properties": {
            "height": 40,
            "width": 112,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "border_roundness": 6,
            "font_color": "#18181b",
            "font_size": 14,
            "font_bold": true,
            "text": { "type": "TextExpression", "entries": { "0": "Cancel" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bModC",
          "current_parent": "bModG",
          "default_name": "BF: Modal Cancel"
        },
        {
          "properties": {
            "height": 40,
            "width": 112,
            "bgcolor": "#dc2626",
            "border_roundness": 6,
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "text": { "type": "TextExpression", "entries": { "0": "Delete" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bModA",
          "current_parent": "bModG",
          "default_name": "BF: Modal Action"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-common-search-filter",
    category: "Forms",
    name: "Search And Filter Bar",
    description: "A common table toolbar with search field, filter button, and export action.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 56,
            "width": 720,
            "container_layout": "row",
            "bgcolor": "#ffffff",
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bFiltG",
          "default_name": "BF: Search Filter Bar"
        },
        {
          "properties": {
            "height": 40,
            "width": 360,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "border_roundness": 6,
            "font_size": 14,
            "font_color": "#71717a",
            "text": { "type": "TextExpression", "entries": { "0": "Search records..." } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bFiltS",
          "current_parent": "bFiltG",
          "default_name": "BF: Search Input Placeholder"
        },
        {
          "properties": {
            "height": 40,
            "width": 96,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "border_roundness": 6,
            "font_color": "#18181b",
            "font_size": 14,
            "font_bold": true,
            "text": { "type": "TextExpression", "entries": { "0": "Filter" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bFiltF",
          "current_parent": "bFiltG",
          "default_name": "BF: Filter Button"
        },
        {
          "properties": {
            "height": 40,
            "width": 96,
            "bgcolor": "#18181b",
            "border_roundness": 6,
            "font_color": "#ffffff",
            "font_size": 14,
            "font_bold": true,
            "text": { "type": "TextExpression", "entries": { "0": "Export" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bFiltE",
          "current_parent": "bFiltG",
          "default_name": "BF: Export Button"
        }
      ],
      "type": "copy"
    }
  },
  {
    id: "comp-common-pagination",
    category: "Base components",
    name: "Pagination",
    description: "A common pagination control for tables and repeating groups.",
    access: "Free",
    bubbleJson: {
      "elements": [
        {
          "properties": {
            "height": 42,
            "width": 360,
            "container_layout": "row",
            "bgcolor": "#ffffff",
            "collapse_when_hidden": true
          },
          "type": "Group",
          "id": "bPageG",
          "default_name": "BF: Pagination"
        },
        {
          "properties": {
            "height": 38,
            "width": 92,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "border_roundness": 6,
            "font_color": "#18181b",
            "font_size": 14,
            "text": { "type": "TextExpression", "entries": { "0": "Previous" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bPageP",
          "current_parent": "bPageG",
          "default_name": "BF: Previous Button"
        },
        {
          "properties": {
            "height": 38,
            "width": 120,
            "font_size": 14,
            "font_color": "#71717a",
            "horiz_alignment": "center",
            "text": { "type": "TextExpression", "entries": { "0": "Page 1 of 10" } },
            "collapse_when_hidden": true
          },
          "type": "Text",
          "id": "bPageT",
          "current_parent": "bPageG",
          "default_name": "BF: Page Count"
        },
        {
          "properties": {
            "height": 38,
            "width": 92,
            "bgcolor": "#ffffff",
            "border_style": "solid",
            "border_width": 1,
            "border_color": "#d4d4d8",
            "border_roundness": 6,
            "font_color": "#18181b",
            "font_size": 14,
            "text": { "type": "TextExpression", "entries": { "0": "Next" } },
            "collapse_when_hidden": true
          },
          "type": "Button",
          "id": "bPageN",
          "current_parent": "bPageG",
          "default_name": "BF: Next Button"
        }
      ],
      "type": "copy"
    }
  }
];
