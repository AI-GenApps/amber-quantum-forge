import { choice, ending, scene, voice, when } from "./build";

const t = voice(2);
const C1 = "r2-c1";
const C2 = "r2-c2";

export const TOBIAS_SCENES = [
  scene({
    regular: 2,
    index: 1,
    title: "Grease on the Page",
    beats: [
      t.note(
        "A tall young man in oily overalls sits at the counter, turning a book over in his hands.",
      ),
      t.say(
        "Oh no. That is my thumbprint on page one. I'm so sorry. It's engine grease, and it never washes off.",
        "sad",
      ),
      t.you("Don't worry. A used book should look used. What do you fix?"),
      t.say(
        "The Marigold. She's the old ferry that crosses the bay. Forty years old, and she sulks if I'm rude to her.",
        "happy",
      ),
      t.you("Does she sulk a lot?"),
      t.say(
        "Only on Mondays and when it rains. So, most days. But she always gets everyone across in the end.",
      ),
      t.note("He wipes his hands on a rag and grins. The grin is easy, and it reaches his eyes."),
      t.say(
        "Your latte is better than my engine room coffee, and that is a low bar. May I come back?",
        "happy",
      ),
      t.you("Come whenever you like. Bring the rag."),
    ],
  }),
  scene({
    regular: 2,
    index: 2,
    title: "The Cargo Line Letter",
    beats: [
      t.note("Tobias sits with a stiff white envelope on the counter. He has not touched his cup."),
      t.say(
        "The Northern Cargo Line wrote to me. They want a ship's engineer. Big ships. Far ports.",
        "sad",
      ),
      t.say("The job starts the day after Lantern Night. They need an answer soon."),
      t.say("It pays three times what the ferry does. I could finally fix my mother's roof."),
      t.you("And the Marigold?"),
      t.say("Nobody else knows her. Nobody else would get up at four to coax her awake."),
      t.say("So what do I do? Stay with an old boat, or go to the big sea?"),
      t.note("He looks at the window, where the ferry's lamp bobs at the end of the quay."),
      t.say("Whatever I choose, I'd like to hear your voice about it first.", "happy"),
    ],
    choice: choice(
      C1,
      "What do you tell Tobias?",
      9,
      {
        label: "The Marigold needs you here",
        reaction: [
          t.say(
            "She does. I know she does. Hearing it said out loud makes it easier to carry.",
            "happy",
          ),
          t.note("He lets out a long breath and finally drinks his tea."),
        ],
      },
      {
        label: "Big ships will not wait for you",
        reaction: [
          t.say(
            "No. They won't. A chance like this comes once, and a ferry can wait a season.",
            "happy",
          ),
          t.note("He nods and folds the letter very carefully, like a map."),
        ],
      },
    ),
  }),
  scene({
    regular: 2,
    index: 3,
    title: "A Spare Part",
    beats: [
      t.note(
        "Rain drums on the glass. Tobias arrives soaked, with a heavy brown paper parcel under his coat.",
      ),
      t.say(
        "The Marigold's pump is failing. The part is thirty years old, and nobody sells it any more.",
        "sad",
      ),
      t.you("Could you make one?"),
      t.say("I'd need a drawing. Which I don't have. The maker closed his shop before I was born."),
      t.note("You remember one of Marit's almanacs, with a sketch tucked inside the back cover."),
      t.you("Wait. Marit kept a book of repairs. Let me look."),
      t.note(
        "Between a recipe for tea and a tide chart, there it is. A pump part, drawn with careful arrows.",
      ),
      t.say("That's it! Every curve is right! She even wrote the sizes in the margin.", "happy"),
      t.say("Marit kept the whole harbour running and never said a word. I'll build it this week."),
    ],
  }),
  scene({
    regular: 2,
    index: 4,
    title: "Night Shift on the Quay",
    beats: [
      t.note(
        "Late that night a single light is still burning at the ferry berth. You walk down the quay, wondering what he needs.",
      ),
      t.say(
        "You're out late. The engine room is the warmest place in town, if you like the smell of oil.",
        "happy",
      ),
      t.you("What keeps you here at this hour?"),
      t.say("The part fits, but the pump still coughs. I want her sweet before the storm season."),
      t.say(
        "My mother crossed on this ferry every single day to work. She sat in the same seat for twenty years.",
      ),
      t.say(
        "That seat is why the Marigold matters. She isn't a boat to me. She's the town, crossing the bay.",
      ),
      t.say("If I go to the big ships, I want to know she is safe.", undefined, when(C1, "b")),
      t.say(
        "You said she needs me here. At night, with the torch in my teeth, I think you're right.",
        undefined,
        when(C1, "a"),
      ),
      t.say("Come by the shop tomorrow. I'll tell you how she sounds.", "happy"),
    ],
    choice: choice(
      C2,
      "What do you bring Tobias?",
      8,
      {
        label: "Soup, and a hand with the torch",
        reaction: [
          t.say(
            "Soup! And a second pair of hands! Hold the torch there, and I'll show you how the pump sings.",
            "happy",
          ),
          t.note("For an hour you hold the light while he works. Neither of you minds the cold."),
        ],
      },
      {
        label: "A kind letter of reference",
        reaction: [
          t.say(
            "A letter from you? Nobody has ever written one for me. I will keep it with my good tools.",
            "happy",
          ),
          t.note("He reads it by the engine lamp and has to clear his throat twice."),
        ],
      },
    ),
  }),
  scene({
    regular: 2,
    index: 5,
    title: "The Marigold",
    beats: [
      t.note(
        "Storm warning flags snap above the quay. The shop is warm, and Tobias is the only customer.",
      ),
      t.say("The pump runs smooth now. I tested her four times. She didn't sulk once.", "happy"),
      t.you("So you've decided."),
      t.say(
        "I told the Cargo Line my answer this morning. I wrote it three times before it looked right.",
      ),
      t.say(
        "I kept thinking about my mother's seat, and about you holding the torch.",
        undefined,
        when(C2, "a"),
      ),
      t.say(
        "I kept thinking about your letter, and how it said I was ready for either.",
        undefined,
        when(C2, "b"),
      ),
      t.say("Whatever the answer is, thank you. A friend makes a hard choice a little lighter."),
      t.you("Tell me, then. What did you write?"),
    ],
    endings: {
      a: ending("The Last Crossing", [
        t.note(
          "Tobias stays one more season. He trains Ned, the young deckhand, to read the engine's moods.",
        ),
        t.say(
          "The Marigold will carry the lantern crossing on Lantern Night. Come aboard. I saved you a seat.",
          "happy",
        ),
        t.note(
          "The ferry glides out, strung with paper lights. The whole town waves from the quay.",
        ),
        t.say("Next season, I'll think again. Tonight she's ours.", "happy"),
      ]),
      b: ending("Postcards on the Corkboard", [
        t.note(
          "Tobias takes the cargo job after he has trained Ned, the young deckhand, to run the Marigold.",
        ),
        t.say(
          "She is in good hands. Ned talks to the engine like a friend, which is exactly right.",
          "happy",
        ),
        t.note(
          "The first postcard arrives in a month. Then another. Soon the corkboard by the till is full of ports.",
        ),
        t.say("Wish you were here. The sea is huge and I miss your latte. Save my stool.", "happy"),
      ]),
    },
  }),
];
