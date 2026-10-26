import { choice, ending, scene, voice, when } from "./build";

const a = voice(7);
const C1 = "r7-c1";

export const ABEL_SCENES = [
  scene({
    regular: 7,
    index: 1,
    title: "The Name on the Flyleaf",
    beats: [
      a.note(
        "Rain on the glass. A tall, stooped man in a tweed jacket leans on a brass-topped cane by the bookshelf.",
      ),
      a.say(
        "Good afternoon. Forgive me for standing in your light. I'm looking for a book I know. I wonder if you have it.",
      ),
      a.you("I can't promise. Marit's shelves hold more than I've counted."),
      a.note(
        "He runs a finger along the spines and stops. Slowly, he draws out Salt and Sparrows.",
      ),
      a.say(
        "Oh. Oh, my. Would you mind if I opened the cover? My eyes are old, but this I can read.",
        "happy",
      ),
      a.note("On the flyleaf, in pencil, are two words: A. Quill."),
      a.say(
        "That is my hand. I wrote those words more than fifty years ago. I'm Abel Quill.",
        "happy",
      ),
      a.you("How did your book end up here?"),
      a.say(
        "I would very much like to know. May I sit with it a while? I'll buy a pot of tea.",
        "happy",
      ),
    ],
  }),
  scene({
    regular: 7,
    index: 2,
    title: "Who Was Ines",
    beats: [
      a.note(
        "Morning. Abel is already at the window seat, the book open on his knee, a cooling cup beside him.",
      ),
      a.say(
        "I taught school for forty years. Most of my students are fine memories. A few are stars.",
      ),
      a.say(
        "Ines Ferro was a quiet girl who wrote poems on the back of her spelling tests.",
        "happy",
      ),
      a.say(
        "I printed her first poems on a little press, and bound them myself. Twenty copies. This is one.",
      ),
      a.you("You lent it to her."),
      a.say(
        "She lost her nerve, you see. I gave her my own copy to remind her it was real. She left for the mainland that year.",
      ),
      a.say(
        "Years later I read in a paper that a poet named Ines Ferro had a new book. It was her. I wept into my toast.",
        "sad",
      ),
      a.say(
        "She never wrote back to the school. Perhaps she forgot an old teacher. It's what young people should do.",
      ),
      a.say("Still. I'd love to know that she is well."),
    ],
  }),
  scene({
    regular: 7,
    index: 3,
    title: "Postmarks",
    beats: [
      a.note(
        "A bright morning. Abel hobbles in, quick for once, with a faded ledger under his arm.",
      ),
      a.say(
        "I found something, but it was your Marit who found it first. Her old ledger. She wrote down every book she bought.",
      ),
      a.note(
        "Halfway down the page: Salt and Sparrows, from I. Ferro, 9 Cobble Row, Harn. Paid in tea.",
      ),
      a.you("Ines sold it to Marit?"),
      a.say(
        "Or gave it. Marit paid in tea, which was how she did most things. And look, there's an address.",
        "happy",
      ),
      a.say(
        "An old address. Fifty years is a long time for a letter to travel, but letters are patient things.",
      ),
      a.say(
        "I've the pencil. I've the paper. What I don't have is the courage to choose how.",
        "sad",
      ),
      a.you("What are the choices?"),
      a.say(
        "I could send a letter to Cobble Row. Or leave the book in your window, with a note, and trust the harbour.",
      ),
    ],
    choice: choice(
      C1,
      "What should Abel do?",
      9,
      {
        label: "Write a letter to Ines",
        reaction: [
          a.say(
            "A letter. Yes. I'll write it tonight, and I'll write it plainly. Plain words travel best.",
            "happy",
          ),
          a.say("Come on Thursday and tell me if it sounds too much like a lecture."),
        ],
      },
      {
        label: "Leave the book in the window",
        reaction: [
          a.say(
            "The window. Where the lamp can see it. Marit would have approved of a book keeping watch.",
            "happy",
          ),
          a.say("I'll write the note now. Can you spare me a card and a little time on Thursday?"),
        ],
      },
    ),
  }),
  scene({
    regular: 7,
    index: 4,
    title: "A Reply, or Not",
    beats: [
      a.note(
        "A cold morning. Abel arrives with a faint line of frost on his hat and an empty hand.",
      ),
      a.say(
        "No letter again. I check the box every day at eight, then again at noon, in case the post is shy.",
        "sad",
      ),
      a.say(
        "I sent my letter to Cobble Row. Nine lines. I wrote them seven times.",
        undefined,
        when(C1, "a"),
      ),
      a.say(
        "The book sits in your window with my note beside it. Three people have stopped to read.",
        undefined,
        when(C1, "b"),
      ),
      a.you("Waiting is hard work."),
      a.say(
        "It is. But I have taught patience to children for forty years. It would be rude not to try it myself.",
      ),
      a.say("Marit used to say the harbour gives back what you give it, only later."),
      a.say("I think she's right. I only hope I am still here to see it."),
      a.say(
        "Come on Saturday. Perhaps a letter will have turned up. Or perhaps just a good cup of tea.",
        "happy",
      ),
    ],
  }),
  scene({
    regular: 7,
    index: 5,
    title: "The Book That Came Home",
    beats: [
      a.note(
        "Rain again, harder. Abel pushes open the door with a stiff white envelope in one hand.",
      ),
      a.say(
        "It came this morning. I have not opened it. I have carried it like a hot cup all day.",
        "happy",
      ),
      a.you("Shall I leave you alone?"),
      a.say("No, please. Marit would say a good letter should be read in company."),
      a.note("He slides a thumb under the flap and unfolds one thin page of blue paper."),
      a.say(
        "The handwriting. It's the same handwriting. After fifty years. She still crosses her sevens.",
      ),
      a.say("Let me read it aloud, if my voice holds."),
    ],
    endings: {
      a: ending("The Reply", [
        a.note(
          "Ines writes that she remembers the little press and every one of the twenty copies.",
        ),
        a.say(
          "She is coming to Lantern Night. She says she will stand on the quay and not make a speech.",
          "happy",
        ),
        a.note(
          "On the night a white-haired woman steps off the evening ferry. Abel waits with his cane and the book.",
        ),
        a.say("Welcome home, Ines.", "happy"),
      ]),
      b: ending("The Shelf Where It Waits", [
        a.note(
          "The envelope holds only a pressed sparrow feather and one line: Keep it where the light is.",
        ),
        a.say("Keep it where the light is. That's all. It's more than I hoped for.", "happy"),
        a.note(
          "The book stays in the window. Every Thursday Abel sits beside it and reads a poem aloud to whoever passes.",
        ),
        a.say("Some books don't need to leave home to find their readers.", "happy"),
      ]),
    },
  }),
];
