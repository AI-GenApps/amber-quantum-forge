# Review b4 round 1 (customer expressions 5-8)

Technical (all 8): 1020x1360 RGBA, all four corners and 3 percent border alpha 0, alpha mask identical to the accepted neutral (no fringe or silhouette change), pixel differences vs neutral confined to eyes, brows, mouth, cheeks (see diff-all.png). Sheets: a-full-c*, a-face-c*, b-120x160-*, c-siblings, d-bg-c*, diff-all, mouths-happy.

| Asset | Verdict | Reasons |
|---|---|---|
| customer-5-happy | ACCEPT | Frown gone, moustache lifted, brows relaxed, cheeks and eye creases warm; reads as a smile at 120x160, clearly distinct from the frowning neutral. Identity, cap, vest intact. |
| customer-5-sad | ACCEPT | Inner brows raised, eyes lowered, moustache drooping; wounded, not angry. Identity intact. |
| customer-6-happy | REJECT | Neutral already has a faint smile; this is only marginally wider. Indistinguishable from neutral at 120x160 (rubric 8: happy reads neutral). Needs a clearly bigger smile with cheek lift and eye narrowing. |
| customer-6-sad | ACCEPT | Mouth down, inner brows lifted, eyes lowered, tired disappointment, no anger or tears. Stethoscope, bob intact. |
| customer-7-happy | REJECT | Same failure: barely wider than the neutral's gentle smile; reads neutral at display size. Needs a clearly wider smile and crinkled eyes. |
| customer-7-sad | ACCEPT | Wistful, dignified; inner brows up, eyes lowered, mouth flat to slightly down. Spectacles, chain, bow tie intact. Reads sad at thumbnail size (subtle but acceptable). |
| customer-8-happy | ACCEPT | Open grin, one soft light teeth shape, clearly happy at 120x160; pencil, bun, scarf, cardigan unchanged. Eye crinkle modest but the grin carries it. |
| customer-8-sad | ACCEPT | Lips pursed to one side, inner brows raised, eyes lowered; crushed-creative, not dramatic. |
