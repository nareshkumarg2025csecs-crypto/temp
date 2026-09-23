---
name: Industrial Safety Guardian
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#5b4039'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#907067'
  outline-variant: '#e4beb4'
  surface-tint: '#b02f00'
  primary: '#b02f00'
  on-primary: '#ffffff'
  primary-container: '#ff5722'
  on-primary-container: '#541200'
  inverse-primary: '#ffb5a0'
  secondary: '#785900'
  on-secondary: '#ffffff'
  secondary-container: '#fdc003'
  on-secondary-container: '#6c5000'
  tertiary: '#006b5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#41a091'
  on-tertiary-container: '#00302a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a0'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#862200'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#fabd00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#97f3e2'
  tertiary-fixed-dim: '#7ad7c6'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#005047'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target-min: 3rem
  gutter-default: 1.5rem
  margin-edge: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

This design system is engineered for **Kholan**, an AR safety training platform. The brand personality is **protective, encouraging, and authoritative yet approachable**. Unlike cold, corporate SaaS platforms, this system feels like a reliable mentor or a piece of high-grade personal protective equipment (PPE).

The visual direction combines **Modern Industrial** with **Tactile** elements. It prioritizes instant recognition and high visibility, essential for industrial environments where focus is split between the digital overlay and physical hazards. The UI is designed to be "chunky" and robust, evoking the feel of industrial hardware rather than delicate software.

**Key Principles:**
- **Safety First:** High-contrast colors ensure legibility in various lighting conditions (glare, low light, outdoor).
- **Encouragement:** Warm tones and rounded corners soften the high-stakes nature of safety training, reducing user anxiety.
- **Visual over Verbiage:** Information is conveyed through thick iconography and spatial UI to minimize cognitive load during AR tasks.

## Colors

The palette is derived from global safety standards but tuned for digital clarity. 

- **Primary (Safety Orange):** Reserved for critical actions, alerts, and primary navigation hooks. It commands attention without inducing panic.
- **Secondary (Caution Yellow):** Used for warnings, progress tracking, and highlighting interactive zones in the AR environment.
- **Tertiary (Safe Green):** Used exclusively for "Task Complete," "Area Secure," and "Success" states to provide clear positive reinforcement.
- **Neutral (Deep Charcoal):** Used for typography and heavy outlines to maintain high contrast against the light background and real-world AR environments.
- **Background (Solar White/Gray):** A cool-toned light gray that prevents screen glare and provides a clean canvas for colorful safety overlays.

## Typography

The typography system prioritizes **impact and readability**. We use **Hanken Grotesk** for headlines to provide a modern, technical feel that remains friendly. **Inter** is utilized for body text and labels due to its exceptional legibility and neutral character.

**Usage Rules:**
- **Sizing:** Text should never drop below 14px. For AR-specific overlays, a minimum of 20px is recommended to ensure stability in the field of view.
- **Weight:** Use medium and bold weights more frequently than regular to combat visual noise from the physical environment.
- **Contrast:** Always use Deep Charcoal (#212121) on Light Backgrounds (#F5F5F5) for a minimum 7:1 contrast ratio.

## Layout & Spacing

This design system uses a **Fluid Stacked Layout** rather than a traditional grid. Since industrial workers may be wearing gloves or using AR gestures, the layout centers on large, accessible "Information Blocks."

- **Safe Zones:** A 32px (2rem) margin is maintained from all edges of the viewport to prevent UI clipping in AR glasses.
- **Rhythm:** An 8px base unit is used for all spacing. 
- **Tap Targets:** Every interactive element must be a minimum of 48px (3rem) in height or width.
- **Hierarchy:** Elements are stacked vertically in a single column for mobile/AR views to simplify the mental model. Tablet views may use a 2-column layout for dashboards.

## Elevation & Depth

To simulate physical objects in a 3D space, the design system utilizes **Tonal Layering and Soft Ambient Shadows**.

- **Surface Tiers:** Backgrounds are flat. Cards use a subtle inner glow or a 1px border (#E0E0E0) to separate themselves from the environment.
- **Depth:** Active alerts and AR tooltips use high-elevation shadows (20% opacity Charcoal with a 24px blur) to appear "closer" to the user than background status info.
- **Scrims:** When an alert is active, a 20% opacity charcoal overlay (scrim) is applied to the background to focus the user's attention on the safety instruction.

## Shapes

The shape language is **exaggerated and soft**. We use large corner radii (24px for cards) to make the industrial environment feel less hazardous and more instructional.

- **Standard Cards:** 24px (1.5rem) corner radius.
- **Buttons:** Fully rounded (pill-shaped) for primary actions to distinguish them from informational cards.
- **Icons:** Use a 2px - 3px stroke width with rounded caps and joins to match the soft UI language.

## Components

### Buttons
Primary buttons are pill-shaped, using Safety Orange (#FF5722) with white bold text. They should have a "pressed" state that shifts the color to a deeper burnt orange to provide tactile feedback.

### Safety Cards
Informational cards use a white background with a 4px left-accent border color-coded by status (Yellow for warning, Orange for danger, Green for safe). 

### Progress Rings
For training modules, use thick (8px+) progress rings. The stroke should be Safety Orange against a light gray track. Percentage text should be centered in Hanken Grotesk Bold.

### Input Fields
Inputs are large (56px height) with thick 2px charcoal borders. They must include a clear "X" button to clear input easily, catering to users who might have limited dexterity in the field.

### Thick Icons
Icons must be enclosed in a circular or square container with a background color. They function as visual anchors. Use 32px icons within 56px containers for maximum visibility.