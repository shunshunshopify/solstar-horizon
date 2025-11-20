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
