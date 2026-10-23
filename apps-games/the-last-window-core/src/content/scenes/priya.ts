import { choice, ending, scene, voice, when } from "./build";

const p = voice(3);
const C1 = "r3-c1";

export const PRIYA_SCENES = [
  scene({
    regular: 3,
    index: 1,
    title: "Notes in the Margin",
    beats: [
      p.note(
        "A woman in a green rain jacket writes in a field notebook at the window, her braid over one shoulder.",
      ),
      p.say(
        "Sorry, I'm taking up the best table. I always write where I can see the shore.",
        "happy",
      ),
      p.you("Take as long as you like. What are you writing?"),
      p.say(
        "Notes on the tide pools. I'm Priya. I study the little animals that live between the tides.",
      ),
      p.say(
        "Crabs, snails, anemones. Most people walk right past them. I think they are the best show in town.",
        "happy",
      ),
      p.you("Is there a book about them?"),
      p.say(
        "There should be. Do you have anything on the local coast? Even a very old one would help.",
      ),
      p.you("I'll look through the shelves tonight."),
      p.say("Then I'll be back with more questions than coins.", "happy"),
    ],
  }),
  scene({
    regular: 3,
    index: 2,
    title: "The Sea Hare",
    beats: [
      p.note("Rain on the glass. Priya sits with her notebook open to a small, careful drawing."),
      p.say(
        "Look at this. A sea slug, soft and brown, with two folds on its back like rabbit ears.",
      ),
      p.say(
        "I found it in the rocks below the sea wall. I don't think anyone has recorded one here.",
        "happy",
      ),
      p.you("That sounds like wonderful news."),
      p.say(
        "Or I'm wrong. I might have mixed it up with something common. I always doubt myself at this point.",
        "sad",
      ),
      p.say("The shore is full of clever people, and I'm one woman with a notebook and wet socks."),
      p.you("You noticed it. That counts for a lot."),
      p.say("Hm. When you say it, it sounds almost true. Thank you.", "happy"),
      p.say("Low tide is early on Friday. I'm going back to check. Keep a cup warm for me."),
    ],
  }),
  scene({
    regular: 3,
    index: 3,
    title: "Low Tide, Muddy Boots",
    beats: [
      p.note("Priya arrives with mud to her knees and a jar held against her chest like treasure."),
      p.say(
        "It's real! The same slug, and then two more. I measured every one. I sat in the mud for an hour.",
        "happy",
      ),
      p.you("You're shining. And a little brown."),
      p.say("Both, thank you. Now comes the hard part. What do I do with this?"),
      p.say("I could tell everyone I know. Or I could stay quiet until an expert says it's real."),
      p.say("Telling everyone is joyful. Waiting is safe. I never know which one is right.", "sad"),
      p.say(
        "Thank you for listening. I'll put the jar back by the shore at dusk, where it belongs.",
      ),
      p.note("She leaves muddy footprints on the floor and doesn't even notice."),
      p.say("Come to my talk, if I give one. I'll need a face I trust at the back."),
    ],
    choice: choice(
      C1,
      "What should Priya do with her find?",
      6,
      {
        label: "Show the whole town on Lantern Night",
        reaction: [
          p.say(
            "Show everyone! Lantern Night, with the whole quay there. Children will find it more exciting than I do.",
            "happy",
          ),
          p.note("She spins on her muddy heel, then remembers the jar and holds it still."),
        ],
      },
      {
        label: "Write to the institute first",
        reaction: [
          p.say(
            "The institute. Yes, that's careful and honest. If I'm wrong, I'll be wrong in private.",
            "happy",
          ),
          p.note("She takes out her notebook and begins a list of what to write."),
        ],
      },
    ),
  }),
  scene({
    regular: 3,
    index: 4,
    title: "Cold Hands, Warm Cup",
    beats: [
      p.note("Dusk. Priya wraps both hands around her cup and stares at the steam."),
      p.say(
        "My talk is on Saturday, for the harbour society. I've never spoken to forty people at once.",
        "sad",
      ),
      p.say(
        "I promised the town a look on Lantern Night. Saturday is the practice run.",
        undefined,
        when(C1, "a"),
      ),
      p.say(
        "I wrote to the institute and I am still waiting. Saturday is my warm-up.",
        undefined,
        when(C1, "b"),
      ),
      p.you("Try it on me. I'll be your first audience."),
      p.say(
        "Good evening, everyone. Today I want to talk about the best animals in the world, which are slugs.",
      ),
      p.you("That was good. Funny, even."),
      p.note("You take a funny book from the shelf and slide it across the counter."),
      p.say(
        "Seven Ways to Lose an Umbrella? Laughing first, then talking. Yes. I'll borrow it.",
        "happy",
      ),
    ],
  }),
  scene({
    regular: 3,
    index: 5,
    title: "The Tide Pool Guide",
    beats: [
      p.note("A bright morning. Priya sets down a cup and a bundle of sketches tied with string."),
      p.say(
        "The talk went well. I forgot the notes and told the story instead. People asked questions.",
        "happy",
      ),
      p.you("I knew they would."),
      p.say(
        "Afterwards a girl asked if the sea slugs get cold. I said I'd find out. I love that question.",
      ),
      p.say("I've been thinking about a guide. A small book, for anyone who walks the shore."),
      p.say("With your shelf of cosy books, I thought maybe it could live here too."),
      p.note(
        "She unties the string. Dozens of small drawings spill out: crabs, shells, and one brown sea slug.",
      ),
      p.say("I'll tell you what happens next. Pour me a cup, and settle in."),
    ],
    endings: {
      a: ending("The Touch Table", [
        p.note(
          "On Lantern Night Priya sets up a tide-pool touch table on the quay, with shallow trays and a lamp.",
        ),
        p.say(
          "Gently, with one finger. See? It feels like a wet pebble, and it does not mind.",
          "happy",
        ),
        p.note(
          "Children line up with their lanterns, whispering. Every one of them leaves a little braver.",
        ),
        p.say("This is the best Lantern Night of my life.", "happy"),
      ]),
      b: ending("The Letter From Away", [
        p.note(
          "A letter arrives from the institute. The sea slug is a true record for Port Merrow.",
        ),
        p.say(
          "A true record! They want my notes, my drawings, everything. I read the letter four times.",
          "happy",
        ),
        p.note(
          "Her guide comes out in spring. The first page says it was written at the Last Window.",
        ),
        p.say("I put you on the dedication page. Don't argue. It's already printed.", "happy"),
      ]),
    },
  }),
];
