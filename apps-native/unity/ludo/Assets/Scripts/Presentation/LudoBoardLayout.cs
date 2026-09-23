using UnityEngine;

namespace W3Dev.Ludo
{
    public static class LudoBoardLayout
    {
        public const int BoardCells = 15;
        public const float CellSize = 0.5f;
        public const float BoardWorldSize = BoardCells * CellSize;
        public const float BoardY = 0.32f;

        private static readonly Vector2Int[] TrackCells =
        {
            new(-7, 0), new(-7, 1), new(-6, 1), new(-5, 1), new(-4, 1), new(-3, 1), new(-2, 1),
            new(-1, 2), new(-1, 3), new(-1, 4), new(-1, 5), new(-1, 6), new(-1, 7),
            new(0, 7), new(1, 7), new(1, 6), new(1, 5), new(1, 4), new(1, 3), new(1, 2),
            new(2, 1), new(3, 1), new(4, 1), new(5, 1), new(6, 1), new(7, 1),
            new(7, 0), new(7, -1), new(6, -1), new(5, -1), new(4, -1), new(3, -1), new(2, -1),
            new(1, -2), new(1, -3), new(1, -4), new(1, -5), new(1, -6), new(1, -7),
            new(0, -7), new(-1, -7), new(-1, -6), new(-1, -5), new(-1, -4), new(-1, -3), new(-1, -2),
            new(-2, -1), new(-3, -1), new(-4, -1), new(-5, -1), new(-6, -1), new(-7, -1)
        };

        private static readonly Vector2Int[][] HomeCells =
        {
            new[] { new Vector2Int(-6, 0), new Vector2Int(-5, 0), new Vector2Int(-4, 0), new Vector2Int(-3, 0), new Vector2Int(-2, 0), new Vector2Int(-1, 0) },
            new[] { new Vector2Int(0, 6), new Vector2Int(0, 5), new Vector2Int(0, 4), new Vector2Int(0, 3), new Vector2Int(0, 2), new Vector2Int(0, 1) },
            new[] { new Vector2Int(6, 0), new Vector2Int(5, 0), new Vector2Int(4, 0), new Vector2Int(3, 0), new Vector2Int(2, 0), new Vector2Int(1, 0) },
            new[] { new Vector2Int(0, -6), new Vector2Int(0, -5), new Vector2Int(0, -4), new Vector2Int(0, -3), new Vector2Int(0, -2), new Vector2Int(0, -1) }
        };

        public static Vector3 TrackPosition(int index)
        {
            return GridPosition(TrackCells[Mathf.Abs(index) % TrackCells.Length], BoardY + 0.08f);
        }

        public static Vector3 HomePosition(int player, int index)
        {
            return GridPosition(HomeCells[player][Mathf.Clamp(index, 0, HomeCells[player].Length - 1)], BoardY + 0.08f);
        }

        public static Vector3 YardCenter(int player)
        {
            return player switch
            {
                0 => GridPosition(new Vector2Int(-4, 4), BoardY + 0.08f),
                1 => GridPosition(new Vector2Int(4, 4), BoardY + 0.08f),
                2 => GridPosition(new Vector2Int(4, -4), BoardY + 0.08f),
                _ => GridPosition(new Vector2Int(-4, -4), BoardY + 0.08f)
            };
        }

        public static Vector3 YardPosition(int player, int token)
        {
            var center = YardCenter(player);
            var offset = new Vector3(token % 2 == 0 ? -0.42f : 0.42f, 0f, token < 2 ? -0.42f : 0.42f);
            return center + offset;
        }

        public static Vector3 PositionFor(LudoTokenState token)
        {
            var position = token.location switch
            {
                LudoTokenLocation.Track => TrackPosition(token.TrackIndex()),
                LudoTokenLocation.Home => HomePosition(token.player, token.position),
                LudoTokenLocation.Finished => FinishPosition(token.token),
                _ => YardPosition(token.player, token.token)
            };
            return token.location == LudoTokenLocation.Yard ? position : position + StackOffset(token.token);
        }

        public static bool TryGetTrackCell(int index, out Vector2Int cell)
        {
            if (index < 0 || index >= TrackCells.Length)
            {
                cell = default;
                return false;
            }
            cell = TrackCells[index];
            return true;
        }

        public static bool TryGetHomeCell(int player, int index, out Vector2Int cell)
        {
            if (player < 0 || player >= HomeCells.Length || index < 0 || index >= HomeCells[player].Length)
            {
                cell = default;
                return false;
            }
            cell = HomeCells[player][index];
            return true;
        }

        public static bool IsCrossCell(Vector2Int cell)
        {
            return Mathf.Abs(cell.x) <= 1 || Mathf.Abs(cell.y) <= 1;
        }

        public static bool IsHomeCell(Vector2Int cell, out int player, out int index)
        {
            for (var playerIndex = 0; playerIndex < HomeCells.Length; playerIndex++)
            {
                for (var cellIndex = 0; cellIndex < HomeCells[playerIndex].Length; cellIndex++)
                {
                    if (HomeCells[playerIndex][cellIndex] == cell)
                    {
                        player = playerIndex;
                        index = cellIndex;
                        return true;
                    }
                }
            }
            player = -1;
            index = -1;
            return false;
        }

        public static Color PlayerColor(int player)
        {
            return player switch
            {
                0 => new Color(0.78f, 0.16f, 0.25f),
                1 => new Color(0.08f, 0.56f, 0.34f),
                2 => new Color(0.93f, 0.61f, 0.08f),
                _ => new Color(0.09f, 0.40f, 0.80f)
            };
        }

        public static string PlayerName(int player)
        {
            return player switch
            {
                0 => "Ruby",
                1 => "Jade",
                2 => "Sun",
                _ => "Azure"
            };
        }

        private static Vector3 GridPosition(Vector2Int cell, float y)
        {
            return new Vector3(cell.x * CellSize, y, cell.y * CellSize);
        }

        private static Vector3 FinishPosition(int token)
        {
            return new Vector3(0f, BoardY + 0.1f, 0f) + StackOffset(token);
        }

        private static Vector3 StackOffset(int token)
        {
            var x = token % 2 == 0 ? -0.11f : 0.11f;
            var z = token < 2 ? -0.11f : 0.11f;
            return new Vector3(x, token >= 2 ? 0.08f : 0f, z);
        }
    }
}
