import { choice, ending, scene, voice, when } from "./build";

const j = voice(4);
const C1 = "r4-c1";
const C2 = "r4-c2";

export const JUNO_SCENES = [
  scene({
    regular: 4,
    index: 1,
    title: "Flour on the Pages",
    beats: [
      j.note(
        "Evening. A girl in a flour-dusted apron slips onto a stool and hides a taped-up notebook under her elbow.",
      ),
      j.say(
        "Hi. I'm Juno. I'm the baker's apprentice, so I smell like bread. Sorry about that.",
        "happy",
      ),
      j.you("I like it. It smells like a good morning."),
      j.say("The notebook? Oh, it's nothing. Just lists. Bread lists. Very dull."),
      j.note("A page slips out. It is covered in tiny, neat writing, and it is not a bread list."),
      j.you("That looks like a story."),
      j.say("Please don't tell anyone. I write a bit. I mean, a lot. I mean every night.", "sad"),
      j.say(
        "Nobody has read a single page. Not even the baker, and he reads the labels on soup tins.",
      ),
      j.you("Your secret is safe. Come back whenever you need a quiet seat."),
    ],
  }),
  scene({
    regular: 4,
    index: 2,
    title: "The Open Mic Poster",
    beats: [
      j.note("Morning. Juno stands at the window holding two bright posters and a roll of tape."),
      j.say(
        "The council asked me to put these up. One is for Lantern Night open mic. The other is a zine contest.",
      ),
      j.say(
        "A zine is a tiny hand-made book. You print it, fold it, and hand it round. It's like a story with legs.",
        "happy",
      ),
      j.you("May I put them in the window?"),
      j.say(
        "Please. Everyone who walks the quay will see them. My notebook will sit in my bag and shake.",
      ),
      j.say("Everyone says I should enter something. I just don't know which one.", "sad"),
      j.say("Reading out loud in front of a crowd, or letting paper do the talking?"),
      j.note("She sticks the posters up with great care, one corner at a time."),
      j.say("Don't say anything yet. Well. Actually, say something. Please.", "happy"),
    ],
    choice: choice(
      C1,
      "What do you say to Juno?",
      9,
      {
        label: "Sign up for the open mic",
        reaction: [
          j.say(
            "The open mic. Out loud. My stomach just did a somersault, but it was a happy one.",
            "happy",
          ),
          j.note("She writes her name on the sign-up list very small, then tries again, bigger."),
        ],
      },
      {
        label: "Enter the printed zine contest",
        reaction: [
          j.say(
            "The zine. Paper doesn't stare at me. I can hide in it and still be heard.",
            "happy",
          ),
          j.note("She counts the pages on her fingers and starts to smile."),
        ],
      },
    ),
  }),
  scene({
    regular: 4,
    index: 3,
    title: "The Girl in the Fog",
    beats: [
      j.note("A slow morning. Juno finds you alone and taps the notebook on the counter."),
      j.say(
        "You were kind about the posters. So here is draft nine. Just one page. Please be honest.",
        "sad",
      ),
      j.say(
        "'The fog came in like a cat. The girl walked into it, one hand on the wall, towards the lighthouse nobody had seen.'",
      ),
      j.say("'She said, I'm not lost. I'm just early to the part where I find it.' That's all."),
      j.you("It's lovely. The cat fog made me smile. The last line gave me goosebumps."),
      j.you("One thing: I wanted to know what she's afraid of."),
      j.say("Oh. Oh. She's afraid it won't be there. And that's me, isn't it?", "happy"),
      j.say(
        "Nobody has ever told me what to fix and still made me feel good. That's a very rare skill.",
      ),
      j.say("I'll write draft ten tonight. Don't tell the baker I was up so late."),
    ],
  }),
  scene({
    regular: 4,
    index: 4,
    title: "Stage Fright",
    beats: [
      j.note(
        "A rainy afternoon. Juno sits with her cocoa untouched, her headphones around her neck.",
      ),
      j.say(
        "The open mic list closes in three days. My name is on it. My hands have been shaking since breakfast.",
        "sad",
        when(C1, "a"),
      ),
      j.say(
        "The zine contest ends in three days. My pages are done, but I keep wanting to take them back.",
        "sad",
        when(C1, "b"),
      ),
      j.say(
        "What if the words only sound good in my head? What if I stand there and nothing comes out?",
      ),
      j.you("They sounded good on the counter, in a plain voice, over a latte."),
      j.say("That's true. You didn't even sigh once. I counted."),
      j.say(
        "It's just three more days. Three days is long enough to be brave, and short enough to panic.",
      ),
      j.note("She looks at the posters in the window, then at you, and takes a breath."),
      j.say("Come on Friday. Whatever happens, I'll bring you a warm bun."),
    ],
    choice: choice(
      C2,
      "How do you help Juno?",
      8,
      {
        label: "Promise to stand beside her",
        reaction: [
          j.say(
            "Beside me? On the quay? In front of everyone? Then my knees might stay on.",
            "happy",
          ),
          j.note("She laughs, loudly and with relief, and the baker's apron shakes with it."),
        ],
      },
      {
        label: "Offer to print copies so words can travel",
        reaction: [
          j.say(
            "Copies! Then the words can travel without me. That's cheating, and I love it.",
            "happy",
          ),
          j.note("She hugs her notebook and starts counting how many pages fit on one sheet."),
        ],
      },
    ),
  }),
  scene({
    regular: 4,
    index: 5,
    title: "Draft Nine",
    beats: [
      j.note(
        "Storm warning flags snap outside. Juno bursts in, her curls loose and her cheeks pink.",
      ),
      j.say(
        "I did it! Draft eleven is finished! I read it to the baker, and he cried into his flour.",
        "happy",
      ),
      j.you("Happy crying, I hope."),
      j.say(
        "The best kind. He said he thought it was his own story. It isn't, but it could be anyone's.",
      ),
      j.say(
        "You told me to be brave and you stood by me. That's the real draft nine, I think.",
        undefined,
        when(C2, "a"),
      ),
      j.say(
        "You told me words can travel. That's the real draft nine, I think.",
        undefined,
        when(C2, "b"),
      ),
      j.say(
        "Whatever happens on Lantern Night, I'm not the girl who hid her notebook any more.",
        "happy",
      ),
      j.you("Then let's see what Lantern Night brings."),
    ],
    endings: {
      a: ending("Out Loud", [
        j.note(
          "On Lantern Night Juno steps onto the little stage on the quay. The whole crowd quiets down.",
        ),
        j.say(
          "The fog came in like a cat. The girl walked into it, one hand on the wall.",
          "happy",
        ),
        j.note(
          "Her voice is small at first, then it grows. By the last line, nobody is looking at their lanterns.",
        ),
        j.say("I'm not lost. I'm just early to the part where I find it.", "happy"),
      ]),
      b: ending("The Zine", [
        j.note(
          "Juno prints forty copies of her zine, folded and stapled by hand. A stack sits by your till.",
        ),
        j.say(
          "A little too many, I think. Nobody will take them. I'll be sitting here with forty zines.",
          "sad",
        ),
        j.note(
          "By the time the last lantern floats out to sea, every copy is gone. People read them on the quay.",
        ),
        j.say("They're being read. By strangers. By the light of lanterns.", "happy"),
      ]),
    },
  }),
];
