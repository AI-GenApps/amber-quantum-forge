using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo.Editor
{
    public static class LudoFlowBoardIllustration
    {
        private static readonly Color Ivory = new Color(0.969f, 0.941f, 0.894f, 1f);
        private static readonly Color Ink = new Color(0.102f, 0.161f, 0.251f, 1f);
        private static readonly Color Ruby = new Color(0.898f, 0.231f, 0.290f, 1f);
        private static readonly Color Jade = new Color(0.129f, 0.714f, 0.451f, 1f);
        private static readonly Color Sun = new Color(0.961f, 0.784f, 0.294f, 1f);
        private static readonly Color Azure = new Color(0.176f, 0.659f, 0.902f, 1f);
        private static readonly Color Brass = new Color(0.843f, 0.659f, 0.243f, 1f);

        public static GameObject Build(Transform parent, string name, int step)
        {
            var board = new GameObject(name, typeof(RectTransform), typeof(Image));
            board.transform.SetParent(parent, false);
            SetRect(board.GetComponent<RectTransform>(), new Vector2(0.08f, 0.42f), new Vector2(0.92f, 0.78f));
            var boardImage = board.GetComponent<Image>();
            boardImage.color = Ivory;
            boardImage.sprite = LudoFlowUiAssets.RoundedPanelSprite();
            boardImage.type = Image.Type.Sliced;
            var outline = board.AddComponent<Outline>();
            outline.effectColor = new Color(0.843f, 0.659f, 0.243f, 0.9f);
            outline.effectDistance = new Vector2(2f, 2f);

            AddYardPanel(board.transform, new Vector2(0.04f, 0.56f), Ruby, "RubyYard");
            AddYardPanel(board.transform, new Vector2(0.56f, 0.56f), Jade, "JadeYard");
            AddYardPanel(board.transform, new Vector2(0.56f, 0.04f), Sun, "SunYard");
            AddYardPanel(board.transform, new Vector2(0.04f, 0.04f), Azure, "AzureYard");

            var gridObject = new GameObject("ClassicCrossGrid", typeof(RectTransform), typeof(GridLayoutGroup));
            gridObject.transform.SetParent(board.transform, false);
            SetRect(gridObject.GetComponent<RectTransform>(), new Vector2(0.035f, 0.035f), new Vector2(0.965f, 0.965f));
            var grid = gridObject.GetComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(49f, 49f);
            grid.spacing = new Vector2(1f, 1f);
            grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            grid.constraintCount = 15;
            grid.childAlignment = TextAnchor.MiddleCenter;
            for (var y = 14; y >= 0; y--)
            {
                for (var x = 0; x < 15; x++)
                    AddCell(gridObject.transform, x, y, step);
            }

            AddYardSpots(board.transform, new Vector2(0.08f, 0.58f), Ruby, "Ruby");
            AddYardSpots(board.transform, new Vector2(0.60f, 0.58f), Jade, "Jade");
            AddYardSpots(board.transform, new Vector2(0.60f, 0.08f), Sun, "Sun");
            AddYardSpots(board.transform, new Vector2(0.08f, 0.08f), Azure, "Azure");
            AddStepMarker(board.transform, step);
            return board;
        }

        private static void AddCell(Transform parent, int x, int y, int step)
        {
            var cell = new GameObject($"Cell_{x}_{y}", typeof(RectTransform), typeof(Image));
            cell.transform.SetParent(parent, false);
            var image = cell.GetComponent<Image>();
            image.color = IsCrossCell(x, y) ? CellColor(x, y, step) : Color.clear;
            image.raycastTarget = false;
            if (!IsCrossCell(x, y))
                return;
            if (IsHighlighted(x, y, step))
            {
                var highlight = cell.AddComponent<Outline>();
                highlight.effectColor = step == 2 ? Brass : Color.white;
                highlight.effectDistance = new Vector2(2f, 2f);
            }
        }

        private static Color CellColor(int x, int y, int step)
        {
            var color = Ivory;
            if (x == 7 && y >= 9)
                color = Jade;
            else if (x == 7 && y <= 5)
                color = Azure;
            else if (y == 7 && x <= 5)
                color = Ruby;
            else if (y == 7 && x >= 9)
                color = Sun;
            else if (x >= 6 && x <= 8 && y >= 6 && y <= 8)
                color = CenterColor(x, y);

            if (IsHighlighted(x, y, step))
                color = Color.Lerp(color, step == 2 ? Brass : Color.white, 0.42f);
            if (IsSafeCell(x, y))
                color = Color.Lerp(color, Brass, 0.3f);
            return color;
        }

        private static Color CenterColor(int x, int y)
        {
            if (x == 7 && y == 7)
                return Ivory;
            if (x == 6)
                return y >= 7 ? Ruby : Azure;
            if (x == 8)
                return y >= 7 ? Jade : Sun;
            return y > 7 ? Jade : Azure;
        }

        private static bool IsHighlighted(int x, int y, int step)
        {
            return step switch
            {
                0 => x >= 6 && x <= 8 && y == 5,
                1 => x == 7 && y >= 5 && y <= 9,
                _ => x >= 6 && x <= 8 && y >= 6 && y <= 8
            };
        }

        private static bool IsSafeCell(int x, int y)
        {
            return (x == 7 && y == 4) || (x == 10 && y == 7) || (x == 7 && y == 10) || (x == 4 && y == 7);
        }

        private static void AddYardPanel(Transform parent, Vector2 origin, Color color, string name)
        {
            var yard = new GameObject(name, typeof(RectTransform), typeof(Image));
            yard.transform.SetParent(parent, false);
            SetRect(yard.GetComponent<RectTransform>(), origin, origin + new Vector2(0.38f, 0.38f));
            var image = yard.GetComponent<Image>();
            image.sprite = LudoFlowUiAssets.RoundedPanelSprite();
            image.type = Image.Type.Sliced;
            image.color = Color.Lerp(color, Ink, 0.14f);
            image.raycastTarget = false;
        }

        private static void AddYardSpots(Transform parent, Vector2 origin, Color color, string name)
        {
            for (var index = 0; index < 4; index++)
            {
                var x = origin.x + (index % 2) * 0.15f;
                var y = origin.y + (index / 2) * 0.15f;
                var spot = new GameObject($"{name}Pawn_{index + 1}", typeof(RectTransform), typeof(Image));
                spot.transform.SetParent(parent, false);
                SetRect(spot.GetComponent<RectTransform>(), new Vector2(x, y), new Vector2(x + 0.095f, y + 0.095f));
                var image = spot.GetComponent<Image>();
                image.sprite = LudoFlowUiAssets.CircleSprite();
                image.color = Color.Lerp(color, Color.white, 0.18f);
                var outline = spot.AddComponent<Outline>();
                outline.effectColor = Color.white;
                outline.effectDistance = new Vector2(2f, 2f);
            }
        }

        private static void AddStepMarker(Transform parent, int step)
        {
            var die = new GameObject("StepDie", typeof(RectTransform), typeof(Image));
            die.transform.SetParent(parent, false);
            SetRect(die.GetComponent<RectTransform>(), new Vector2(0.43f, 0.86f), new Vector2(0.57f, 0.96f));
            var dieImage = die.GetComponent<Image>();
            dieImage.sprite = LudoFlowUiAssets.RoundedPanelSprite();
            dieImage.type = Image.Type.Sliced;
            dieImage.color = Ivory;
            dieImage.raycastTarget = false;
            var value = step == 0 ? 6 : step == 1 ? 3 : 1;
            AddPips(die.transform, value);
        }

        private static void AddPips(Transform parent, int value)
        {
            var positions = new[]
            {
                new Vector2(0.22f, 0.22f), new Vector2(0.50f, 0.22f), new Vector2(0.78f, 0.22f),
                new Vector2(0.22f, 0.50f), new Vector2(0.50f, 0.50f), new Vector2(0.78f, 0.50f),
                new Vector2(0.22f, 0.78f), new Vector2(0.50f, 0.78f), new Vector2(0.78f, 0.78f)
            };
            var indices = value switch
            {
                1 => new[] { 4 },
                3 => new[] { 0, 4, 8 },
                _ => new[] { 0, 2, 3, 5, 6, 8 }
            };
            for (var index = 0; index < indices.Length; index++)
            {
                var pip = new GameObject($"Pip_{index + 1}", typeof(RectTransform), typeof(Image));
                pip.transform.SetParent(parent, false);
                var center = positions[indices[index]];
                SetRect(pip.GetComponent<RectTransform>(), center - new Vector2(0.09f, 0.09f), center + new Vector2(0.09f, 0.09f));
                var image = pip.GetComponent<Image>();
                image.sprite = LudoFlowUiAssets.CircleSprite();
                image.color = Ink;
                image.raycastTarget = false;
            }
        }

        private static bool IsCrossCell(int x, int y)
        {
            return (x >= 6 && x <= 8) || (y >= 6 && y <= 8);
        }

        private static void SetRect(RectTransform rect, Vector2 min, Vector2 max)
        {
            rect.anchorMin = min;
            rect.anchorMax = max;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
        }
    }
}
