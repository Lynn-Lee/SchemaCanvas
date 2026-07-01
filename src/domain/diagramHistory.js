import { applyCommand } from "./diagramCommands";

export function createHistoryState(diagram) {
  return {
    current: diagram,
    undoStack: [],
    redoStack: [],
  };
}

function executeCommand(state, command) {
  const result = applyCommand(state.current, command);

  return {
    current: result.diagram,
    undoStack: [
      ...state.undoStack,
      {
        command,
        inverseCommand: result.inverseCommand,
      },
    ],
    redoStack: [],
  };
}

function undo(state) {
  const entry = state.undoStack.at(-1);
  if (!entry) return state;

  const result = applyCommand(state.current, entry.inverseCommand);

  return {
    current: result.diagram,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [
      ...state.redoStack,
      {
        command: entry.command,
        inverseCommand: result.inverseCommand,
      },
    ],
  };
}

function redo(state) {
  const entry = state.redoStack.at(-1);
  if (!entry) return state;

  const result = applyCommand(state.current, entry.command);

  return {
    current: result.diagram,
    undoStack: [
      ...state.undoStack,
      {
        command: entry.command,
        inverseCommand: result.inverseCommand,
      },
    ],
    redoStack: state.redoStack.slice(0, -1),
  };
}

export function dispatchHistory(state, command) {
  if (command.type === "history.undo") return undo(state);
  if (command.type === "history.redo") return redo(state);
  return executeCommand(state, command);
}
