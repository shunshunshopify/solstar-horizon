# Horizon Shopify Theme Development Guide

This guide explains key patterns and workflows for the Horizon Shopify theme.

## Architecture Overview

- Theme uses a component-based architecture with modular JavaScript and Liquid templates
- Core JavaScript components are defined in `assets/` with matching Liquid templates in `snippets/` and `sections/`
- Components extend the base `Component` class from `component.js`
- Modules use ES6 import/export with a defined importmap in `snippets/scripts.liquid`

## Key Components & Patterns

### Component Structure

- Components are web components using custom elements
- Follow naming pattern: JS class `ComponentNameComponent` -> HTML tag `component-name`
- Example: `assets/cart-note.js`:

```js
class CartNote extends Component {
  // Component logic
}
customElements.define("cart-note", CartNote);
```

### Theme Configuration

- Global theme settings defined in `Theme` object in `snippets/scripts.liquid`
- Translations, routes, and placeholders centrally managed
- Type definitions in `assets/global.d.ts`

### Layout & Styling

- Uses utility-first approach with composable classes
- Color schemes defined in `color-schemes` snippets
- Responsive layout handled through `section-wrapper` and `spacing-style` utilities

## Development Workflows

### Adding New Components

1. Create JS component in `assets/` extending `Component`
2. Create matching Liquid template in `snippets/` or `sections/`
3. Register in `importmap` if needed
4. Use custom element tag in templates

### Theme Settings

- Color schemes defined in `color_scheme` settings
- Page width controlled by `settings.page_width`
- Settings accessible via `section.settings` in templates

### Key Integration Points

- Cart operations through `Theme.routes.cart_*` endpoints
- Product forms use `product-form` component for variants and add-to-cart
- Search functionality via `predictive-search` component

## Performance Considerations

- Critical CSS and JS loaded with high priority
- Non-critical assets deferred appropriately
- Image loading optimized through Shopify CDN
- View transitions managed for smooth page loads

## Testing

- Components should work in both section and block contexts
- Test across mobile and desktop viewports
- Verify color scheme variations work correctly
