// What the new operator thinks [design 6 Thoughts, R12]. Facts about real 1870s telegraph work,
// in the voice of someone new to the job. In Night Shift a fact may use its uneasy version, which
// keeps the real fact and adds a turn [R12.6]. `core` is the part of the fact both versions keep.
// T21 picks and shows them; message reactions are added there.

export const FACTS = [
  {
    id: 'paid-per-word',
    core: 'costs money',
    text: 'Every word costs money... that must be why everyone writes so short.',
    uneasy: 'Every word costs money, so people write short. Whoever sent that one is not counting.',
  },
  {
    id: 'stop',
    core: 'STOP',
    text: 'STOP must mean the end of a sentence. I keep reading it as an order.',
    uneasy: 'STOP marks the end of a sentence. Tonight it reads more like an order.',
  },
  {
    id: 'fist',
    core: 'taps a little differently',
    text: 'They say every operator taps a little differently, and old hands can tell who is sending.',
    uneasy: 'Every operator taps a little differently. I do not know this one.',
  },
  {
    id: 'on-off',
    core: 'on and off',
    text: 'So the wire only carries current on and off, short and long. That is all Morse is.',
    uneasy: 'The wire only carries on and off... so who is answering?',
  },
  {
    id: 'sounder',
    core: 'sounder clicks',
    text: 'No beeping on a real line, the sounder clicks instead. I have to learn to hear the gaps.',
    uneasy: 'The sounder clicks when current comes down the line. It clicked just now. Nobody is sending.',
  },
  {
    id: 'galvanometer',
    core: 'needle moves when current flows',
    text: 'The needle moves when current flows, so I can see if the line is alive.',
    uneasy: 'The needle moves when current flows. It is moving, and I am not sending.',
  },
  {
    id: 'railway',
    core: 'along the railway',
    text: 'The wire runs for miles along the railway. Strange to think someone sits at the other end.',
    uneasy: 'The wire runs for miles along the railway. Out there in the rain, something is tapping back.',
  },
  {
    id: 'seventy-three',
    core: '73',
    text: 'Operators sign off with 73. As far as I can tell, it means best regards.',
    uneasy: 'Operators sign off with 73, best regards. This one signed off before I even answered.',
  },
  {
    id: 'thirty',
    core: '30 at the end',
    text: 'A 30 at the end means that is all, nothing more is coming.',
    uneasy: 'A 30 at the end means that is all. It kept sending after the 30.',
  },
  {
    id: 'train-orders',
    core: 'Train orders come down this wire',
    text: 'Train orders come down this wire. One wrong letter and two trains could meet on one track.',
    uneasy: 'Train orders come down this wire. Tonight one came for a train that is not on any timetable.',
  },
  {
    id: 'ocean-cable',
    core: 'cable under the ocean',
    text: 'They laid a cable under the ocean to Europe. A message gets across in minutes now.',
    uneasy: 'They laid a cable under the ocean to Europe. I wonder what else listens down there.',
  },
  {
    id: 'battery',
    core: 'battery jars',
    text: 'The battery jars under the desk make the current. Copper, zinc and blue vitriol, that is all it takes.',
    uneasy: 'The battery jars under the desk make the current. Then where is the rest coming from?',
  },
  {
    id: 'edison',
    core: 'Edison',
    text: 'A young man called Edison was an operator once, they say. Now he invents things.',
    uneasy: 'Edison was an operator once, they say. I wonder if he ever heard a line like this.',
  },
  {
    id: 'lightning',
    core: 'lightning',
    text: 'In a thunderstorm the wire can bring lightning right into the office. Best keep my hands off the key.',
    uneasy: 'In a storm the wire can bring lightning into the office. Something else came in with the last one.',
  },
  {
    id: 'messenger',
    core: 'messenger boy',
    text: 'Every telegram still needs a messenger boy to run it to the door.',
    uneasy: 'Every telegram needs a messenger boy to run it over. Nobody wants to carry this one.',
  },
];

export const MAX_THOUGHT_WORDS = 20;
export const wordCount = (s) => s.trim().split(/\s+/).length;

// The text to show for a fact: the uneasy one only in Night Shift and Dead Air, never in Day Shift.
export function factText(fact, mode, uneasy) {
  return uneasy && mode !== 'day' ? fact.uneasy : fact.text;
}
