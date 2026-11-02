# Ayra cup artwork

The shared `Cup` component uses `frontend/public/images/ayra-orange-cup.png` in the three hero positions, the flavour banner, and product placeholders. Uploaded product photographs still take priority in the menu.

## Colour variants

The shared component selects the artwork by cup type: orange, watermelon pink-red (`ayra-melon-cup.png`), mango yellow (`ayra-mango-cup.png`), and lime green (`ayra-lime-cup.png`). All assets are in `frontend/public/images/`. The hero uses orange, pink-red, and yellow; the banner uses green.

The three variants were created using the built-in imagegen tool with transparency enabled and the orange cutout as the edit target. Final prompt template (one call for each colour):

> Use case: precise-object-edit. Edit target: the transparent Ayra cup image supplied. Create a {colour} juice variant. Change ONLY the liquid/cup body orange color and detached juice droplets to {colour}. Preserve exactly the existing cup silhouette, position, framing, straw red and white, lid, highlights, condensation, golden orange lion mascot, deep red branding text 'GOOD THINGS INSIDE' and 'Ayra Juice Shop'. Do not recolor the mascot or logo. Keep transparent background, same portrait aspect ratio and framing, entire cup and straw visible, no new objects. This is one asset in a matching website cup set; precise consistent framing and branding are essential.

Colour values: `watermelon pink-red`; `bright golden mango yellow, visibly yellow rather than orange`; `fresh lime green`.

Source supplied by the user: `ayra_orange_cup_layout2.png`.

Prepared with the built-in image generation tool in background-extraction edit mode, with transparency enabled. The existing cup positioning, floating animations, and responsive scaling are retained.

Final prompt:

> Use case: background-extraction. Edit target: supplied Ayra orange juice cup image. Remove only the cream background and floor shadow to produce a clean transparent PNG cutout for website placement. Preserve the exact orange cup, condensation, straw, lid, lion mascot artwork and red brand text 'GOOD THINGS INSIDE' and 'Ayra Juice Shop', with same perspective, colors and proportions. Keep detached orange droplets. Do not redesign, reword, recolor or add elements. Keep entire straw and cup in frame. Fit subject tightly with small transparent margins. Return actual transparent background.
