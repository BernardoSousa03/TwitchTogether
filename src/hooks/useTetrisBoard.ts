import { useReducer, Dispatch } from 'react';
import { Block, BlockShape, BoardShape, EmptyCell, SHAPES } from '../types';
import useReducerTogether from './useReducerTogether.d';
import { useStateTogether, useStateTogetherWithPerUserValues } from 'react-together';

export const BOARD_WIDTH = 20;
export const BOARD_HEIGHT = 20;

type BoardState = {
  board: BoardShape;
};

export function useTetrisBoard(): [BoardState, Dispatch<Action>] {

  const [boardState, dispatchBoardState] = useReducerTogether("boardReducer",
    boardReducer,
    {
      board: [],
    },
  );

  return [boardState, dispatchBoardState];
}

export function getEmptyBoard(height = BOARD_HEIGHT): BoardShape {
  return Array(height)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(EmptyCell.Empty));
}

export function hasCollisions(
  board: BoardShape,
  currentShape: BlockShape,
  row: number,
  column: number
): boolean {
  let hasCollision = false;
  currentShape
    .filter((shapeRow) => shapeRow.some((isSet) => isSet))
    .forEach((shapeRow: boolean[], rowIndex: number) => {
      shapeRow.forEach((isSet: boolean, colIndex: number) => {
        if (
          isSet &&
          (row + rowIndex >= board.length ||
            column + colIndex >= board[0].length ||
            column + colIndex < 0 ||
            board[row + rowIndex][column + colIndex] !== EmptyCell.Empty)
        ) {
          hasCollision = true;
        }
      });
    });
  return hasCollision;
}

export function getRandomBlock(): Block {
  const blockValues = Object.values(Block);
  return blockValues[Math.floor(Math.random() * blockValues.length)] as Block;
}

type Action = {
  type: 'start' | 'drop' | 'commit' | 'move';
  newBoard?: BoardShape;
  newBlock?: Block;
  isPressingLeft?: boolean;
  isPressingRight?: boolean;
  isRotating?: boolean;
};

function boardReducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'start':
      return {
        board: getEmptyBoard(),
      };
    case 'commit':
      return {
        board: [
          ...getEmptyBoard(BOARD_HEIGHT - action.newBoard!.length),
          ...action.newBoard!,
        ],
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }

}
