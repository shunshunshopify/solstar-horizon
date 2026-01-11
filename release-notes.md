# Release Notes - Version 3.2.15

This release fixes theme validation errors and cleans up onboarding placeholders.

## What's Changed

### Fixes and improvements
- Removed unsupported `hide_padding` from swatches block presets to resolve schema validation failures.
- Added the missing onboarding translation used by Tab Collection empty states.
- [Tab collection] Fixed placeholder card rendering and carousel slide calculations.
- [Tab collection] Removed the circle option from image ratio settings.

# Release Notes - Version 3.2.14

This release refines swatch visuals and removes unused hover code.

## What's Changed

### Fixes and improvements
- Swatch borders now follow the swatch color unless a variant image is used, avoiding black outlines on color chips.
- Standardized swatch sizing (35.2px on PDP, smaller on collection cards) and spacing between swatch inputs without enlarging selected states.
- Removed hover preview wiring/code now that swatch hover previews are disabled.
- [Product recommendations] Recommendation cards now include color swatches by default.

# Release Notes - Version 3.2.13

This release adds product swatches and quick add to tab collection cards and aligns featured collection card swatches with collection pages.

## What's Changed

### Added
- [Featured collection] Color swatches now appear after price on grid and carousel cards.
- [Tab collection] Color swatches now appear after price on product cards.
- [Tab collection] Quick add to cart is now available on product cards.

### Fixes and improvements
- [Tab collection] Removed unused settings and dead references to keep the section lean.

# Release Notes - Version 3.2.12

This release improves filters with currency-aware price parsing and reduces duplicate markup.

## What's Changed

### Fixes and improvements
- [Filters] Price range input now normalizes values based on store currency for accurate filtering and summaries.
- [Filters] Toggle markup and styles consolidated in the `filters-toggle` snippet to remove duplication.
- [Filters] Removed unused filter IDs/data attributes to reduce DOM clutter.

# Release Notes - Version 3.2.11

This release adds an optional link hover animation for the header menu.

## What's Changed

### Added
- [Header menu] Optional link hover animation toggle with underline sweep and hover color highlight.

# Release Notes - Version 3.2.10

This release limits the Wishlist section to the wishlist page template.

## What's Changed

### Fixes and improvements
- [Wishlist] Section now renders only on the wishlist page template.

# Release Notes - Version 3.2.9

This release introduces the Before/After compare section with refined slider styling, range-based aspect ratio and corner radius controls, and completes localization keys (including Japanese).

## What's Changed

### Added
- [Before/After] New compare section with draggable slider, Remixicon handle, and configurable aspect ratio (0.5–1.5) and corner radius.
- [Localization] Translation keys added for all Before/After settings, options, blocks, and presets (en/ja).

# Release Notes - Version 3.2.8

This release adds a Countdown Timer section and localizes its unit labels using translation keys.

## What's Changed

### Added
- [Countdown timer] New section to showcase a timed message with configurable end date, labels, and styling.

# Release Notes - Version 3.2.7

This release aligns Tab Collection carousel cards with the grid on mobile and simplifies aspect ratio control.

## What's Changed

### Fixes and improvements
- [Tab collection] Mobile carousel cards now use the same width math as the grid, removing the oversized single-card view.
- [Tab collection] Carousel featured cards stretch to full height like grid cards for consistent media coverage.
- [Tab collection] Section-level aspect ratio setting removed; block-level aspect ratio remains the single source of truth.
- [Tab collection] Section layout label clarified and width handling aligned with carousel layout.
- [Featured collection] Carousel now respects the Page width option instead of forcing full width.

### Added
- [Tab collection] Heading and tab title alignment control (Left/Center) at the section level.

# Release Notes - Version 3.2.6

This release introduces a new Tab Collection section with richer controls and improves tab navigation behavior.

## What's Changed

### Added
- [Tab collection] New tabbed collections section with per-tab collection selection
- [Tab collection] Optional featured image card with image override, alignment, aspect ratio, and CTA button controls
- [Tab collection] Product title and price styling controls per tab

