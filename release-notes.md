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
