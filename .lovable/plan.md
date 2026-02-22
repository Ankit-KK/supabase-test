

# Add External Website Links (hyperchat.space & hyperchat.site)

## Overview
Add links to the two external websites in both the Navbar and Footer for visibility and cross-navigation.

## Changes

### 1. Navbar (`src/components/Navbar.tsx`)
Add two external links in the desktop navigation area (alongside "For Creators", "Features", "Contact"):
- **hyperchat.space** - links to `https://hyperchat.space`
- **hyperchat.site** - links to `https://hyperchat.site`

Both will open in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).

### 2. Footer (`src/components/Footer.tsx`)
Add a new "Our Websites" section (or add to the existing "Company" column) with links to both external sites. Also clean up the excessive whitespace in the footer bottom text (lines 54-253).

### 3. No Other Changes
- No database changes
- No edge function changes
- No donation page changes

## Technical Details
- Use standard `<a>` tags (not React Router `<Link>`) since these are external URLs
- Add `target="_blank"` and `rel="noopener noreferrer"` for security
- Follow existing styling: `text-sm hover:text-hyperchat-purple transition-colors`
- Add an `ExternalLink` icon from lucide-react next to each link for clarity
