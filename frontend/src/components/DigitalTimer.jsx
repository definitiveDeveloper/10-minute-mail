import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const segmentPositions = {
  a: { x: 1, y: 0, w: 6, h: 1 },
  b: { x: 7, y: 1, w: 1, h: 6 },
  c: { x: 7, y: 8, w: 1, h: 6 },
  d: { x: 1, y: 14, w: 6, h: 1 },
  e: { x: 0, y: 8, w: 1, h: 6 },
  f: { x: 0, y: 1, w: 1, h: 6 },
  g: { x: 1, y: 7, w: 6, h: 1 },
};

const digitSegments = [
  ['a', 'b', 'c', 'd', 'e', 'f'], // 0
  ['b', 'c'], // 1
  ['a', 'b', 'g', 'e', 'd'], // 2
  ['a', 'b', 'g', 'c', 'd'], // 3
  ['f', 'g', 'b', 'c'], // 4
  ['a', 'f', 'g', 'c', 'd'], // 5
  ['a', 'f', 'g', 'e', 'c', 'd'], // 6
  ['a', 'b', 'c'], // 7
  ['a', 'b', 'c', 'd', 'e', 'f', 'g'], // 8
  ['a', 'b', 'c', 'd', 'f', 'g'], // 9
];

const Digit = ({ number, isBlinking }) => {
  const segments = digitSegments[number] || [];
  return (
    <motion.svg
      viewBox="0 0 9 15"
      className="w-8 h-14 fill-primary"
      initial={{ opacity: 1 }}
      animate={{ opacity: isBlinking ? [1, 0.3, 1] : 1 }}
      transition={isBlinking ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {Object.keys(segmentPositions).map((key) => {
        const pos = segmentPositions[key];
        return (
          <rect
            key={key}
            x={pos.x}
            y={pos.y}
            width={pos.w}
            height={pos.h}
            className={segments.includes(key) ? 'opacity-100' : 'opacity-10'}
          />
        );
      })}
    </motion.svg>
  );
};

const Colon = ({ isBlinking }) => (
  <motion.div 
    className="flex flex-col items-center justify-around h-14 w-4"
    initial={{ opacity: 1 }}
    animate={{ opacity: isBlinking ? [1, 0.3, 1] : 1 }}
    transition={isBlinking ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : {}}
  >
    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
  </motion.div>
);


const DigitalTimer = ({ timeLeftMs }) => {
  const [time, setTime] = useState({ minutes: [0, 0], seconds: [0, 0] });
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const totalSeconds = Math.floor(timeLeftMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    setTime({
      minutes: [Math.floor(minutes / 10), minutes % 10],
      seconds: [Math.floor(seconds / 10), seconds % 10],
    });

    setIsBlinking(timeLeftMs <= 60000 && timeLeftMs > 0); // Blink if 1 minute or less remaining

  }, [timeLeftMs]);

  return (
    <div className="flex items-center justify-center p-2 rounded-lg bg-muted/30 shadow-inner">
      <Digit number={time.minutes[0]} isBlinking={isBlinking && time.minutes[0] === 0 && time.minutes[1] === 0} />
      <Digit number={time.minutes[1]} isBlinking={isBlinking && time.minutes[0] === 0 && time.minutes[1] === 0} />
      <Colon isBlinking={isBlinking} />
      <Digit number={time.seconds[0]} isBlinking={isBlinking} />
      <Digit number={time.seconds[1]} isBlinking={isBlinking} />
    </div>
  );
};

export default DigitalTimer;