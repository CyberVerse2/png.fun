# PNG.FUN Design System

## Design Style: Neobrutalism

The app uses a **Neobrutalist** design aesthetic characterized by:

- Bold, thick borders (5px solid black)
- High contrast colors
- Flat design with strong shadows
- Uppercase, heavy typography
- Playful, energetic visual style

---

## Color Palette

### Light Mode (Primary)

#### Core Colors

- **Background**: `#ffffff` (Pure white)
- **Foreground**: `oklch(0.15 0 0)` (Near black)
- **Border**: `oklch(0.15 0 0)` (Black borders everywhere)

#### Primary Color (Electric Blue)

- **Primary**: `oklch(0.45 0.25 250)` (Vibrant electric blue)
- **Primary Foreground**: `#ffffff` (White text on blue)

#### Secondary Colors

- **Secondary**: `oklch(0.92 0.02 250)` (Very light blue-gray)
- **Secondary Foreground**: `oklch(0.15 0 0)` (Dark text)

#### Muted/Subtle

- **Muted**: `oklch(0.92 0.02 250)` (Light gray)
- **Muted Foreground**: `oklch(0.45 0 0)` (Medium gray)

#### Accent

- **Accent**: `oklch(0.92 0.02 250)` (Light blue-gray)
- **Accent Foreground**: `oklch(0.15 0 0)` (Dark text)

#### Status Colors

- **Destructive**: `oklch(0.577 0.245 27.325)` (Red)
- **Destructive Foreground**: `#ffffff` (White)

#### Chart Colors

- **Chart 1**: `oklch(0.45 0.25 250)` (Electric blue)
- **Chart 2**: `oklch(0.6 0.118 184.704)` (Teal)
- **Chart 3**: `oklch(0.398 0.07 227.392)` (Purple)
- **Chart 4**: `oklch(0.828 0.189 84.429)` (Yellow)
- **Chart 5**: `oklch(0.769 0.188 70.08)` (Orange)

---

## Typography

### Font Stack

- **Sans Serif**: "Geist", "Geist Fallback"
- **Monospace**: "Geist Mono", "Geist Mono Fallback"

### Font Weights & Styles

- **Regular headings**: `font-black` (900 weight)
- **Body text**: `font-bold` (700 weight)
- **Labels**: `font-black uppercase` (900 weight, all caps)
- **Small text**: `font-bold` (700 weight)

### Text Treatments

- Most headings are `UPPERCASE`
- Heavy tracking on some elements: `tracking-tight`, `tracking-wide`
- Consistent use of `lowercase` for usernames (@username)

---

## Spacing & Layout

### Border Radius

- **Default**: `0.75rem` (12px)
- Most elements use rounded corners with `rounded-lg`, `rounded-full`, etc.

### Borders (Neobrutalist Signature)

- **Standard border**: `border-[5px] border-foreground` (5px solid black)
- Used consistently across cards, buttons, inputs, and containers
- Creates the characteristic bold, graphic look

### Padding/Spacing

- **Container padding**: `px-6` (24px horizontal)
- **Vertical spacing**: `py-2` to `py-6` (8px to 24px)
- **Gaps**: Consistent use of `gap-2` to `gap-6` (8px to 24px)

---

## Component Patterns

### Neo Components (Custom)

#### NeoButton

```css
Classes: neo-border neo-shadow active:neo-pressed
- Heavy border (5px black)
- Bold shadow for depth
- Pressed state removes shadow (appears pushed in)
```

**Variants:**

- `primary`: Electric blue background, white text
- `secondary`: Light background, dark text
- Size: `lg` (large), standard

#### NeoCard

```css
classes: neo-border neo-shadow - White background - 5px black border - Drop shadow for depth -
  Rounded corners;
```

### Shadows (Neo Style)

#### neo-shadow

```css
box-shadow: 4px 4px 0px 0px black;
```

Creates offset shadow effect (bottom-right)

#### neo-shadow-sm

```css
box-shadow: 2px 2px 0px 0px black;
```

Smaller shadow for subtle depth

#### neo-pressed

```css
box-shadow: none
translate: 2px 2px
```

Removes shadow and shifts element (pressed effect)

---

## UI Elements

### Buttons

- **Style**: Rounded full (`rounded-full`) or rounded (`rounded-lg`)
- **Border**: 5px solid black
- **Text**: Uppercase, font-black
- **States**:
  - Active: `active:neo-pressed` (appears pushed)
  - Hover: Slight scale or color change

### Cards

