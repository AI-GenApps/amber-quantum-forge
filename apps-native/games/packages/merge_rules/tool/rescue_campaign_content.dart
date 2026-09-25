/// Chapter themes and board titles for the 60-board, 6-chapter Rescue
/// campaign (task 16-games-portfolio-wave2/06). Chapter names are neutral
/// placeholders until the art/brand pass; titles and subtitles are original
/// and short, one theme per chapter.
final class MergeRescueBoardSpec {
  const MergeRescueBoardSpec({
    required this.id,
    required this.title,
    required this.subtitle,
  });

  final String id;
  final String title;
  final String subtitle;
}

final class MergeRescueChapterSpec {
  const MergeRescueChapterSpec({required this.theme, required this.boards});

  final String theme;
  final List<MergeRescueBoardSpec> boards;
}

const rescueCampaignChapters = <MergeRescueChapterSpec>[
  MergeRescueChapterSpec(
    theme: 'Harbor',
    boards: [
      MergeRescueBoardSpec(
        id: 'rescue-harbor-01',
        title: 'First Light',
        subtitle: 'Ease into the harbor.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-02',
        title: 'Rope and Cleat',
        subtitle: 'Tie the first pair together.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-03',
        title: 'Low Tide',
        subtitle: 'Work the shrinking shoreline.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-04',
        title: 'Ferry Lane',
        subtitle: 'Keep the crossing clear.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-05',
        title: 'Salt Crate',
        subtitle: "Stack what the dock delivers.",
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-06',
        title: 'Buoy Line',
        subtitle: 'Follow the markers in.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-07',
        title: 'Harbor Watch',
        subtitle: 'Mind every open berth.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-08',
        title: 'Tugboat Turn',
        subtitle: "Muscle the heavy pair home.",
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-09',
        title: 'Breakwater',
        subtitle: 'Hold the line against the swell.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-harbor-10',
        title: "Anchor's Rest",
        subtitle: 'Bring the fleet in for the night.',
      ),
    ],
  ),
  MergeRescueChapterSpec(
    theme: 'Foundry',
    boards: [
      MergeRescueBoardSpec(
        id: 'rescue-foundry-01',
        title: 'Spark Catch',
        subtitle: 'Catch the first spark.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-02',
        title: 'Bellows',
        subtitle: 'Feed the fire two at a time.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-03',
        title: 'Ingot Row',
        subtitle: 'Line the ingots up true.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-04',
        title: 'Hammer Fall',
        subtitle: "Strike while the metal's hot.",
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-05',
        title: 'Quench',
        subtitle: 'Cool the pair before it cracks.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-06',
        title: 'Casting Floor',
        subtitle: 'Mind the molds underfoot.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-07',
        title: 'Forge Shift',
        subtitle: 'Keep the shift moving.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-08',
        title: 'Slag Heap',
        subtitle: 'Clear a path through the scrap.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-09',
        title: 'White Heat',
        subtitle: "Push the alloy to its limit.",
      ),
      MergeRescueBoardSpec(
        id: 'rescue-foundry-10',
        title: 'Foundry Bell',
        subtitle: 'Close the floor on your terms.',
      ),
    ],
  ),
  MergeRescueChapterSpec(
    theme: 'Orchard',
    boards: [
      MergeRescueBoardSpec(
        id: 'rescue-orchard-01',
        title: 'Bud Break',
        subtitle: 'Coax the first bud open.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-02',
        title: 'Bee Line',
        subtitle: 'Follow the shortest path.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-03',
        title: 'Graft',
        subtitle: 'Join two branches as one.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-04',
        title: 'Windfall',
        subtitle: 'Gather what the wind drops.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-05',
        title: 'Espalier',
        subtitle: 'Train the rows against the wall.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-06',
        title: 'Root Bound',
        subtitle: 'Work within tight quarters.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-07',
        title: 'Late Bloom',
        subtitle: 'Coax growth from a slow season.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-08',
        title: 'Orchard Ladder',
        subtitle: 'Climb toward the highest fruit.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-09',
        title: 'Hard Frost',
        subtitle: 'Save the harvest before the freeze.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-orchard-10',
        title: 'Harvest Moon',
        subtitle: 'Bring in the last of the crop.',
      ),
    ],
  ),
  MergeRescueChapterSpec(
    theme: 'Bazaar',
    boards: [
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-01',
        title: 'Open Stall',
        subtitle: 'Set out your first goods.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-02',
        title: "Haggler's Start",
        subtitle: 'Strike an easy bargain.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-03',
        title: 'Spice Row',
        subtitle: 'Sort the jars by scent.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-04',
        title: 'Copper Scale',
        subtitle: "Balance what you're offered.",
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-05',
        title: 'Silk Thread',
        subtitle: 'Follow the finest weave.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-06',
        title: 'Lantern Stall',
        subtitle: 'Trade by lamplight.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-07',
        title: 'Crowded Aisle',
        subtitle: 'Thread the packed stalls.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-08',
        title: 'Last Bid',
        subtitle: 'Close before the crowd moves on.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-09',
        title: 'Market Bell',
        subtitle: 'Beat the closing bell.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-bazaar-10',
        title: 'Sold Out',
        subtitle: 'Clear the stall before dusk.',
      ),
    ],
  ),
  MergeRescueChapterSpec(
    theme: 'Glacier',
    boards: [
      MergeRescueBoardSpec(
        id: 'rescue-glacier-01',
        title: 'First Crack',
        subtitle: 'Test the ice underfoot.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-02',
        title: 'Blue Vein',
        subtitle: 'Follow the seam through the ice.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-03',
        title: 'Cold Snap',
        subtitle: 'Move before the frost sets.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-04',
        title: 'Crevasse',
        subtitle: 'Mind the gap as you cross.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-05',
        title: 'Ice Bridge',
        subtitle: 'Trust a narrow crossing.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-06',
        title: 'Frozen Drift',
        subtitle: 'Push through the packed snow.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-07',
        title: 'Glacial Pace',
        subtitle: 'Patience pays here.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-08',
        title: 'Deep Freeze',
        subtitle: 'Work the coldest stretch yet.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-09',
        title: 'Calving Edge',
        subtitle: 'Move fast before it shifts.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-glacier-10',
        title: 'Summit Ice',
        subtitle: 'Reach the frozen peak.',
      ),
    ],
  ),
  MergeRescueChapterSpec(
    theme: 'Observatory',
    boards: [
      MergeRescueBoardSpec(
        id: 'rescue-observatory-01',
        title: 'First Star',
        subtitle: 'Spot the easiest pair in the sky.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-02',
        title: 'Night Watch',
        subtitle: 'Settle in for a long shift.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-03',
        title: 'Comet Trail',
        subtitle: 'Track a fast-moving pair.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-04',
        title: 'Dark Sky',
        subtitle: 'Work without much to go on.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-05',
        title: 'Star Chart',
        subtitle: 'Chart the safest path.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-06',
        title: 'Lunar Pass',
        subtitle: 'Time the crossing with the moon.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-07',
        title: 'Meteor Shower',
        subtitle: 'Keep up as they fall.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-08',
        title: 'Deep Field',
        subtitle: 'Search the faintest corners.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-09',
        title: 'Final Alignment',
        subtitle: 'Line up the last pieces.',
      ),
      MergeRescueBoardSpec(
        id: 'rescue-observatory-10',
        title: 'Observatory Dawn',
        subtitle: 'Close the campaign as the sky lightens.',
      ),
    ],
  ),
];
