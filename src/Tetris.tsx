import React, { useState, useEffect, useRef } from 'react';
import './App.css'; 
import { createStage, checkCollision, STAGE_WIDTH, STAGE_HEIGHT, TETROMINOS } from './gameHelpers';
import { useInterval } from './hooks/useInterval';
import { usePlayer } from './hooks/usePlayer';
import { useStage } from './hooks/useStage';

const BENCHMARK_SCORE = 300;

const Tetris: React.FC = () => {
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [floatingScores, setFloatingScores] = useState<{ id: number; val: number }[]>([]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [player, updatePlayerPos, resetPlayer, playerRotate] = usePlayer();
  const [stage, setStage, rowsCleared] = useStage(player, resetPlayer);

  useEffect(() => { gameAreaRef.current?.focus(); }, []);

  useEffect(() => {
    if (score >= BENCHMARK_SCORE && !hasWon) {
      setHasWon(true);
      setGameOver(true);
      setDropTime(null);
    }
  }, [score, hasWon]);

  useEffect(() => {
    if (rowsCleared > 0) {
      const linePoints = [40, 100, 300, 1200];
      const addedPoints = linePoints[rowsCleared - 1];
      setScore(prev => prev + addedPoints);

      const newId = Date.now();
      setFloatingScores(prev => [...prev, { id: newId, val: addedPoints }]);
      setTimeout(() => setFloatingScores(prev => prev.filter(s => s.id !== newId)), 1200);
    }
  }, [rowsCleared]);

  const startGame = () => {
    setStage(createStage());
    setDropTime(800);
    resetPlayer();
    setScore(0);
    setGameOver(false);
    setHasWon(false);
    setTimeout(() => gameAreaRef.current?.focus(), 0);
  };

  const drop = () => {
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) { setGameOver(true); setDropTime(null); }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const move = (e: React.KeyboardEvent) => {
    if (gameOver) return;
    if ([32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();

    if (e.keyCode === 37) movePlayer(-1);
    else if (e.keyCode === 39) movePlayer(1);
    else if (e.keyCode === 40) drop();
    else if (e.keyCode === 38) playerRotate(stage, 1);
    else if (e.keyCode === 32) {
        let potY = 0;
        while (!checkCollision(player, stage, { x: 0, y: potY + 1 })) potY++;
        updatePlayerPos({ x: 0, y: potY, collided: true });
    }
  };

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  useInterval(() => drop(), dropTime);

  return (
    <div ref={gameAreaRef} tabIndex={0} onKeyDown={move} className="tetris-container" style={containerStyle}>
      <div style={layoutWrapperStyle}>
        
        <aside style={sideColumnStyle}>
          <div className="cyber-box">
            <span className="cyber-label">TARGET Score</span>
            <div className="cyber-value" style={{color: '#00ffff'}}>{BENCHMARK_SCORE}</div>
          </div>
          <div className="cyber-box">
            <span className="cyber-label">CURRENT SCORE</span>
            <div className="cyber-value">{score}</div>
          </div>
        </aside>

        <div style={stageContainerStyle}>
          <div style={cornerTL}/><div style={cornerTR}/><div style={cornerBL}/><div style={cornerBR}/>
          
          {floatingScores.map(fs => (
            <div key={fs.id} className="floating-score" style={{ top: '45%', left: '50%' }}>+{fs.val}</div>
          ))}

          <div style={gridStyle}>
            {stage.map((row, y) => row.map((cell, x) => (
                <div key={`${x}-${y}`} className={cell[1] === 'clear' && rowsCleared > 0 ? 'row-clearing' : ''} style={{
                  width: '25px',
                  height: '25px',
                  border: '1px solid rgba(0, 255, 255, 0.1)',
                  background: cell[0] === 0
                    ? 'transparent'
                    : `rgba(${TETROMINOS[cell[0] as keyof typeof TETROMINOS].color}, 0.9)`,
                }} />
            )))}
          </div>

          {(gameOver || !dropTime) && (
            <div style={missionOverlayStyle}>
              {hasWon ? (
                <div className="reward-box-hud">
                  <h3>CONGRATULATIONS !!</h3>
                  <h4 className="unlocked-tag">YOU HAVE UNLOCKED </h4>
                  <div className="unlocked-item">RGB LIGHTS</div>
                  <p className="description">
                    Light-emitting diodes that combine Red, Green, and Blue light to produce a wide range of colors. 
                  </p>
                  <button onClick={startGame} className="start-btn" style={{marginTop: '15px', width: '100%'}}>[ REPLAY ]</button>
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <h2 className="logo-text" style={{fontSize: '1.8rem', color: '#00ffff', marginBottom: '10px'}}>TETRIS</h2>
                  <p style={{fontSize: '0.8rem', marginBottom: '20px', color: '#8899a6'}}>Target Score: {BENCHMARK_SCORE}</p>
                  <button onClick={startGame} className={`start-btn ${gameOver ? 'retry-led' : ''}`}>
                    [ {gameOver ? 'RETRY' : 'START'} ]
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <aside style={sideColumnStyle}>
          <div className="cyber-box">
            <span className="cyber-label">KEY COMMANDS</span>
            <div className="key-row"><span className="key-cyan">↔</span> <span>MOVE</span></div>
            <div className="key-row"><span className="key-cyan">↑</span> <span>ROTATE</span></div>
            <div className="key-row"><span className="key-cyan">↓</span> <span>DROP</span></div>
            <div className="key-row"><span className="key-cyan">SPACE</span> <span>HARD DROP</span></div>
          </div>
        </aside>

      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = { width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#02040a', outline: 'none', overflow: 'hidden' };
const layoutWrapperStyle: React.CSSProperties = { display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'center', justifyContent: 'center' };
const sideColumnStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '180px' };
const stageContainerStyle: React.CSSProperties = { position: 'relative', border: '1px solid rgba(0, 255, 255, 0.2)', background: '#010101', padding: '30px 20px' };
const missionOverlayStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(2, 4, 10, 0.95)', zIndex: 50 };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: `repeat(${STAGE_WIDTH}, 25px)`, gridTemplateRows: `repeat(${STAGE_HEIGHT}, 25px)` };
const cornerTL: React.CSSProperties = { position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderTop: '2px solid #00ffff', borderLeft: '2px solid #00ffff' };
const cornerTR: React.CSSProperties = { position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderTop: '2px solid #00ffff', borderRight: '2px solid #00ffff' };
const cornerBL: React.CSSProperties = { position: 'absolute', bottom: 8, left: 8, width: 12, height: 12, borderBottom: '2px solid #00ffff', borderLeft: '2px solid #00ffff' };
const cornerBR: React.CSSProperties = { position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderBottom: '2px solid #00ffff', borderRight: '2px solid #00ffff' };

export default Tetris;