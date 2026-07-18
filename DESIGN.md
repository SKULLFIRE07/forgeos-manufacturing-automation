# ForgeOS Design System

## Direction

ForgeOS is an industrial operating surface. It must feel precise, calm, and decisive under pressure. The interface uses white, black, and functional gray only. State is communicated through explicit words, icons, solid fills, double rules, dashed rules, and position. Color is never required to understand factory conditions.

The main visual signature is the accountability line: a thin connected path that shows where work is between assignment and verified closure.

## Type

Use the locally embedded ITC Avant Garde Gothic LT family. Medium carries the working interface so text remains clear on wide factory displays. Extra Light is reserved for the client document. Body text is 1rem with a 1.45 line height. Operational UI uses 0.875rem to 0.9375rem. Metadata never falls below 0.8125rem. Page headings use a compact 1.25rem to 1.375rem scale. Context labels use sentence case wherever possible. Numeric data uses tabular figures.

## Space and layout

Use a 4 point scale: 4, 8, 12, 16, 20, 24, 32, 48, and 64 pixels. Related controls stay tight. Page and panel gaps are usually 16 pixels. Separate operational regions with whitespace and one pixel rules. Desktop uses a compact persistent rail and two information regions. Tablet uses master and detail. Mobile uses one column and a fixed bottom navigation.

## Surfaces

The canvas and content surface are white. The desktop navigation rail uses a quiet gray only to separate navigation from work. Active navigation is black with white text. Sections use whitespace and one pixel horizontal rules instead of card containers. Controls use 3 pixel corners. Dialogs may use 6 pixel corners. Do not use gradients, glass, decorative shadows, tinted panels, rounded status pills, or nested cards.

## Components

- Desktop controls use a compact 36 pixel visual height. Shared tablets and coarse pointers use 44 pixel targets. Every control has a specific verb label and visible focus ring.
- Tables keep semantic headers on desktop and become labeled records on mobile.
- Status labels use a line icon, explicit text, and distinct solid, double-rule, dashed, or plain outline treatment.
- Drawers and dialogs use native semantics, Escape support, and focus management.
- Every form has persistent labels, inline help, blur validation, and actionable errors.
- Empty, loading, offline, error, and success states explain the next action.

## Motion

Motion only explains state. Press feedback takes 100 milliseconds. Popovers and drawers take 180 to 240 milliseconds with confident deceleration. Reduced motion removes nonessential transitions.

## Accessibility

Target WCAG 2.2 AA. Support keyboard navigation, skip links, 200 percent zoom, high contrast, screen readers, coarse pointers, and reduced motion. Core work capture must remain usable on an unreliable connection.
