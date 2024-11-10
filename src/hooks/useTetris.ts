import { useCallback, useEffect } from 'react';
import { useMyId, useStateTogether, useStateTogetherWithPerUserValues } from 'react-together';
import { Block, BlockShape, BoardShape, EmptyCell, SHAPES } from '../types';
import { useInterval } from './useInterval';
import { useSwipeable } from 'react-swipeable'; // Add this import
import {
  useTetrisBoard,
  hasCollisions,
  BOARD_HEIGHT,
  getEmptyBoard,
  getRandomBlock,
} from './useTetrisBoard';

enum TickSpeed {
  Normal = 800,
  Sliding = 100,
  Fast = 50,
}

export function useTetris() {
  const [score, setScore] = useStateTogether("score", 0);
  const [upcomingBlocks, setUpcomingBlocks] = useStateTogether("upcomingBlocks", <Block[]>([]));
  const [isCommitting, setIsCommitting] = useStateTogether("isCommitting", false);
  const [isPlaying, setIsPlaying] = useStateTogether("isPlaying", false);
  const [tickSpeed, setTickSpeed] = useStateTogether("tickSpeed", <TickSpeed | null>(null));

  const [dropping, setDropping, allDropping] = useStateTogetherWithPerUserValues("dropping", {row: 0, column: 3, block: Block.I, shape: SHAPES.I.shape});

  const myId = useMyId();

  const [
    { board },
    dispatchBoardState,
  ] = useTetrisBoard();

  const startGame = useCallback(() => {
    const startingBlocks = [
      getRandomBlock(),
      getRandomBlock(),
      getRandomBlock(),
    ];
    setScore(0);
    setUpcomingBlocks(startingBlocks);
    setIsCommitting(false);
    setIsPlaying(true);
    setTickSpeed(TickSpeed.Normal);

    dispatchBoardState({ type: 'start' });
  }, [dispatchBoardState]);

  const commitPosition = useCallback(() => {
    if (!hasCollisions(board, dropping.shape, dropping.row + 1, dropping.column)) {
      setIsCommitting(false);
      setTickSpeed(TickSpeed.Normal);
      return;
    }

    const newBoard = structuredClone(board) as BoardShape;
    addShapeToBoard(
      newBoard,
      dropping.block,
      dropping.shape,
      dropping.row,
      dropping.column
    );

    let numCleared = 0;
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
      if (newBoard[row].every((entry) => entry !== EmptyCell.Empty)) {
        numCleared++;
        newBoard.splice(row, 1);
      }
    }

    const newUpcomingBlocks = structuredClone(upcomingBlocks) as Block[];
    const newBlock = newUpcomingBlocks.pop() as Block;
    newUpcomingBlocks.unshift(getRandomBlock());

    if (hasCollisions(board, SHAPES[newBlock].shape, 0, 3)) {
      setIsPlaying(false);
      setTickSpeed(null);
    } else {
      setTickSpeed(TickSpeed.Normal);
    }
    setUpcomingBlocks(newUpcomingBlocks);
    setScore((prevScore) => prevScore + getPoints(numCleared));
    dispatchBoardState({
      type: 'commit',
      newBoard: [...getEmptyBoard(BOARD_HEIGHT - newBoard.length), ...newBoard],
      newBlock,
    });
    setDropping({row: 0, column: 3, block: newBlock!, shape: SHAPES[newBlock!].shape});

    setIsCommitting(false);
  }, [
    board,
    dispatchBoardState,
    dropping,
    upcomingBlocks,
  ]);

  const gameTick = useCallback(() => {
    if (isCommitting) {
      commitPosition();
    } else if (
      hasCollisions(board, dropping.shape, dropping.row + 1, dropping.column)
    ) {
      setTickSpeed(TickSpeed.Sliding);
      setIsCommitting(true);
    } else {
      setDropping((value) => ({...value, row: value.row + 1}));
    }
  }, [
    board,
    commitPosition,
    dispatchBoardState,
    dropping,
    isCommitting,
  ]);

  function rotateBlock(shape: BlockShape): BlockShape {
    const rows = shape.length;
    const columns = shape[0].length;
  
    const rotated = Array(rows)
      .fill(null)
      .map(() => Array(columns).fill(false));
  
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        rotated[column][rows - 1 - row] = shape[row][column];
      }
    }
  
    return rotated;
  }

  const move = useCallback((isPressingLeft : boolean, isPressingRight : boolean, isRotating : boolean) => {
    const rotatedShape = isRotating
        ? rotateBlock(dropping.shape)
        : dropping.shape;
      let columnOffset = isPressingLeft ? -1 : 0;
      columnOffset = isPressingRight ? 1 : columnOffset;
      if (
        !hasCollisions(
          board,
          rotatedShape,
          dropping.row,
          dropping.column + columnOffset
        )
      ) {
        setDropping((prev) => ({...prev, column: prev.column + columnOffset, shape: rotatedShape}));
      }
    },
    [board, dropping]
  );

  const handlers = useSwipeable({
    onSwipedLeft: () => move(true, false, false),
    onSwipedRight: () => move(false, true, false),
    onSwipedUp: () => move(false, false, true),
    onSwipedDown: () => setTickSpeed(TickSpeed.Fast),
  });

  useInterval(() => {
    if (!isPlaying) {
      return;
    }
    gameTick();
  }, tickSpeed);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let isPressingLeft = false;
    let isPressingRight = false;
    let moveIntervalID: number | undefined;

    const updateMovementInterval = () => {
      clearInterval(moveIntervalID);
      move(isPressingLeft, isPressingRight, false);
      moveIntervalID = setInterval(() => {
        move(isPressingLeft, isPressingRight, false);
      }, 300);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === 'ArrowDown') {
        setTickSpeed(TickSpeed.Fast);
      }

      if (event.key === 'ArrowUp') {
        move(false, false, true);
      }

      if (event.key === 'ArrowLeft') {
        isPressingLeft = true;
        updateMovementInterval();
      }

      if (event.key === 'ArrowRight') {
        isPressingRight = true;
        updateMovementInterval();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        setTickSpeed(TickSpeed.Normal);
      }

      if (event.key === 'ArrowLeft') {
        isPressingLeft = false;
        updateMovementInterval();
      }

      if (event.key === 'ArrowRight') {
        isPressingRight = false;
        updateMovementInterval();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      clearInterval(moveIntervalID);
      setTickSpeed(TickSpeed.Normal);
    };
  }, [dispatchBoardState, isPlaying]);

  const renderedBoard = structuredClone(board) as BoardShape;
  if (isPlaying) {
    console.log("dropping", dropping);
    Object.entries(allDropping).forEach(([id, itemDropping]) => {
      addShapeToBoard(
        renderedBoard,
        itemDropping.block,
        itemDropping.shape,
        itemDropping.row,
        itemDropping.column
      );
    });
  }

  return {
    board: renderedBoard,
    startGame,
    isPlaying,
    score,
    upcomingBlocks,
    handlers, // Return handlers for swipeable
  };
}

function getPoints(numCleared: number): number {
  switch (numCleared) {
    case 0:
      return 0;
    case 1:
      return 100;
    case 2:
      return 300;
    case 3:
      return 500;
    case 4:
      return 800;
    default:
      throw new Error('Unexpected number of rows cleared');
  }
}

function addShapeToBoard(
  board: BoardShape,
  droppingBlock: Block,
  droppingShape: BlockShape,
  droppingRow: number,
  droppingColumn: number
) {
  if (droppingShape) {
    droppingShape
      .filter((row) => row.some((isSet) => isSet))
      .forEach((row: boolean[], rowIndex: number) => {
        row.forEach((isSet: boolean, colIndex: number) => {
          if (isSet) {
            board[droppingRow + rowIndex][droppingColumn + colIndex] =
              droppingBlock;
          }
        });
      });
  }
}
