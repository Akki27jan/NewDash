# NewDash Frontend Design Document

This document outlines the architectural and aesthetic design of the `frontend_ui` for the NewDash application.

## 1. Architectural Overview

The frontend is built using **Next.js (App Router)** and **React**. It utilizes a modern component-based architecture with a strong separation of concerns.

### Directory Structure (`src/`)
- **`app/`**: Contains the core Next.js routing and layout files.
  - `layout.tsx`: Defines the global HTML structure, injects the `Geist_Mono` font, and applies the global dark theme background.
  - `page.tsx`: The landing page that composes the `Header`, `Hero`, `Features`, and `Footer` components.
  - `globals.css`: Contains standard Tailwind CSS imports.
- **`components/`**: Modular, reusable React components grouped by feature/domain.
  - **`home/`**: Components specific to the landing page.
    - `Hero.tsx`: The main ASCII art hero section.
    - `Features.tsx`: The module list styled as a CLI menu.
  - **`layout/`**: Global structural components.
    - `Header.tsx`: Top navigation bar containing the logo and authentication buttons.
    - `Footer.tsx`: Terminal-style footer.
  - **`ui/`**: Low-level, reusable UI primitives.
    - `Button.tsx`: A customizable button component with 'red' and 'blue' variants, styled with bracket notation (e.g., `[LOGIN]`).

## 2. Aesthetic & Design System

The application employs a strict **terminal-inspired, retro-hacker aesthetic**. It avoids standard modern UI tropes (like rounded cards, soft shadows, and clean sans-serif typography) in favor of sharp edges, monospace text, and CLI-like interfaces.

### 2.1 Typography
- **Primary Font**: `Geist_Mono` (Google Font). The entire application forces a monospace font (`font-mono`) to mimic a terminal emulator.

### 2.2 Color Palette
The color scheme is extremely minimal, relying on a pure black background and high-contrast terminal colors.
- **Background**: Pure Black (`bg-black`)
- **Primary Text**: White (`text-white`)
- **Accent 1 (Blue)**: Used for general UI elements, ASCII art, and borders. (`text-blue-400`, `text-blue-500`, `text-blue-800`, `border-blue-900`).
- **Accent 2 (Red)**: Used for highlights, user prompts, and primary action buttons. (`text-red-500`, `hover:bg-red-950`).
- **Selection**: Custom selection colors (`selection:bg-blue-900`, `selection:text-white` or `selection:bg-red-900`).

### 2.3 UI Elements & Styling (Tailwind CSS)
- **Borders**: Sharp, thin borders (`border-b border-blue-900`) instead of shadows to separate sections.
- **Buttons**: Rendered to look like clickable terminal commands, e.g., `[LOGIN]`. They utilize focus rings (`focus:ring-2`) for accessibility while maintaining the retro theme.
- **Lists**: The `Features` list is formatted like an indexed command-line output (e.g., `[01] DRIVE_LINKER ..... Linking college lecture classes drive folders`).
- **Visuals**: ASCII art is explicitly used in place of SVG/PNG logos (seen in `Hero.tsx`).

### 2.4 Feature-Specific Design Implementations

**Subjects & GPA_CALC Tabs**:
- **Layout**: Both tabs encapsulate sections within rigid blue borders (`border border-blue-900`) and pure black backgrounds (`bg-black`) to mimic distinct terminal windows or panes.
- **Headers**: Section headers are styled as command prompts (e.g., `<span className="text-red-500">root@newdash</span>:~/subjects# _` or `system:~/gpa_calc/predictor# ./run_prediction`) indicating the current active directory or script.
- **Data Tables**: Uses a `border-collapse` layout with thin blue bottom borders (`border-b border-blue-900/30`) for rows. Hovering over a row provides a subtle blue highlight (`hover:bg-blue-900/10`).
- **Indexing**: Row numbers or indices utilize zero-padded bracket formatting, e.g., `[01]`, `[02]`.
- **Forms and Inputs**: Input fields use transparent backgrounds (`bg-transparent`) with monospace placeholder text styled like CLI instructions (e.g., `[ Enter Subject Name ]`). Focus states highlight the borders with red (`focus:border-red-500 focus:ring-1 focus:ring-red-500`) to indicate active data entry.
- **Inline Actions**: Action buttons within tables are text-based and bracketed (e.g., `[EDIT]`, `[DEL]`, `[SAVE]`) with context-aware hover colors (red for destructive actions, green for saves, blue/yellow for editing).
- **Summary blocks**: Highlight final outputs or important metadata in distinct bounded boxes using background shading (`bg-blue-900/10`) and green monospace text for successful calculations or values.

## 3. Future Expansion Guidelines

When adding new features or components to the frontend, developers should adhere to the following rules to maintain design consistency:
1. **Never use non-monospace fonts.**
2. **Avoid border-radius (`rounded-*`).** Keep all edges sharp.
3. **Use the established `Button` component** for actions instead of creating new ad-hoc buttons.
4. **Maintain the CLI illusion:** Format data lists like standard output, use command prompts (`guest@newdash:~$`) for interactive elements, and end files/sections with standard terminal indicators (like `EOF`).