- **Background**: White
- **Border**: 5px solid black
- **Shadow**: 4px offset shadow
- **Content**: Padded with `p-4` to `p-6`

### Avatars

- **Border**: `border-2` or `border-[5px]` black
- **Sizes**: Various (h-6 w-6 to h-24 w-24)
- **Fallback**: Colored background with initials

### Badges

- **Style**: Small, bold, uppercase
- **Border**: 1-2px black border
- **Colors**: Status-based (primary, success, muted)

### Bottom Navigation

- **Height**: `h-20` (80px)
- **Border**: Top border 5px black
- **Buttons**: Icon + label, uppercase text
- **Camera FAB**: Overflows top edge, larger circular button

### Top Bar

- **Height**: Auto (py-2)
- **Border**: Bottom border 5px black
- **Logo**: "PNG.FUN" in uppercase, font-black
- **Profile**: Rounded pill button with avatar

---

## Interactions & Animations

### Motion Library

Uses **Framer Motion** for animations

### Common Animations

```javascript
// Tap/Press
whileTap={{ scale: 0.98 }}

// Hover
whileHover={{ scale: 1.05 }}

// Enter/Exit
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
```

### Transitions

- **Type**: Spring animations (`type: "spring"`)
- **Stiffness**: 300-500
- **Damping**: 25-30
- **Duration**: 0.2s to 0.3s for fades

---

## Layout Patterns

### Full Screen Views

```
- Top bar (fixed)
- Content area (flex-1, overflow-y-auto)
- Bottom nav (fixed)
```

### Cards/Stack

- Absolute positioning for stack effect
- Z-index layering
- Transform for rotation and offset

### Responsive

- Mobile-first design
- Fixed width constraints with `max-w-*`
- Centered content with `mx-auto`

---

## Special Effects

### Vote Stack

- Card stack with absolute positioning
- Drag interactions (swipe left/right)
- Rotation on drag
- Opacity indicators for vote direction

### Photo Cards

- Aspect ratio containers
- Overlay badges for WLD/wins
- User avatars with gradient borders
- Status badges positioned absolutely

### Progress Indicators

- Animated dots
- Scale and color transitions
- Spring animations

---

## Iconography

**Library**: Lucide React

**Common Icons:**

- `Camera`: Photo/submission actions
- `ThumbsUp`: Voting
- `Trophy`: Leaderboard/wins
- `Users`: Community/social
- `Zap`: Energy/activity
- `Flame`: Streaks/hot

**Style:**

- `strokeWidth={3}` (bold, matches neobrutalist aesthetic)
- Sizes: `h-5 w-5` to `h-10 w-10`

---

## CSS Utilities (Custom)

### Neo Classes

```css
.neo-border {
  border: 5px solid oklch(0.15 0 0);
}

.neo-shadow {
  box-shadow: 4px 4px 0px 0px oklch(0.15 0 0);
}

.neo-shadow-sm {
  box-shadow: 2px 2px 0px 0px oklch(0.15 0 0);
}

.neo-pressed {
  box-shadow: none;
  translate: 2px 2px;
}
```

---

## Best Practices

### Do's ✓

- Use 5px black borders consistently
- Apply neo-shadow to cards and buttons
- Use uppercase for labels and headings
- Keep text bold (font-bold or font-black)
- Use rounded corners (rounded-lg, rounded-full)
- Apply active:neo-pressed to interactive elements

### Don'ts ✗

- Avoid thin borders
- Don't use subtle shadows (always bold)
- Avoid light font weights
- Don't use gradients (flat colors only)
- Avoid complex animations (keep it snappy)

---

## Accessibility

### Contrast

- High contrast maintained throughout
- Black borders provide clear boundaries
- Bold typography improves readability

### Touch Targets

- Minimum 44x44px tap areas
- Generous padding on interactive elements
- Clear visual feedback on press

### States

- Clear hover states
- Distinct active/pressed states
- Disabled states with reduced opacity

---

## File Reference

- **Global Styles**: `app/globals.css`
- **Components**: `components/neo-button.tsx`, `components/neo-card.tsx`
- **Theme Provider**: `components/theme-provider.tsx`
- **Design Tokens**: CSS variables in `:root`

---

## Summary

**PNG.FUN uses Neobrutalism** - a bold, playful, high-contrast design style with:

- Electric blue as the primary color
- 5px black borders everywhere
- Heavy typography (font-black, uppercase)
- Flat design with strong offset shadows
- Energetic, immediate visual feedback
- Mobile-first, touch-optimized layout
