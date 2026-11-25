// What the new operator thinks [design 6 Thoughts, R12]. Facts about real 1870s telegraph work,
// in the voice of someone new to the job. One version each, the same in every mode.
// director/thoughts.js picks and shows them, together with the message reactions.

export const FACTS = [
  {
    id: 'paid-per-word',
    text: 'Every word costs money... that must be why everyone writes so short.',
  },
  {
    id: 'stop',
    text: 'STOP must mean the end of a sentence. I keep reading it as an order.',
  },
  {
    id: 'fist',
    text: 'They say every operator taps a little differently, and old hands can tell who is sending.',
  },
  {
    id: 'on-off',
    text: 'So the wire only carries current on and off, short and long. That is all Morse is.',
  },
  {
    id: 'sounder',
    text: 'No beeping on a real line, the sounder clicks instead. I have to learn to hear the gaps.',
  },
  {
    id: 'galvanometer',
    text: 'The needle moves when current flows, so I can see if the line is alive.',
  },
  {
    id: 'railway',
    text: 'The wire runs for miles along the railway. Strange to think someone sits at the other end.',
  },
  {
    id: 'seventy-three',
    text: 'Operators sign off with 73. As far as I can tell, it means best regards.',
  },
  {
    id: 'thirty',
    text: 'A 30 at the end means that is all, nothing more is coming.',
  },
  {
    id: 'train-orders',
    text: 'Train orders come down this wire. One wrong letter and two trains could meet on one track.',
  },
  {
    id: 'ocean-cable',
    text: 'They laid a cable under the ocean to Europe. A message gets across in minutes now.',
  },
  {
    id: 'battery',
    text: 'The battery jars under the desk make the current. Copper, zinc and blue vitriol, that is all it takes.',
  },
  {
    id: 'edison',
    text: 'A young man called Edison was an operator once, they say. Now he invents things.',
  },
  {
    id: 'lightning',
    text: 'In a thunderstorm the wire can bring lightning right into the office. Best keep my hands off the key.',
  },
  {
    id: 'messenger',
    text: 'Every telegram still needs a messenger boy to run it to the door.',
  },
];

export const MAX_THOUGHT_WORDS = 20;
export const wordCount = (s) => s.trim().split(/\s+/).length;

