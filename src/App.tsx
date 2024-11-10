import Board from './components/Board';
import UpcomingBlocks from './components/UpcomingBlocks';
import { useTetris } from './hooks/useTetris';

function App() {
  const { board, startGame, endGame, isPlaying, score, upcomingBlocks, handlers } = useTetris();

  return (
    <div className="app" {...handlers}>
      <h1>Tetris</h1>
      <Board currentBoard={board} />
      <div className="controls">
        <h2>Score: {score}</h2>
        {isPlaying ? (
          <>
            <UpcomingBlocks upcomingBlocks={upcomingBlocks} />
            <button onClick={endGame}>End Game</button>
          </>
        ) : (
          <button onClick={startGame}>New Game</button>
        )}
      </div> 
    </div>
  );
}

export default App;
