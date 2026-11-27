// What the new operator thinks [design 6 Thoughts, R12]. Facts about real telegraph work around 1903,
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
    id: 'marconi',
    text: 'Two winters ago Marconi sent a signal across the Atlantic with no wire at all. Imagine that.',
  },
  {
    id: 'post-office',
    text: 'Most telegraphs belong to the Post Office now. This line still belongs to the company.',
  },
  {
    id: 'train-orders',
    text: 'Railway messages come down this wire too. One wrong letter and two trains could meet.',
  },
  {
    id: 'ocean-cable',
    text: 'There is a cable under the ocean to America. A message gets across in minutes.',
  },
  {
    id: 'battery',
    text: 'The battery jars under the desk make the current. Copper, zinc and blue vitriol, that is all it takes.',
  },
  {
    id: 'edison',
    text: 'They say Mr Edison was a telegraph operator once, before he invented the phonograph.',
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

