---
name: Vitality & Social Connection
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#5b3f45'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#8f6f74'
  outline-variant: '#e4bdc3'
  surface-tint: '#bc0052'
  primary: '#ae004b'
  on-primary: '#ffffff'
  primary-container: '#db0061'
  on-primary-container: '#fff0f1'
  inverse-primary: '#ffb1c0'
  secondary: '#006d37'
  on-secondary: '#ffffff'
  secondary-container: '#8ef9ab'
  on-secondary-container: '#00743b'
  tertiary: '#64525a'
  on-tertiary: '#ffffff'
  tertiary-container: '#7d6a73'
  on-tertiary-container: '#fff0f5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9df'
  primary-fixed-dim: '#ffb1c0'
  on-primary-fixed: '#3f0017'
  on-primary-fixed-variant: '#90003d'
  secondary-fixed: '#8ef9ab'
  secondary-fixed-dim: '#72dc91'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#f5dce6'
  tertiary-fixed-dim: '#d8c0ca'
  on-tertiary-fixed: '#25181f'
  on-tertiary-fixed-variant: '#53424a'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
  surface-blue: '#F6F8FF'
  pure-white: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is built to evoke a sense of community, optimism, and social well-being. It targets a diverse demographic, ranging from young families to corporate partners, necessitating a UI that is both highly accessible and energetically vibrant.

The chosen design style is **Corporate Modern with a Playful Edge**. It balances the reliability of institutional services with high-energy accents. The interface relies on generous whitespace (Minimalism) to provide clarity, but utilizes high-contrast color blocks and soft, tactile components to maintain a friendly, approachable atmosphere. The focus is on clarity, warmth, and an inviting information hierarchy.

## Colors

The palette is anchored by a high-energy **Magenta** (Primary), used for calls to action and critical brand moments. A vibrant **Green** (Secondary) is introduced to represent growth and health, providing a harmonious balance to the magenta.

- **Primary (#DB0061):** Actionable items, primary buttons, and brand highlights.
- **Secondary (#008444):** Success states, health-related features, and secondary branding elements.
- **Tertiary (#FCE3ED):** Soft background tints for containers to highlight content without competing for attention.
- **Neutral (#303030):** High-readability text and structural lines.
- **Surface (#F6F8FF):** A cool-toned background alternative to white to reduce eye strain and define content sections.

## Typography

This design system uses **Plus Jakarta Sans** for headlines to inject a modern, friendly, and geometric personality. **Source Sans 3** is utilized for body text and labels to ensure maximum legibility across dense information layouts.

Headlines should use tight letter spacing and bold weights to command attention. Body copy remains airy with a comfortable line height. For mobile, headline sizes are scaled down to prevent awkward line breaks while maintaining their weight and impact.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a 12-column structure for desktop and a 4-column structure for mobile. 

- **Vertical Rhythm:** Elements are spaced using an 8px base unit. 
- **Margins:** Desktop views use wide 64px margins to create a premium, uncrowded feel. Mobile views use 16px to maximize screen real estate.
- **Gutters:** A consistent 24px gutter is maintained between grid items to ensure distinct separation of content cards and modules.
- **Content Flow:** Group related items with `stack-sm`, and separate distinct sections with `stack-lg`.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layers** rather than heavy shadows. 

- **Level 0 (Floor):** Pure White (#FFFFFF) or Surface Blue (#F6F8FF).
- **Level 1 (Cards):** Pure White background with a subtle, low-contrast neutral outline (1px, 10% opacity of Neutral).
- **Interactive States:** On hover, elements should use a soft, ambient shadow (10% opacity of the Primary color) to indicate lift without breaking the clean, flat aesthetic.
- **Overlays:** Use a 40% opacity Neutral backdrop for modals to keep the focus strictly on the active task.

## Shapes

The shape language is defined by **Rounded** corners, emphasizing a soft, safe, and friendly environment. 

- Standard components (Buttons, Inputs) use a 0.5rem (8px) radius.
- Large containers and cards use a 1rem (16px) radius.
- Decorative elements or specific "pill" tags may use the `rounded-full` utility to create contrast against the more structured rectangular forms.

## Components

- **Buttons:** Primary buttons are Magenta (#DB0061) with white text. Secondary buttons use a Magenta outline. All buttons must have rounded corners (8px) and a height of 48px for touch accessibility.
- **Cards:** Cards are the primary information vehicle. They feature 16px padding, a 16px corner radius, and use the Surface Blue background or a thin border to distinguish themselves from the page floor.
- **Input Fields:** Use a subtle gray background with a 2px Magenta bottom-border on focus to create a modern, "underline-plus" feel while maintaining the container's structure.
- **Chips:** Small, pill-shaped tags used for categories. Use the Tertiary Magenta (#FCE3ED) as a background with Primary Magenta text for high legibility.
- **Progress Indicators:** Use the Secondary Green (#008444) for completion states and progress bars to provide a positive emotional cue.
- **Lists:** Clean, borderless lists with 16px vertical padding between items, separated by a thin 1px hairline divider.