### Fixes and improvements
- [Tabs] Prevent viewport jump when switching tabs
- [Tab collection] Product card badges and wishlist icon rendering in tab cards

# Release Notes - Version 3.2.5

This release improves sale price visibility by highlighting the current price when a compare-at price is set.

## What's Changed

### Fixes and improvements
- [Pricing] When Compare-at price is present, the current price is now shown in red

# Release Notes - Version 3.2.4

This release improves Hero Video flexibility, syncs Newsletter Popup timing with Video Intro, and completes Video Intro translations and cleanup.

## What's Changed

### Added
- [Hero video] Desktop + Mobile video sources (Uploaded or External URL) with automatic mobile fallback to desktop video

### Fixes and improvements
- [Newsletter popup] Delay countdown starts after Video Intro completes (when enabled)
- [Video intro] Completed translation keys for new settings (including Japanese) and removed redundant event listeners
- [Hero video] Device-aware playback (only the active device video plays) and removed unexpected uploaded-video overlay text
- [Hero video] Settings reorganized into Typography / Button / Video and labels translated via keys (including Japanese)

# Release Notes - Version 3.2.3

This release improves the Video Intro experience with better source management, a configurable start button, and corrected playback behavior across devices.

## What's Changed

### Added
- [Video intro] Video Source selection for desktop and mobile (Uploaded via Shopify Files or External URL)
- [Video intro] Configurable start button (label, style, color scheme, corner radius) with fade-out animation

### Fixes and improvements
- [Video intro] Clicking the start button now reliably starts playback
- [Video intro] Uploaded videos now prefer HLS when available, with highest-quality MP4 fallback
- [Video intro] Desktop/mobile playback now targets the correct device video only
- [Video intro] Videos preserve their native aspect ratio (no stretching)
- [Theme settings] Renamed Video intro settings label from “Interface” to “Typography”

# Release Notes - Version 3.2.2

This release adds configurable badge labels, per-badge corner radius, a Bestseller badge, and a sale discount toggle/format option. Badges now adopt primary button colors.

## What's Changed

### Added
- [Badges] Custom labels for Sale, Sold out, New, and Bestseller badges with per-badge corner radius controls
- [Badges] New Bestseller badge driven by the `bestseller` product tag
- [Badges] Optional sale discount value display (percent or amount) appended as “OFF”

### Changed
- [Badges] Badge styling now uses primary button colors for text, background, and border

# Release Notes - Version 3.2.1

This release fixes the cart drawer layout regression where product page styles added borders and centering to cart items when opened from the product page.

## What's Changed

### Fixes and improvements
- [Cart drawer] Reset table cell styles so borders and centered alignment from product pages no longer bleed into the drawer

# Release Notes - Version 3.2.0

This release adds a circle aspect ratio option for collection cards and fixes collection list schema defaults.

## What's Changed

### Added
- [Collection cards] Circle aspect ratio option to render images as true circles

### Fixes and improvements
- [Collection list] Schema defaults corrected (grid default restored, carousel preset available) to avoid validation errors

# Release Notes - Version 3.1.9

This release introduces a newly built Map section with improved layout, height controls, and CTA behavior.

## What's Changed

### Added
- [Map] Brand new Map section built from scratch with consistent spacing and height options across desktop and mobile
- [Map] Centered CTA buttons and directions link opens in a new tab

# Release Notes - Version 3.1.8

This release moves the product page breadcrumb to the footer area and standardizes its typography across devices.

## What's Changed

### Changed
- [Product detail] Breadcrumb now appears above the footer instead of below the header
- [Breadcrumbs] Font size unified to 12.8px on desktop and mobile

# Release Notes - Version 3.1.7

This release refines variant picker UX by separating the option name/value from the buttons, fixing label weight, and ensuring consistent layout spacing.

## What's Changed

### Changed
- [Variant picker] Inline name/value block on the left with buttons aligned beside it
- [Variant picker] Bold labels for button and dropdown styles to improve readability

# Release Notes - Version 3.1.6

This release aligns the product detail variant picker with the Broadcast styling and harmonizes typography in the sticky add-to-cart bar.

