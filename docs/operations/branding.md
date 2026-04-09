# CaptionArc Branding Notes

## Brand Direction

CaptionArc should feel precise, calm, and operational rather than loud or playful.

Core idea:
- capture spoken content clearly
- translate it without noise
- keep follow-up material practical and structured

The visual system is built around:
- the existing mint accent from the product UI
- clean light surfaces with dark structural contrast
- a compact mark that combines:
  - a speaker node
  - caption rails
  - a translation spark

## Asset Inventory

Generated assets live in:
- [branding](../assets/images/branding)

Key files:
- [logo-mark.svg](../assets/images/branding/logo-mark.svg)
- [logo-lockup-light.svg](../assets/images/branding/logo-lockup-light.svg)
- [logo-lockup-dark.svg](../assets/images/branding/logo-lockup-dark.svg)
- [github-banner.png](../assets/images/branding/github-banner.png)
- [store-banner.png](../assets/images/branding/store-banner.png)
- [icon-256.png](../assets/images/branding/icon-256.png)
- [icon-512.png](../assets/images/branding/icon-512.png)

The Chrome extension icons in [public](../../public) are also regenerated from the same brand direction.

## Palette

- Accent: `#10A37F`
- Accent strong: `#0C8A6D`
- Mist: `#DFF5EE`
- Cream background: `#F7F7F2`
- Surface: `#FCFCF9`
- Text: `#161A17`
- Dark base: `#0F1210`

## Regeneration

Run:

```bash
python3 scripts/generate_brand_assets.py
```

This regenerates the public extension icons and the branding export set.
