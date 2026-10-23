import { choice, ending, scene, voice, when } from "./build";

const h = voice(5);
const C1 = "r5-c1";

export const HENRIK_SCENES = [
  scene({
    regular: 5,
    index: 1,
    title: "The Smell of Mornings",
    beats: [
      h.note("Evening. A broad man in a yellow oilskin vest sits down hard, and the stool creaks."),
      h.say(
        "Your window is too big. Your stools are too small. Your music is too soft. Black coffee, please.",
        "sad",
      ),
      h.you("Anything else I should fix?"),
      h.say("No. Well. The lamp is too bright. Don't touch it. Marit would have haunted you."),
      h.note("He smells of salt, smoked fish and fresh bread, the smell of a market at dawn."),
      h.say(
        "Henrik. I sell fish and my mother's ginger loaf at the quay market. Come at six, if you can bear it.",
      ),
      h.you("Six in the morning? I may need to bring a pillow."),
      h.say("Ha! Good. You've got a tongue. Marit had one too.", "happy"),
      h.note("He leaves a very big tip under the saucer and pretends he hasn't."),
    ],
  }),
  scene({
    regular: 5,
    index: 2,
    title: "Twenty Years of Feud",
    beats: [
      h.note("Evening again. Henrik stirs his cup for a long time, scowling at it."),
      h.say(
        "There's a woman at the market who took the corner stall. The best one, with the shade.",
      ),
      h.you("Did she take it from you?"),
      h.say(
        "She took it twenty years ago, and she has been bothering me ever since. I won't say her name.",
      ),
      h.say(
        "Every morning she sells bread ten steps from my fish. Every morning she's cheerful. It's rude.",
        "sad",
      ),
      h.you("What happened between you?"),
      h.say("Nothing. Something small. It's been so long I've forgotten what it was."),
      h.say("That's the worst part. I'm angry about something I can't even remember."),
      h.note("He drains the cup and stands up, but doesn't leave right away."),
    ],
  }),
  scene({
    regular: 5,
    index: 3,
    title: "A Cracked Crate",
    beats: [
      h.note(
        "Morning, early. Henrik places a split wooden crate on the counter as if it might bite.",
      ),
      h.say(
        "Someone left this at my stall at dawn. No name. But I know whose cracked crate it is.",
        "sad",
      ),
      h.say(
        "It's the one we shared. She kept it all this time. She mended the corner with blue string.",
      ),
      h.note("Inside, wrapped in a clean cloth, is a small card in faded handwriting."),
      h.say("My mother's ginger loaf. The only copy. I thought it was lost in the move.", "sad"),
      h.say(
        "The woman who took the corner stall. Karin Dahl. There. I said it. It tastes of rust.",
      ),
      h.you("She kept your mother's card safe for twenty years."),
      h.say("Yes. That's what I can't stand. It's very hard to stay angry at her.", "happy"),
      h.say("What do I do? I've never had a clever idea in my life. You tell me."),
    ],
    choice: choice(
      C1,
      "What should Henrik do?",
      9,
      {
        label: "Bring her a loaf as thanks",
        reaction: [
          h.say(
            "A loaf. From the card. She'll know exactly what it means. She was there when my mother baked it.",
            "happy",
          ),
          h.say(
            "I'll bake it tonight. Come hungry, and tell me how it goes, if I survive.",
            "happy",
          ),
        ],
      },
      {
        label: "Nod at her and leave it be",
        reaction: [
          h.say("A nod. Yes. A small thing. I'm better at small things than big ones.", "happy"),
          h.say("Come back next week. I'll tell you if a nod was enough.", "happy"),
        ],
      },
    ),
  }),
  scene({
    regular: 5,
    index: 4,
    title: "Karin's Side",
    beats: [
      h.note(
        "Morning. Henrik is already at the counter when you open, holding a small folded note.",
      ),
      h.say(
        "Someone slipped this under your door. It says my name on the front. Her writing.",
        "sad",
      ),
      h.say(
        "'Henrik. I took the corner stall because the sun was bad on the back stall. I never meant to take it from you.'",
      ),
      h.say("'We had a good thing, once. Ahlgren and Dahl. I miss the old sign. Karin.'"),
      h.you("You were partners."),
      h.say(
        "We were, for six years. Now I remember. We split over who should paint the sign first. Isn't that silly?",
        "sad",
      ),
      h.say(
        "I brought her a loaf, like you said. She cried, then pretended it was the onions.",
        "happy",
        when(C1, "a"),
      ),
      h.say(
        "I nodded at her this week. She nodded back. We both looked at the sea very hard.",
        "happy",
        when(C1, "b"),
      ),
      h.say("I'll write back. It'll take a week. I've never written anything but a bill."),
    ],
  }),
  scene({
    regular: 5,
    index: 5,
    title: "Two Stalls, One Quay",
    beats: [
      h.note(
        "Morning light on the quay. Henrik arrives early, with a loaf wrapped in paper under his arm.",
      ),
      h.say(
        "I wrote my letter. It had eleven words. Karin wrote back with twelve. She always has to win.",
        "happy",
      ),
      h.you("What did the letters say?"),
      h.say("That we were both fools. That the sign was a daft thing to fight over."),
      h.say(
        "Karin's coming to the shop today. At nine. I'm not nervous. I've polished my boots twice.",
        "sad",
      ),
      h.you("I'll make the tea."),
      h.say("Two cups. And your best ginger loaf, the one from the card.", "happy"),
      h.note("At nine the door opens and a woman with flour on her sleeves steps in."),
    ],
    endings: {
      a: ending("One Stall, Two Chairs", [
        h.note(
          "Henrik and Karin share the corner stall. A second chair appears behind the counter.",
        ),
        h.say(
          "Ahlgren and Dahl. Back on the sign, in the right order this time. Alphabetical.",
          "happy",
        ),
        h.note("The queue for ginger loaf and fish stretches to the sea wall every morning."),
        h.say(
          "She still sells her bread ten steps from me. Now it's ten inches. I don't mind.",
          "happy",
        ),
      ]),
      b: ending("A Bench Between", [
        h.note(
          "The two stalls stay where they are. A green bench appears between them, painted by hand.",
        ),
        h.say(
          "We share tea there every morning. Two cups, one pot. Nobody talks until the second cup.",
          "happy",
        ),
        h.note(
          "Customers have started sitting on the bench, too, and passing their loaf to the next person.",
        ),
        h.say("It's a small thing. I'm good at small things.", "happy"),
      ]),
    },
  }),
];
