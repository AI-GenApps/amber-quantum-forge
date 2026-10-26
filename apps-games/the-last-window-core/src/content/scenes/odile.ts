import { choice, ending, scene, voice, when } from "./build";

const o = voice(1);
const C1 = "r1-c1";

export const ODILE_SCENES = [
  scene({
    regular: 1,
    index: 1,
    title: "The Chair by the Glass",
    beats: [
      o.note(
        "Morning light fills the arched window. A woman in a navy cardigan reads the sign twice.",
      ),
      o.say("You've lit the lamp. I wondered if anyone would, after Marit."),
      o.you("I'm trying. She left me the shop three weeks ago, and everything is new."),
      o.say(
        "I'm Odile. May I have the chair nearest the glass? It has the best view of the water.",
      ),
      o.you("It's yours. Do you like to watch the boats?"),
      o.say(
        "I kept the light on Skerry Point for forty years. On clear nights I could see this lamp across the water.",
        "happy",
      ),
      o.say(
        "Marit lit it for the late boats. I lit mine for the same boats. We kept each other company, in our way.",
      ),
      o.note("She settles into the chair and looks out at the pale harbour."),
      o.you("Then the chair stays yours. Come back soon."),
    ],
  }),
  scene({
    regular: 1,
    index: 2,
    title: "Forty Years of Weather",
    beats: [
      o.note("Rain taps the window. Odile comes in with a worn book wrapped in a cloth."),
      o.say(
        "My logbook. Forty years of weather, all in pencil. I thought it should sit by your window.",
      ),
      o.you("Will you read me a page?"),
      o.say(
        "The big storm. 'Wind hard from the north. Sea white to the sky. Lamp burning. Nothing lost tonight.'",
      ),
      o.say(
        "I wrote that last line a thousand times. It was all I ever wanted from a night.",
        "happy",
      ),
      o.note("She closes the book and holds it flat with both hands."),
      o.say(
        "The council will take the old lens down after Lantern Night. They say the new light is enough.",
        "sad",
      ),
      o.you("That sounds like a lot to lose."),
      o.say("It is. Bring me another cup. Next time I'll read you the one about the fog."),
    ],
  }),
  scene({
    regular: 1,
    index: 3,
    title: "A Brass Letter",
    beats: [
      o.note(
        "A grey day on the quay. Odile sits very still, a letter with a brass seal beside her cup.",
      ),
      o.say("The council wrote to me. They want my answer by Lantern Night."),
      o.say("Should the lens go to the museum, with a neat little card? Or be lit one last time?"),
      o.say("My head says museum. My heart says light it. They won't speak to each other.", "sad"),
      o.you("What would Marit say?"),
      o.say(
        "That it is mine to choose. She was right about most things, which was very annoying.",
        "happy",
      ),
      o.say("Thank you. I'll write the answer tonight, with the lamp on."),
      o.note("She tucks the letter into her pocket and finishes her tea in one long sip."),
      o.say("Come by in the next storm. I have a story about Marit and her lamp."),
    ],
    choice: choice(
      C1,
      "What should Odile tell the council?",
      6,
      {
        label: "Ask to light it one more night",
        reaction: [
          o.say(
            "One more night. Yes. Not for the council. For every boat that ever counted on me.",
            "happy",
          ),
          o.note("Her shoulders loosen, as if she has set down a heavy bag."),
        ],
      },
      {
        label: "Offer the lens to the museum",
        reaction: [
          o.say(
            "The museum. Children will see it, and they will learn what a light is for. That is good work for brass.",
          ),
          o.note("She nods slowly, then smiles for the first time today."),
        ],
      },
    ),
  }),
  scene({
    regular: 1,
    index: 4,
    title: "Storm Glass",
    beats: [
      o.note(
        "The long rain has not stopped for two days. Odile shakes out her coat and takes her chair.",
      ),
      o.say(
        "On a night like this, forty years ago, a boat lost the channel. The fog sat thick on Skerry Point.",
      ),
      o.say(
        "My beam could not cut through it. Then a small light began to swing in this window. Left, right, left.",
      ),
      o.say(
        "Marit, with a lamp. She waved it for an hour, until her arm shook. The boat turned past the rocks and came home.",
      ),
      o.you("She never told me that."),
      o.say("She wouldn't. She said the lamp did the work and she only held it.", "happy"),
      o.say(
        "I asked the council to light my lens one more night. Perhaps it is my turn to hold the lamp.",
        undefined,
        when(C1, "a"),
      ),
      o.say(
        "I offered my lens to the museum. Let it shine in a room where children can see it.",
        undefined,
        when(C1, "b"),
      ),
      o.say("Lantern Night is close. Come and find me on the quay. I'll want a friend beside me."),
    ],
  }),
  scene({
    regular: 1,
    index: 5,
    title: "The Light on Skerry Point",
    beats: [
      o.note(
        "Evening. The lamp is lit and Odile sits straight in her chair, an envelope in her hand.",
      ),
      o.say(
        "The council's answer came this morning. I have carried it all day without opening it.",
      ),
      o.you("Would you like me to stay while you read?"),
      o.say(
        "Please. Marit read bad news standing up and good news sitting down. I'm sitting, to be safe.",
        "happy",
      ),
      o.note("The paper rustles. Odile reads it twice, her glasses low on her nose."),
      o.say("Well. Here it is, in ink."),
    ],
    endings: {
      a: ending("Lit One More Night", [
        o.note("The council agrees. On Lantern Night the old lens will be lit one last time."),
        o.say("Me, at the switch! Forty years, and I thought I had said goodbye.", "happy"),
        o.note(
          "On the night, the beam sweeps the quay, slow and gold, and every paper lantern turns to meet it.",
        ),
        o.say("Nothing lost tonight.", "happy"),
      ]),
      b: ending("The Lens on the Shelf", [
        o.note("The lens will go to the museum, and a brass copy will hang in the Last Window."),
        o.say(
          "A little brass lens by Marit's lamp. The late boats will have two lights to count on.",
          "happy",
        ),
        o.note(
          "The copy turns in the glass. Odile settles into her chair and keeps watch, as she always has.",
        ),
        o.say("Nothing lost tonight.", "happy"),
      ]),
    },
  }),
];
