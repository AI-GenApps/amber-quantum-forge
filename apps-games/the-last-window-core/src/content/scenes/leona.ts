import { choice, ending, scene, voice, when } from "./build";

const l = voice(6);
const C1 = "r6-c1";
const C2 = "r6-c2";

export const LEONA_SCENES = [
  scene({
    regular: 6,
    index: 1,
    title: "A Quiet Ten Minutes",
    beats: [
      l.note(
        "Evening. A woman in a green wool coat sits at the very end of the counter, a stethoscope poking from her pocket.",
      ),
      l.say(
        "Honey chamomile, please, and ten quiet minutes. That's all I get today, and I'd like to spend them well.",
        "happy",
      ),
      l.you("The quiet is free. Take as much as you like."),
      l.say(
        "I'm Leona. I'm the town doctor. Everyone in Port Merrow is my patient, whether they like it or not.",
      ),
      l.note("She sips, closes her eyes, and says something soft about the weather."),
      l.note("A moment later she is fast asleep, one hand still around her cup."),
      l.you("I'll keep the door closed and the lamp low."),
      l.note("Ten minutes pass. You top up her cup twice, and she never stirs."),
      l.say(
        "Oh no. Did I sleep? How long? ... Thank you. Nobody ever lets me finish a nap.",
        "happy",
      ),
    ],
  }),
  scene({
    regular: 6,
    index: 2,
    title: "The Brochure",
    beats: [
      l.note(
        "Evening again. Leona has a glossy brochure on the counter, with a picture of a pale blue sea.",
      ),
      l.say(
        "A seaside retreat down the coast. A week of sun, a bed, and nobody coughing at me.",
        "happy",
      ),
      l.say(
        "Dr. Tomas Reyes from the next village says he can cover my patients. He's kind, and very patient.",
      ),
      l.say(
        "I keep reading the price, and then the dates, and then I put it down. I've done that for a month.",
        "sad",
      ),
      l.you("What stops you from booking it?"),
      l.say(
        "The town needs me. Who will notice a sore throat at midnight? Who will remember the Larkin child's allergy?",
      ),
      l.say("And yet I fell asleep at your counter. I think that's my body knocking on the door."),
      l.you("Then I'll listen to the knock too."),
      l.say("Come on, you're my friend. What do you say?"),
    ],
    choice: choice(
      C1,
      "What do you tell Leona?",
      9,
      {
        label: "You have earned a real holiday",
        reaction: [
          l.say(
            "Earned. That's a lovely word. I'm not sure I know how to deserve something that gentle.",
            "happy",
          ),
          l.note(
            "She traces the sea in the brochure with one finger, like a person reading a map home.",
          ),
        ],
      },
      {
        label: "What would make the work feel lighter?",
        reaction: [
          l.say(
            "Lighter? Nobody has asked me that. I think I'd want someone to share the long nights.",
            "happy",
          ),
          l.note("She puts the brochure down and takes out a pen, then a small notebook."),
        ],
      },
    ),
  }),
  scene({
    regular: 6,
    index: 3,
    title: "The Missed Lunch",
    beats: [
      l.note(
        "Evening, and the harbour is turning purple. Leona unwraps a very sad, very squashed sandwich.",
      ),
      l.say(
        "Lunch. Three days late. I was going to eat it at noon on Tuesday, and again on Wednesday.",
        "sad",
      ),
      l.you("That sandwich has seen things."),
      l.say(
        "It has! It has been in three houses and one boat. It's very well travelled for a sandwich.",
        "happy",
      ),
      l.say("I want to make a promise to myself. I'm saying it out loud, so it counts."),
      l.say(
        "I will eat one proper meal sitting down, every day, even on bad days. Even when the phone rings.",
      ),
      l.say("I told Tomas I wanted to rest, and he said yes.", undefined, when(C1, "a")),
      l.say("I told Tomas I wanted shared nights, and he said maybe.", undefined, when(C1, "b")),
      l.you("Then let's start now. Eat. I'll watch the door."),
    ],
  }),
  scene({
    regular: 6,
    index: 4,
    title: "A Knock After Closing",
    beats: [
      l.note(
        "Closing time. You are turning the sign when Leona, halfway out the door, hears a knock at the shop window.",
      ),
      l.note(
        "A neighbour, Mr. Pell, stands in the rain. His small grandson has a cough that won't stop.",
      ),
      l.say(
        "Of course. Of course. Let me take a look. Come in, both of you, you're soaked.",
        "happy",
      ),
      l.note(
        "She kneels, listens to the boy's chest, and smiles. It's only a cold, and a small one.",
      ),
      l.say(
        "He's fine. Warm milk, a blanket, and a story. But tonight I'm so tired I could lie down on your floor.",
      ),
      l.you("You've got that look. The one from the brochure."),
      l.say(
        "I know. Part of me wants to run home. Part of me wants to walk Mr. Pell back myself.",
        "sad",
      ),
      l.say(
        "Tomas is on call tonight. He'd go. He always says yes. I'm the one who can't hand it over.",
      ),
      l.say("What do I do?"),
    ],
    choice: choice(
      C2,
      "How do you help Leona?",
      9,
      {
        label: "Tell her Tomas can handle tonight",
        reaction: [
          l.say(
            "He can, can't he? He's good. I keep forgetting that the town has more than one doctor.",
            "happy",
          ),
          l.you("Go home, Leona. Eat something. Come and tell me about it tomorrow."),
        ],
      },
      {
        label: "Walk with her to the clinic",
        reaction: [
          l.say(
            "Walk with me? To the clinic? In the rain? Then I'll hold the umbrella and you hold the lantern.",
            "happy",
          ),
          l.say("We'll see Mr. Pell home, and then come back for tea. I'd like that."),
        ],
      },
    ),
  }),
  scene({
    regular: 6,
    index: 5,
    title: "House Call Hours",
    beats: [
      l.note(
        "Morning, the day before Lantern Night. Leona walks in with a postcard-sized envelope and a clear face.",
      ),
      l.say(
        "I made my choice. It took a sleepless night, a whole pot of chamomile, and a long talk with Tomas.",
        "happy",
      ),
      l.you("You look different."),
      l.say("Rested. Or something close. I ate breakfast sitting down."),
      l.say(
        "Thank you for telling me Tomas could manage. He said thank you for believing it.",
        undefined,
        when(C2, "a"),
      ),
      l.say(
        "Thank you for walking with me through the rain. I won't forget that umbrella.",
        undefined,
        when(C2, "b"),
      ),
      l.say("I haven't told anyone yet. You can be first. Sit. I'll tell it properly."),
    ],
    endings: {
      a: ending("A Week at the Shore", [
        l.note(
          "Leona takes the holiday. Dr. Tomas Reyes covers her patients and does it very well.",
        ),
        l.say(
          "The sea! It's enormous! I forgot how loud the quiet is. Sleeping like a stone.",
          "happy",
        ),
        l.note(
          "A sandy postcard arrives, pinned by the till. It says, Wish you were here, and don't tell Tomas I said so.",
        ),
        l.say("P.S. I ate lunch every day. Sitting down. With a view.", "happy"),
      ]),
      b: ending("The Open Door", [
        l.note("Leona stays, and Dr. Tomas Reyes joins her at the clinic for good."),
        l.say(
          "Two doctors, shared hours, and a rule that nobody works every night. We made a sign.",
          "happy",
        ),
        l.note(
          "The new sign hangs on the clinic door: Open, with hours for two, and a small drawing of a teacup.",
        ),
        l.say(
          "Now I can nap on the sofa and sleep through to the morning. Almost always.",
          "happy",
        ),
      ]),
    },
  }),
];