## What's Changed

### Changed
- [Product detail] Applied new style variant picker visuals (buttons/swatch states, spacing, legends)
- [Sticky add to cart] Matched variant name/value typography to the product page specs across mobile and desktop

# Release Notes - Version 3.1.5

This release adds an independent “Read more” toggle for the product description tab and widens the fade overlay for description content.

## What's Changed

### Added
- [Product tabs] Optional “Read more” toggle for the product description tab with its own collapsed height and customizable labels
- [Localization] New tab toggle settings translated in English and Japanese

### Changed
- [Product description] Fade-out overlay made taller for the collapsed state

# Release Notes - Version 3.1.4

This release adds configurable repeat counts to the scrolling text section and updates defaults/translations.

## What's Changed

### Added
- [Scrolling text] Repeat count selector (6/12/18/24 or no repeat) with default text block (New Arrival, H5)

### Changed
- [Scrolling text] Default copy rendered via text block rather than fixed text size

### Fixes and improvements
- [Scrolling text] Fallback translation hooked to locale and repeat help text clarified

# Release Notes - Version 3.1.3

This release upgrades hero video text editing and addresses related validation and sizing issues.

## What's Changed

### Added
- [Hero video] Heading and subheading now use rich text (with heading presets, bold/italic, etc.)

### Changed
- [Hero video] Text settings simplified to match the text block experience

### Fixes and improvements
- [Hero video] Auto-wrap plain text in paragraphs to avoid validation errors and ensure size controls apply to nested tags
- [Hero video] Nested heading/subheading elements inherit the section font-size controls

# Release Notes - Version 3.1.2

This release aligns page content layout controls with blog posts and adds missing translations for the new width options.

## What's Changed

### Added
- [Pages] Width selector on the page content block (Standard / Wide 1200px)
- [Pages] Section width control (page / full) so content width choices take effect
- [Localization] Standard/Wide option labels translated (including Japanese)

### Changed
- [Blog posts] Width option labels clarified to match the new Standard/Wide naming

### Fixes and improvements
- [Pages] Removed hardcoded page-width constraint so block width settings apply

# Release Notes - Version 3.1.0

This release introduces wishlist support, a sticky add-to-cart bar, a new bottom menu, and a video intro experience, plus an expanded mega menu structure.

## What's Changed

### Added
- [Wishlist] New wishlist feature
- [Product detail] Sticky add to cart option
- [Navigation] Bottom menu feature
- [Media] Video intro component to highlight brand/story content on landing pages

### Fixes and improvements
- [Navigation] Mega menu updated to support three levels

# Release Notes - Version 3.0.1

This release focuses on accessibility improvements across the theme, adds infinite scroll for product grids, and fixes several bugs related to product selection and display.

## What's Changed

### Added

- [Product grid] Added optional infinite scroll

### Changed

- [Password page] Made footer a section of its own

### Fixes and improvements

- [Gift card] Fixed gift card recipient form character count color inheritance
- [Quantity rules] Fixed bug with how numbers were being compared
- [Product cards] Fixed missing image preview on swatch mouseover
- [Variant picker] Improved variant picker motion
- [Product] Fixed variant selection when using More payment options without add-to-cart button
- [Quick add] Fixed Quick Add modal showing up when product info is missing
- [Hero] Fixed logic for blurred reflection slider and toggle
- [Collection link] Fixed text wrapping on mobile
- [Header drawer] Fixed expand first group settings
- [Blog] Fixed blog post template app blocks
- [Accessibility] Enhanced mobile account drawer accessibility
- [Accessibility] Improved cart launcher accessibility
- [Accessibility] Improved accessibility for popovers
- [Accessibility] Added explicit "Close" button to search dialog
- [Accessibility] Improved "Search" button accessibility
- [Accessibility] Improved localization component accessibility
- [Accessibility] Improved contrast for the predictive search "Clear" button
- [Accessibility] Added h1 tags to page templates for SEO and accessibility
- [Accessibility] Enhanced dialog accessibility with ARIA labeling
- [Performance] Improved performance when opening / closing dialogs
