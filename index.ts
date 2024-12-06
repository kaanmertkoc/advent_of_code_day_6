async function main() {
  type Space = 'block' | 'space' | 'out';
  type PositionDir = 'up' | 'left' | 'right' | 'down';
  type Position = {
    row: number;
    col: number;
    direction: PositionDir;
  };

  function findStringElementUsingFindIndex(
    array: string[][],
    target: string
  ): Position | null {
    const rowIndex = array.findIndex((row) => row.includes(target));
    if (rowIndex === -1) return null;

    const colIndex = array[rowIndex].findIndex((element) => element === target);
    return { row: rowIndex, col: colIndex, direction: 'up' };
  }

  // To add a new position, create a key from the coordinates
  function addPosition(
    distinctPositions: Map<string, boolean>,
    x: number,
    y: number
  ): void {
    const key = `${x},${y}`; // Create a unique string key from the coordinates
    distinctPositions.set(key, true);
  }

  function rotatePos90(direction: PositionDir): PositionDir {
    switch (direction) {
      case 'up':
        return 'right';
      case 'right':
        return 'down';
      case 'down':
        return 'left';
      case 'left':
        return 'up';
      default:
        return 'up';
    }
  }

  function checkSpace(map: string[][], row: number, col: number): Space {
    // Check both negative values AND upper bounds
    if (row >= 0 && row < map.length && col >= 0 && col < map[0].length) {
      const index = map[row][col];
      return index === '#' ? 'block' : 'space';
    }
    return 'out';
  }

  function move(
    space: Space,
    desiredPosition: Position,
    curPos: Position,
    traversedMap: string[][],
    distinctPositions: Map<string, boolean>
  ): Position | undefined {
    let movPos = desiredPosition;
    if (space === 'space') {
      traversedMap[desiredPosition.row][desiredPosition.col] = 'X';
      addPosition(distinctPositions, desiredPosition.row, desiredPosition.col);
      return movPos;
    } else if (space === 'block') {
      const newDirection = rotatePos90(movPos.direction);
      return {
        ...curPos,
        direction: newDirection,
      };
    } else {
      return undefined;
    }
  }

  // Alternative version with more styling options
  function prettyPrint2DArrayWithIndexesStyled(
    arr: string[][],
    options: {
      cellPadding?: number;
      horizontalLine?: string;
      verticalLine?: string;
      cornerChar?: string;
      indexStyle?: 'numbers' | 'letters';
    } = {}
  ): void {
    const {
      cellPadding = 1,
      horizontalLine = '-',
      verticalLine = '|',
      cornerChar = '+',
      indexStyle = 'numbers',
    } = options;

    // Find the maximum length of any string in the array
    const maxLength = arr.reduce((max, row) => {
      return Math.max(max, ...row.map((str) => str.length));
    }, 0);

    // Calculate total cell width including padding
    const cellWidth = maxLength + cellPadding * 2;
    const rowIndexWidth = arr.length.toString().length;

    // Function to get index representation
    const getIndexChar = (index: number): string => {
      if (indexStyle === 'letters') {
        return String.fromCharCode(65 + index); // A, B, C, ...
      }
      return index.toString();
    };

    // Print column indexes
    const colIndexes =
      ' '.repeat(rowIndexWidth + 4) +
      Array.from({ length: arr[0].length }, (_, i) =>
        getIndexChar(i).padStart(cellWidth, ' ')
      ).join(' ');
    console.log(colIndexes);

    // Create and print the top border
    const border = cornerChar + horizontalLine.repeat(cellWidth) + cornerChar;
    console.log(' '.repeat(rowIndexWidth + 4) + border.repeat(arr[0].length));

    // Print each row
    arr.forEach((row, rowIndex) => {
      // Print the cells of the row
      const formattedRow = row
        .map(
          (cell) =>
            `${verticalLine}${' '.repeat(cellPadding)}${cell.padEnd(
              maxLength
            )}${' '.repeat(cellPadding)}`
        )
        .join('');

      console.log(
        `row ${getIndexChar(rowIndex).padStart(rowIndexWidth)} ` +
          formattedRow +
          verticalLine
      );

      // Print separator after each row
      console.log(' '.repeat(rowIndexWidth + 4) + border.repeat(row.length));
    });
  }

  function traverse(
    map: string[][],
    traversedMap: string[][],
    position: Position,
    distinctPositions: Map<string, boolean>
  ): Position | undefined {
    const { row, col, direction } = position;
    let desiredPosition: Position;
    let checkedSpace: Space;

    // Calculate desired position based on direction
    switch (direction) {
      case 'up':
        desiredPosition = { row: row - 1, col, direction };
        checkedSpace = checkSpace(map, row - 1, col);
        break;
      case 'down':
        desiredPosition = { row: row + 1, col, direction };
        checkedSpace = checkSpace(map, row + 1, col);
        break;
      case 'right':
        desiredPosition = { row, col: col + 1, direction };
        checkedSpace = checkSpace(map, row, col + 1);
        break;
      case 'left':
        desiredPosition = { row, col: col - 1, direction };
        checkedSpace = checkSpace(map, row, col - 1);
        break;
    }

    return move(
      checkedSpace,
      desiredPosition,
      position,
      traversedMap,
      distinctPositions
    );
  }

  function runTraverse(
    foundGuardIndex: Position,
    map: string[][],
    traversedMap: string[][],
    distinctPositions: Map<string, boolean>
  ) {
    let currentPosition = foundGuardIndex;
    let moveCount = 0;
    const maxMoves = map.length * map[0].length * 4; // Prevent infinite loops

    // Keep track of visited positions with their directions
    const visited = new Set<string>();

    while (moveCount < maxMoves) {
      // Create a unique key for this position+direction combination
      const posKey = `${currentPosition.row},${currentPosition.col},${currentPosition.direction}`;

      // If we've seen this exact position and direction before, we're in a loop
      if (visited.has(posKey)) {
        console.log('Loop detected - stopping traverse');
        break;
      }

      visited.add(posKey);

      const traversedPosition = traverse(
        map,
        traversedMap,
        currentPosition,
        distinctPositions
      );
      if (!traversedPosition) {
        console.log('No more valid moves');
        break;
      }

      currentPosition = traversedPosition;
      moveCount++;

      if (moveCount >= maxMoves) {
        console.log('Maximum moves reached');
        break;
      }
    }

    console.log(`Total moves: ${moveCount}`);
    console.log(`Unique positions visited: ${distinctPositions.size}`);
  }

  const path = './input.txt';
  const file = Bun.file(path);
  const stream = file.stream();
  const decoder = new TextDecoder();

  const map: string[][] = [];
  let traversedMap: string[][] = [];
  const distinctPositions = new Map<string, boolean>();

  let remainingData = '';

  for await (const chunk of stream) {
    const str = decoder.decode(chunk);
    remainingData += str;

    let lines = remainingData.split(/\r?\n/);
    while (lines.length > 1) {
      const line = lines.shift()!;
      if (line.trim()) {
        const trimmedLine = line.trim();
        const splitted = trimmedLine.split('');
        map.push(splitted);
      }
    }
    remainingData = lines[0];
  }
  prettyPrint2DArrayWithIndexesStyled(map);
  traversedMap = map;
  const foundGuardIndex = findStringElementUsingFindIndex(map, '^');
  runTraverse(foundGuardIndex!, map, traversedMap, distinctPositions);
  prettyPrint2DArrayWithIndexesStyled(traversedMap);
  console.log(distinctPositions.size);
}
main();
