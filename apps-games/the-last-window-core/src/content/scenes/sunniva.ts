import { choice, ending, scene, voice, when } from "./build";

const s = voice(8);
const C1 = "r8-c1";
const C2 = "r8-c2";

export const SUNNIVA_SCENES = [
  scene({
    regular: 8,
    index: 1,
    title: "Wet Paint",
    beats: [
      s.note(
        "Rain streaks the window. A woman in a mustard cardigan sits with a sketchbook, a pencil stuck in her messy bun.",
      ),
      s.say(
        "Don't mind me. I'm drawing your harbour, and the harbour is not sitting still.",
        "happy",
      ),
      s.you("It never does. It's all water."),
      s.say(
        "Ha! Yes. I'm Sunniva. I paint. I only arrived last week, and I've never seen so many shades of wet.",
      ),
      s.say(
        "Back home the sea was blue. Here, it's every colour except blue. I love it, and it's driving me quite mad.",
        "happy",
      ),
      s.you("May I see?"),
      s.note(
        "She turns the page. The pencil lines are quick and warm. A fishing boat, a gull, and a small lit window.",
      ),
      s.say("That's your window. I couldn't leave it out. It's the only warm thing for miles."),
      s.say("May I sit here again? The light is good, and the tea is better.", "happy"),
    ],
  }),
  scene({
    regular: 8,
    index: 2,
    title: "The Blank Wall",
    beats: [
      s.note(
        "Another grey, wet day. Sunniva sits with her back to the window, staring at her empty page.",
      ),
      s.say(
        "The town asked me to paint the sea wall for Lantern Night. The whole wall. Forty paces long.",
        "sad",
      ),
      s.say(
        "I said yes before I could think. Now I'm standing in front of it every morning, with nothing.",
      ),
      s.you("Nothing at all?"),
      s.say("A very clean wall. I'm a professional at looking at it."),
      s.say(
        "The trouble is, I'm new. I don't know what the town wants to see. I don't know what I want to say.",
      ),
      s.say(
        "Should I ask them, or should I trust my eye? You've lived here three weeks. That's longer than me.",
      ),
      s.note("She shuts the sketchbook and faces you at last."),
      s.say("Tell me what you'd do. I'll listen. I have a very clean wall to fill."),
    ],
    choice: choice(
      C1,
      "What do you tell Sunniva?",
      9,
      {
        label: "Ask the townsfolk what to paint",
        reaction: [
          s.say("Ask them! I'm a fool. Of course I should ask the people who live here.", "happy"),
          s.note("She flips to a fresh page and writes, in big letters, Ask everyone."),
        ],
      },
      {
        label: "Paint what you see at dawn",
        reaction: [
          s.say(
            "At dawn. Yes. That is when the sea shows me who it is. I'll be there before the gulls.",
            "happy",
          ),
          s.note("She tucks her pencil into her bun and smiles at the grey window."),
        ],
      },
    ),
  }),
  scene({
    regular: 8,
    index: 3,
    title: "Seven Shades of Grey",
    beats: [
      s.note(
        "Evening. The lamp is lit and Sunniva has set out seven small jars on the counter, each a different grey.",
      ),
      s.say(
        "Seven greys of the sea. Oyster, pewter, slate, gull, mist, steel, and the grey of a long Tuesday.",
        "happy",
      ),
      s.you("You mixed all those?"),
      s.say(
        "I tried. Three are wrong. Four are nearly right. That's more than I managed all last week.",
      ),
      s.say(
        "I asked the fishermen what colour the sea was. Every one gave me a different answer.",
        undefined,
        when(C1, "a"),
      ),
      s.say(
        "I went down at dawn, and the sea gave me a different answer every five minutes.",
        undefined,
        when(C1, "b"),
      ),
      s.say(
        "That's the secret, I think. The sea is never one colour. So the wall can't be one thing.",
      ),
      s.say("I'm doing the worst bit first. I'm making all the mud, and then I'll make the sky."),
      s.say(
        "Come see it tomorrow, if the rain holds off. I'd like a friend there at the start.",
        "happy",
      ),
    ],
  }),
  scene({
    regular: 8,
    index: 4,
    title: "A Child's Drawing",
    beats: [
      s.note("Late afternoon. Sunniva stops at the corkboard by the till and goes very still."),
      s.say(
        "Who drew this? A little boat, a very big sun, and a fish with a smile, in crayon. It's wonderful.",
      ),
      s.you("A child left it last week. She said it was for the wall."),
      s.say(
        "For the wall! She understood the job before I did. Look at the sun. It isn't realistic. It's happy.",
        "happy",
      ),
      s.say("I've been painting for me. Maybe I should paint for them, or let them paint with me."),
      s.say("But a whole town? Hundreds of people, all with a brush? It could be a mess.", "sad"),
      s.say("Or it could be a masterpiece. I honestly can't tell. What do you think?"),
      s.note("Behind her, rain softens on the glass, and the crayon sun glows on its pin."),
      s.say("I need you to be honest. You don't have to be right."),
    ],
    choice: choice(
      C2,
      "What do you suggest?",
      9,
      {
        label: "Pin up paper and let the town draw",
        reaction: [
          s.say(
            "Paper on the wall. Everyone draws their favourite bit of the harbour. I'd paint the tiles.",
            "happy",
          ),
          s.say("Pin up the first sheet, and I'll bring the crayons on Friday."),
        ],
      },
      {
        label: "Trust your own eye",
        reaction: [
          s.say("My own eye. It's frightening, and it's the only honest thing I have.", "happy"),
          s.say("I'll paint the dawn. You can bring a lamp so I can see the wall."),
        ],
      },
    ),
  }),
  scene({
    regular: 8,
    index: 5,
    title: "The Window Mural",
    beats: [
      s.note(
        "Morning, the day before Lantern Night. Sunniva stands at the window, paint on her sleeves and one cheek.",
      ),
      s.say(
        "Look at the sea wall from here. Your window frames it exactly. I've been painting the view you see.",
        "happy",
      ),
      s.you("It looks different from this side of the glass."),
      s.say(
        "Everything does. I have been so afraid of being wrong. Then you said something simple, and I stopped.",
      ),
      s.say(
        "Asking the town was the right start. Their ideas fill my sketchbook.",
        undefined,
        when(C1, "a"),
      ),
      s.say(
        "Painting the dawn was the right start. I have learned to trust my own eye.",
        undefined,
        when(C1, "b"),
      ),
      s.say("The wall is nearly ready for Lantern Night. Come outside with me. I'll show you."),
    ],
    endings: {
      a: ending("Everyone's Wall", [
        s.note(
          "The town paints tiles of its own: a boat, a cat, a teacup. Soon the sea wall is a patchwork.",
        ),
        s.say(
          "It isn't tidy. It's wonderful. There's a crayon sun in the middle, and I haven't touched it.",
          "happy",
        ),
        s.note("On Lantern Night, families hold their lanterns up beside their own tiles."),
        s.say("It's everyone's wall. I only held the brush.", "happy"),
      ]),
      b: ending("One Long Sunrise", [
        s.note(
          "Sunniva paints a single sunrise, stretching the whole length of the sea wall, from grey to gold.",
        ),
        s.say(
          "Forty paces of morning. I mixed seven greys for the bottom and one gold for the top.",
          "happy",
        ),
        s.note(
          "On Lantern Night the town stands quietly in front of it, lanterns lowered, watching the paint catch the light.",
        ),
        s.say("I wanted them to just stand there and feel it. And they are.", "happy"),
      ]),
    },
  }),
];
