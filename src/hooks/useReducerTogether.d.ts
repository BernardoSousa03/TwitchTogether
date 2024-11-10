import { useReducer, Dispatch, Reducer, ReducerState, ReducerAction } from 'react';
import { useStateTogether } from 'react-together';


function useReducerTogether<R extends Reducer<any, any>>(
  rtKey: string,
  reducer: R,
  initialState: ReducerState<R>
): [ReducerState<R>, Dispatch<ReducerAction<R>>] {
  // Use useStateTogether to synchronize the state
  const [state, setState] = useStateTogether(rtKey, initialState);

  // Create a dispatch function that applies the reducer and updates the state
  const dispatch: Dispatch<ReducerAction<R>> = (action) => {
    setState((prevState: ReducerState<R>) => reducer(prevState, action));
  };

  return [state, dispatch];
}

export default useReducerTogether;
