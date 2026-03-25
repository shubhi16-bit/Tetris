import { useState, useEffect } from 'react';
import { createStage } from '../gameHelpers';

export const useStage = (player: any, resetPlayer: () => void) => {
  const [stage, setStage] = useState(createStage());
  const [rowsCleared, setRowsCleared] = useState(0);

  useEffect(() => {
    setRowsCleared(0);

    const sweepRows = (newStage: any[][]) =>
      newStage.reduce((ack, row) => {
        // If a row is full (no 0s), clear it
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          setRowsCleared(prev => prev + 1);
          ack.unshift(new Array(newStage[0].length).fill([0, 'clear']));
          return ack;
        }
        ack.push(row);
        return ack;
      }, []);

    const updateStage = (prevStage: any[][]) => {
      // 1. Refresh the stage (keep merged blocks, clear moving ones)
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'merged' ? cell : [0, 'clear']))
      );

      // 2. Draw the Active Player Piece
      player.tetromino.forEach((row: any[], y: number) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              `${player.collided ? 'merged' : 'clear'}`,
            ];
          }
        });
      });

      // 3. Handle Merging
      if (player.collided) {
        resetPlayer();
        return sweepRows(newStage);
      }
      return newStage;
    };

    setStage(prev => updateStage(prev));
  }, [player, resetPlayer]); 

  return [stage, setStage, rowsCleared] as const;
};