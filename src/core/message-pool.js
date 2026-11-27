// The telegrams of the three nights, written for 1903 at a marsh relay station [design 6, R6.3,
// R6.3a, R12.5]. Short, no small words, STOP for a full stop. Each carries its To and From, written on
// the form; only the text is keyed. Abbreviations are period business shorthand: RECD received,
// YR/YRS your/yours, INST this month, ULT last month, PROX next month, AMT amount, SHIPT shipment,
// MDSE merchandise, ADV advise, BAL balance. A thread is a small story told in parts, in order.
// Strange messages from VN are in the hand of Mr E. Vane, the operator before.

const m = (id, day, kind, text, to, from, extra = {}) => ({ id, day, kind, text, to, from, strange: false, abbreviations: false, thread: null, ...extra });
const ABBR = { abbreviations: true };
const ODD = { strange: true };

export const POOL = [
  // Day 1: sending only. Every telegram fits two lines of the form [R9.2a]. In Night Shift and Dead
  // Air the last one is always the Head Office telegram to Mr Vane [R6.3a].
  m('d1-01', 1, 'send', 'ARRIVING TUESDAY NOON TRAIN', 'Mrs M. Hale, Kingsport', 'Thomas Hale'),
  m('d1-02', 1, 'send', 'SEND MONEY', 'Mrs Cole, 3 Mill Lane', 'Albert'),
  m('d1-03', 1, 'send', 'ALL IS WELL', 'Capt. Wren, Harbour Office', 'J. Pell'),
  m('d1-04', 1, 'send', 'MOTHER ILL COME HOME AT ONCE', 'Miss R. Marsh, Kingsport', 'Dr Hollis'),
  m('d1-05', 1, 'send', 'BABY BOY BORN STOP BOTH WELL', 'Mr & Mrs Oakes, Fenton', 'George Oakes'),
  m('d1-06', 1, 'send', 'CATTLE SOLD STOP HOME SATURDAY', 'Mrs Finch, Marsh Farm', 'John Finch'),
  m('d1-07', 1, 'send', 'RECD YRS STOP SHIPT MONDAY', 'Bell & Ward, Kingsport', 'Lowe Drapers', ABBR),
  m('d1-08', 1, 'send', 'WIRE ANSWER', 'Mr R. Dunn, Fenton', 'S. Wren'),
  m('d1-09', 1, 'send', 'NO ROOM AT HOTEL STOP', 'Mr A. Cole, Kingsport', 'Railway Hotel'),
  m('d1-10', 1, 'send', 'MISSED TRAIN STOP ARRIVE THURSDAY', 'Mrs Ross, 9 Quay Lane', 'William Ross'),
  m('d1-11', 1, 'send', 'AMT PAID STOP MDSE FOLLOWS', 'Harker Coal Co, Kingsport', 'J. Pell & Co', ABBR),
  m('d1-12', 1, 'send', 'YES', 'Miss E. Lark, Fenton', 'J. Finch'),
  m('d1-13', 1, 'send', 'WEDDING SET FOR JUNE', 'Mrs Lark, Fenton', 'Edith'),
  m('d1-14', 1, 'send', 'PLEASE ADVISE PRICE OF WHEAT', 'Corn Exchange, Kingsport', 'Marsh Farm'),
  m('d1-15', 1, 'send', 'SAFE HOME', 'Mrs Wren, Harbour Row', 'Samuel'),
  m('d1-16', 1, 'send', 'WHY NO REPORT', 'Mr E. Vane, Station 7', 'Head Office', ODD),
  // Dead Air's first night has more strange telegrams before it [R16.1].
  m('d1-17', 1, 'send', 'DO NOT ANSWER', 'Station 7', 'Station 9', ODD),
  m('d1-18', 1, 'send', 'WHO IS THIS', 'Station 9', 'Station 7', ODD),
  m('d1-19', 1, 'send', 'IT IS IN THE WIRES', 'Head Office', 'Station 7', ODD),
  m('d1-20', 1, 'send', 'SOMEONE IS LISTENING', 'Head Office', 'Station 7', ODD),
  m('d1-21', 1, 'send', 'LET ME IN', 'Station 7', 'Station 7', ODD),

  // Day 2: receiving only.
  m('d2-01', 2, 'receive', 'FLOOD AT LOWER FORD STOP HOLD ALL TRAINS', 'Stationmaster, Station 7', 'Signal Box 4'),
  m('d2-02', 2, 'receive', 'TRAIN LATE', 'Station 7', 'Marsh Junction'),
  m('d2-03', 2, 'receive', 'GALE COMING FROM WEST', 'Station 7', 'Harbour Office'),
  m('d2-04', 2, 'receive', 'PAY BEARER TEN SHILLINGS', 'Mr T. Hale', 'Barclay & Sons'),
  m('d2-05', 2, 'receive', 'RECD YR WIRE STOP AMT SENT ULT NOT ARRIVED', 'Mr R. Dunn, Fenton', 'J. Pell & Co', ABBR),
  m('d2-06', 2, 'receive', 'NEW OPERATOR ARRIVES MONDAY', 'Station 7', 'Head Office'),
  m('d2-07', 2, 'receive', 'DOCTOR NEEDED AT MARSH FARM', 'Dr Hollis', 'Mrs Finch'),
  m('d2-08', 2, 'receive', 'HERRING FLEET IN STOP PRICES FALLING', 'Mr S. Wren, Fish Market', 'Harbour Office'),
  m('d2-09', 2, 'receive', 'ALL CLEAR', 'Station 7', 'Signal Box 4'),
  m('d2-10', 2, 'receive', 'HOLD MAIL', 'Postmaster, Fenton', 'Mr A. Cole'),
  m('d2-11', 2, 'receive', 'PRICE OF COAL RISING STOP BUY NOW', 'Mr T. Hale', 'Harker Coal Co'),
  m('d2-12', 2, 'receive', 'MDSE RECD DAMAGED STOP ADV BY RETURN', 'Bell & Ward, Kingsport', 'Lowe Drapers', ABBR),
  m('d2-13', 2, 'receive', 'CONSTABLE COMING ON EVENING TRAIN', 'Station 7', 'County Police'),
  m('d2-14', 2, 'receive', 'NOTHING TO REPORT', 'Station 7', 'Marsh Junction'),
  m('d2-15', 2, 'receive', 'NO', 'Mr J. Finch', 'Miss E. Lark'),
  m('d2-16', 2, 'receive', 'MARY ANN NOT IN PORT', 'Mrs Ross, 9 Quay Lane', 'Harbour Office', { thread: { id: 'ship', part: 1 } }),
  m('d2-17', 2, 'receive', 'MARY ANN SIGHTED ALL SAFE', 'Mrs Ross, 9 Quay Lane', 'Harbour Office', { thread: { id: 'ship', part: 2 } }),
  m('d2-18', 2, 'receive', 'THEY NEVER LEFT THE STATION', 'Station 7', 'Station 7', ODD),
  m('d2-19', 2, 'receive', 'COLD HERE', 'Night Operator, Station 7', 'Station 9', ODD),
  m('d2-20', 2, 'receive', 'STOP SENDING STOP STOP SENDING', 'Station 7', 'Signal Box 4', ODD),
  m('d2-21', 2, 'receive', 'THE OPERATOR BEFORE YOU DID NOT LISTEN EITHER', 'Night Operator, Station 7', 'Head Office', ODD),
  m('d2-22', 2, 'receive', 'BEHIND YOU', 'Night Operator, Station 7', 'Station 7', ODD),
  m('d2-23', 2, 'receive', 'HAS MY HUSBAND BEEN MOVED', 'Head Office', 'Mrs E. Vane', ODD),

  // Day 3: both.
  m('d3-01', 3, 'either', 'LINE DOWN NEAR HOLLOW END STOP MEN SENT', 'Station 7', 'Linesman'),
  m('d3-02', 3, 'either', 'ALL TRAINS ON TIME', 'Station 7', 'Marsh Junction'),
  m('d3-03', 3, 'either', 'CONFIRM RECEIPT', 'Station 7', 'Head Office'),
  m('d3-04', 3, 'either', 'SEND TWO MEN FOR NIGHT WORK', 'Harker Coal Co, Kingsport', 'Mr T. Hale'),
  m('d3-05', 3, 'either', 'STOCK SHIPT PER YRS INST STOP BAL DUE PROX', 'Lowe Drapers', 'Bell & Ward', ABBR),
  m('d3-06', 3, 'either', 'CLERK WANTED STOP GOOD PAY STOP APPLY HEAD OFFICE', 'All stations', 'Marsh & Western'),
  m('d3-07', 3, 'either', 'WIRE BACK', 'Mr J. Finch', 'Miss E. Lark'),
  m('d3-08', 3, 'either', 'CANNOT COME STOP LETTER FOLLOWS', 'Mr A. Cole, Kingsport', 'Mrs Oakes'),
  m('d3-09', 3, 'either', 'GALE PASSED STOP NO DAMAGE', 'Station 7', 'Harbour Office'),
  m('d3-10', 3, 'either', 'LAMP OIL LOW STOP SEND MORE', 'Stores, Head Office', 'Station 7'),
  m('d3-11', 3, 'either', 'GOOD NIGHT', 'Mr J. Finch', 'Miss E. Lark'),
  m('d3-12', 3, 'either', 'RECD STOP WILL ADV', 'Mr R. Dunn, Fenton', 'J. Pell & Co', ABBR),
  m('d3-13', 3, 'either', 'MEET AT CHURCH SUNDAY STOP BRING THE CHILDREN', 'Mr W. Ross, Kingsport', 'Mrs Ross'),
  m('d3-14', 3, 'either', 'HOME SOON', 'Mrs Wren, Harbour Row', 'Samuel'),
  m('d3-15', 3, 'either', 'MOTHER WORSE COME QUICKLY', 'Miss R. Marsh, Kingsport', 'Dr Hollis', { thread: { id: 'mother', part: 1 } }),
  m('d3-16', 3, 'either', 'MOTHER ASKS FOR YOU', 'Miss R. Marsh, Kingsport', 'Dr Hollis', { thread: { id: 'mother', part: 2 } }),
  m('d3-17', 3, 'either', 'THE WIRE GOES NOWHERE', 'Night Operator, Station 7', 'Station 9', ODD),
  m('d3-18', 3, 'either', 'NO ONE IS SENDING THIS', 'Night Operator, Station 7', 'Station 7', ODD),
  m('d3-19', 3, 'either', 'YOU ARE THE LAST ONE AWAKE', 'Night Operator, Station 7', 'Station 9', ODD),
  m('d3-20', 3, 'either', 'DEAD AIR', 'Head Office', 'Station 7', ODD),
  m('d3-21', 3, 'either', 'WE HEAR YOU TAPPING STOP WE HAVE ALWAYS HEARD YOU', 'Night Operator, Station 7', 'Station 9', ODD),
  m('d3-22', 3, 'either', 'OPEN THE DOOR', 'Night Operator, Station 7', 'Station 7', ODD),
  m('d3-23', 3, 'either', 'DO NOT ANSWER IT', 'Night Operator, Station 7', 'VN', ODD),
  m('d3-24', 3, 'either', 'IT LEARNS YOUR HAND', 'Night Operator, Station 7', 'VN', ODD),
];
