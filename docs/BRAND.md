# Linde brand guide

Linde is the software identity for an immigration-focused law firm booking experience. The arch and path suggest a clear next step. The name and artwork make no claim of government affiliation, guaranteed outcomes, geographic exclusivity or verified business-name availability.

## Assets

`public/brand/favicon.svg` is the square symbol. `wordmark-dark.svg` and `wordmark-inverse.svg` are editable vector lockups, with transparent 320/640-pixel PNG exports. Square PNGs are supplied at 180, 192, 256 and 512 pixels; `favicon.ico` includes 16/32/48-pixel renditions. The 180-pixel version serves as the touch icon. Social images are supplied at 1200 × 630 in Spanish and English as SVG and PNG. `pathway.svg` is the responsive hero illustration; it stays vector at every size, so separate photographic crops are unnecessary. The 640-pixel wordmark can also serve as an email header asset when that separate backend template is built.

The in-app wordmark uses Cormorant Garamond; standalone vector export lettering uses Georgia for portable system-font rendering, while the PNG exports preserve the exported appearance. The shared React Logo owns all navigation/footer branding. Keep the symbol proportions intact and give the mark clear space at least equal to one third of its height. Use a minimum 28-pixel symbol in navigation and a minimum 120-pixel wordmark; favicon sizes are a deliberate exception. Use dark on light paper, inverse on deep green; do not place marks over busy images.

## Color and typography

- Deep green `#173e3b`: identity, primary actions and strong surfaces.
- Paper `#f8f7f2`: main background.
- Ink `#263e36`: body text.
- Muted sage, sand and terracotta: supporting surfaces and decorative accents, not the only indicator of status.
- DM Sans Variable: body text, labels and navigation.
- Cormorant Garamond: editorial headings and wordmark, with italic emphasis used sparingly.

Fonts are self-hosted. Latin Cormorant subsets support the Spanish/English interface without shipping unused script subsets. The original SIL Open Font License notices are in `public/brand/licenses` and must remain with redistributed fonts. The root MIT license and original copyright notice are retained. New vector artwork is authored for this project; it does not use stock lawyer photographs, fictional testimonials or invented credentials.

## Components and accessibility

Use the shared buttons, labeled native controls, status text, alert components, native dialog and navigation. Preserve visible keyboard focus, skip navigation, accessible control names and text explanations of errors. Disabled controls retain their label; a loading state must prevent duplicate submission without losing the user's values. Do not communicate payment or booking state using color alone. Maintain comfortable mobile tap targets and readable translated labels.

The hero illustration has no essential text; its short localized alt text describes the archway and path. The adjacent HTML communicates the message. Logo links have an accessible name. Real firm photographs and biographies can be added only after they are provided and approved. Policy and support content must come from the firm.

## Reproduce exports

Run `npm ci` and `npm run brand:export` with Google Chrome installed. The script rasterizes the checked-in vector masters and writes the PNG/ICO family. Inspect both language social cards and dark/inverse logo versions before publishing changes.
