# Design System Document: Gilded Dark Fantasy

## 1. Overview & Creative North Star: "The Relic Archive"
This design system moves away from the generic "flat" interface of modern apps, embracing instead the weight and intentionality of a **Premium Retro RPG**. The Creative North Star is **"The Relic Archive"**—an experience that feels less like a software tool and more like an ancient, enchanted manuscript illuminated by candlelight.

To achieve this, we reject standard layout patterns. We utilize **intentional asymmetry**, where content isn't always perfectly centered but weighted to feel like a hand-laid book. We break the "template" look through overlapping metallic elements, high-contrast serif typography, and a "Gilded Dark" atmosphere where depth is felt through tonal shifts rather than artificial drop shadows.

---

## 2. Colors: The Metallic Palette
The palette is rooted in the depth of `surface` (#131313), punctuated by the prestige of gold and the steady elegance of silver.

### Primary, Secondary, & Tertiary Roles
- **Primary (The Gilded Action):** `primary` (#f2ca50) and `primary_container` (#d4af37). Reserved exclusively for "Legendary" actions—the main quest, the primary CTA, or rare inventory items.
- **Secondary (The Silver Detail):** `secondary` (#c6c6c6). Used for secondary navigation, supportive iconography, and "common" tier information.
- **Tertiary (The Alchemical Accent):** `tertiary` (#f2cc00). Used for highlights and warnings that require more "heat" than the standard gold.

### The "No-Line" Rule
Traditional 1px solid borders are prohibited for sectioning. Structural boundaries must be defined solely through background shifts. For example, a `surface_container_low` section sitting against a `surface` background creates a sophisticated, "etched" look without the clutter of lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface tiers to create "nested" depth:
- **Base Layer:** `surface` (#131313).
- **Secondary Modules:** `surface_container` (#20201f).
- **Floating/Active Cards:** `surface_container_highest` (#353535).

### Signature Textures
Avoid flat fills on large CTAs. Use a subtle linear gradient from `primary_container` (#d4af37) to `primary` (#f2ca50) at a 45-degree angle to simulate the shimmer of real gold leaf.

---

## 3. Typography: The Editorial Voice
The typography is built on the high-contrast elegance of **Newsreader**. It is designed to feel authoritative and narrative.

- **Display & Headlines:** Use `display-lg` through `headline-sm`. These should feel like chapter headings in a dark fantasy novel. Use `on_surface` (#e5e2e1) for maximum readability.
- **Titles:** `title-lg` through `title-sm` act as the connective tissue. They guide the eye through the "Archive."
- **Body:** `body-lg` to `body-sm`. These are the "narrative" blocks. Newsreader’s serif construction ensures long-form lore is legible against the dark background.
- **Labels:** We break the serif theme here using **Inter** (`label-md`, `label-sm`). This provides a "mechanical/UI" contrast to the "narrative" serif text, used for metadata, stats, and micro-copy.

---

## 4. Elevation & Depth: Tonal Layering
In this system, light doesn't come from a "global sun," but from the glow of the gold elements themselves.

- **The Layering Principle:** Depth is achieved by stacking. Place a `surface_container_lowest` (#0e0e0e) card on top of a `surface_container_low` (#1c1b1b) area to create an "inset" or "carved" effect.
- **Ambient Shadows:** Shadows must be extremely diffused. Use a blur radius of 24px-40px with an opacity of 6% using the `on_background` color. This creates a "glow" rather than a "drop."
- **The "Ghost Border" Fallback:** If a container requires a border for accessibility, use `outline_variant` (#4d4635) at **15% opacity**. This creates a "whisper" of a boundary that feels like an aged paper edge.
- **Glassmorphism:** For floating menus (e.g., Modals or Tooltips), use `surface_variant` (#353535) with a 60% opacity and a `backdrop-blur` of 12px. This ensures the "Obsidian" base bleeds through the gold/silver UI.

---

## 5. Components: The Artifacts
Every component should feel like a physical object. Note: All `borderRadius` values are set to **0px** to maintain a sharp, brutalist, and "Retro RPG" architectural feel.

- **Buttons:**
    - **Primary (Gilded):** Fill: `primary_container`. Text: `on_primary_container`. No border. On hover, transition to a gold-to-silver gradient.
    - **Secondary (Silver):** Fill: Transparent. Border: `outline_variant` at 20%. Text: `secondary`.
- **Cards & Lists:** Prohibit divider lines. Use `spacing-4` (1.4rem) to separate content blocks. Use a `surface_container_high` background to highlight a selected list item.
- **Input Fields:** Use `surface_container_lowest` for the field background to create an "etched into stone" look. The cursor and active underline should be `primary` (Gold).
- **Chips:** Small, rectangular boxes (0px radius). Use `secondary_container` for the background and `on_secondary_container` for the text.
- **Interactive Icons:** All icons should be rendered in `secondary` (Silver). Upon interaction or "Rare" status, they transition to `primary` (Gold).

### Suggested Custom Component: "The Narrative Divider"
Instead of a line, use a small 4px x 4px diamond shape (using the `primary` gold token) centered between sections with `spacing-10` padding on either side.

---

## 6. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** Align text to the left but place gold accents or "Rare" icons on the far right to create visual tension.
- **Use Large Type Scales:** Don't be afraid of `display-lg` for impactful lore or section headers.
- **Layer for Depth:** Use the `surface-container` tokens to build a hierarchy of information.

### Don't:
- **Don't use Rounded Corners:** Every element must have a 0px radius. Roundness breaks the "Brutalist Fantasy" aesthetic.
- **Don't use Pure White:** Always use `on_surface` (#e5e2e1) for text to prevent harsh eye strain against the obsidian background.
- **Don't use Standard Dividers:** Never use a solid 100% opaque line to separate content. Let white space and background shifts do the work.