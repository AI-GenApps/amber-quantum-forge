using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo.Editor
{
    public sealed class LudoGameplayHud
    {
        public GameObject root;
        public Button rollButton;
        public Button menuButton;
        public Toggle reducedMotionToggle;
        public Button restartButton;
        public Text status;
        public Text turn;
        public Text roll;
        public Text phase;
        public LudoDieView die;
        public LudoGameplayHudView runtime;
        public GameObject[] seatCards;
        public Text[] seatLabels;
    }

    public static class LudoGameplayHudBuilder
    {
        private static readonly Color Navy = new Color(0.035f, 0.07f, 0.14f, 0.96f);
        private static readonly Color Blue = new Color(0.08f, 0.3f, 0.76f, 0.98f);
        private static readonly Color Ivory = new Color(0.94f, 0.92f, 0.84f, 1f);
        private static readonly Color Ink = new Color(0.04f, 0.07f, 0.13f, 1f);
        private static readonly Color Muted = new Color(0.68f, 0.78f, 0.94f, 1f);

        public static LudoGameplayHud Build()
        {
            var root = new GameObject("GameplayHUD", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster), typeof(CanvasGroup));
            root.GetComponent<RectTransform>().localScale = Vector3.one;
            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 20;
            var scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080f, 2400f);
            scaler.matchWidthOrHeight = 0.5f;
            var safe = new GameObject("SafeContent", typeof(RectTransform), typeof(LudoFlowSafeArea));
            safe.transform.SetParent(root.transform, false);
            SetRect(safe.GetComponent<RectTransform>(), Vector2.zero, Vector2.one);

            var topBar = AddPanel(safe.transform, "TopBar", new Vector2(0.035f, 0.895f), new Vector2(0.965f, 0.985f), Navy);
            var turn = AddText(safe.transform, "Turn", "YOUR TURN", 34, new Vector2(0.075f, 0.91f), new Vector2(0.52f, 0.975f), Color.white, TextAnchor.MiddleLeft);
            var phase = AddText(safe.transform, "Phase", "ROLL", 22, new Vector2(0.51f, 0.91f), new Vector2(0.76f, 0.975f), Muted, TextAnchor.MiddleRight);
            var menuButton = AddButton(topBar.transform, "MenuButton", "MENU", new Vector2(0.79f, 0.16f), new Vector2(0.98f, 0.84f), Blue, 15);
            BuildPlayerStrip(safe.transform, out var seatCards, out var seatLabels);
            var status = AddText(safe.transform, "Status", "Roll the die to bring a token onto the track.", 22, new Vector2(0.06f, 0.715f), new Vector2(0.94f, 0.77f), Color.white, TextAnchor.MiddleCenter);
            var rail = AddPanel(safe.transform, "ActionRail", new Vector2(0.06f, 0.035f), new Vector2(0.94f, 0.215f), new Color(0.035f, 0.07f, 0.14f, 0.98f));
            var dieButton = AddDieButton(rail.transform, out var die);
            var hint = AddText(rail.transform, "RollHint", "TAP TO ROLL", 17, new Vector2(0.64f, 0.27f), new Vector2(0.95f, 0.73f), Muted, TextAnchor.MiddleCenter);
            hint.resizeTextForBestFit = true;
            hint.resizeTextMinSize = 12;
            hint.resizeTextMaxSize = 17;
            var roll = AddText(safe.transform, "Roll", "READY TO ROLL", 19, new Vector2(0.67f, 0.73f), new Vector2(0.94f, 0.78f), Muted, TextAnchor.MiddleCenter);
            var restartButton = AddButton(safe.transform, "RestartButton", "NEW TABLE", Vector2.zero, new Vector2(0.01f, 0.01f), Navy, 12);
            restartButton.gameObject.SetActive(false);
            var motionToggle = AddToggle(safe.transform, "ReducedMotion", "REDUCED MOTION", Vector2.zero, new Vector2(0.01f, 0.01f));
            motionToggle.gameObject.SetActive(false);
            var runtime = root.AddComponent<LudoGameplayHudView>();
            return new LudoGameplayHud
            {
                root = root,
                rollButton = dieButton,
                menuButton = menuButton,
                reducedMotionToggle = motionToggle,
                restartButton = restartButton,
                status = status,
                turn = turn,
                roll = roll,
                phase = phase,
                die = die,
                runtime = runtime,
                seatCards = seatCards,
                seatLabels = seatLabels
            };
        }

        public static void Bind(LudoBoardController controller, LudoTokenView[] tokens, LudoGameplayHud hud, LudoFeedback feedback)
        {
            var serialized = new SerializedObject(controller);
            var array = serialized.FindProperty("tokenViews");
            array.arraySize = tokens.Length;
            for (var index = 0; index < tokens.Length; index++)
                array.GetArrayElementAtIndex(index).objectReferenceValue = tokens[index];
            SetReference(serialized, "rollButton", hud.rollButton);
            SetReference(serialized, "reducedMotionToggle", hud.reducedMotionToggle);
            SetReference(serialized, "restartButton", hud.restartButton);
            SetReference(serialized, "statusText", hud.status);
            SetReference(serialized, "turnText", hud.turn);
            SetReference(serialized, "rollText", hud.roll);
            SetReference(serialized, "phaseText", hud.phase);
            SetReference(serialized, "dieView", hud.die);
            SetReference(serialized, "feedback", feedback);
            serialized.ApplyModifiedPropertiesWithoutUndo();
            hud.runtime.Configure(controller, hud.menuButton, hud.seatCards, hud.seatLabels);
        }

        private static void BuildPlayerStrip(Transform parent, out GameObject[] cards, out Text[] labels)
        {
            var strip = AddPanel(parent, "PlayerRail", new Vector2(0.05f, 0.79f), new Vector2(0.95f, 0.85f), new Color(0.03f, 0.08f, 0.16f, 0.9f));
            cards = new GameObject[4];
            labels = new Text[4];
            for (var player = 0; player < cards.Length; player++)
            {
                var min = new Vector2(0.03f + player * 0.245f, 0.14f);
                var max = new Vector2(0.22f + player * 0.245f, 0.86f);
                var card = AddPanel(strip.transform, "Seat " + player, min, max, LudoBoardLayout.PlayerColor(player));
                card.GetComponent<Image>().raycastTarget = false;
                var label = AddText(card.transform, "Identity", "—", 19, Vector2.zero, Vector2.one, Color.white, TextAnchor.MiddleCenter);
                label.color = player == 2 ? Ink : Color.white;
                label.raycastTarget = false;
                label.resizeTextForBestFit = true;
                label.resizeTextMinSize = 12;
                label.resizeTextMaxSize = 19;
                cards[player] = card;
                labels[player] = label;
            }
        }

        private static Button AddDieButton(Transform parent, out LudoDieView die)
        {
            var panel = AddPanel(parent, "DieButton", Vector2.zero, Vector2.zero, Ivory);
            var rect = panel.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(124f, 124f);
            rect.anchoredPosition = new Vector2(0f, 4f);
            var button = panel.AddComponent<Button>();
            button.targetGraphic = panel.GetComponent<Image>();
            var colors = button.colors;
            colors.highlightedColor = Color.Lerp(Ivory, Color.white, 0.18f);
            colors.pressedColor = Color.Lerp(Ivory, Color.black, 0.12f);
            button.colors = colors;
            var faceRoot = new GameObject("DieFace", typeof(RectTransform));
            faceRoot.transform.SetParent(panel.transform, false);
            SetRect(faceRoot.GetComponent<RectTransform>(), Vector2.zero, Vector2.one);
            die = panel.AddComponent<LudoDieView>();
            die.Configure(faceRoot.transform, null, BuildUiDieFaces(faceRoot.transform), true);
            return button;
        }

        private static GameObject[] BuildUiDieFaces(Transform parent)
        {
            var patterns = new[]
            {
                new[] { new Vector2(0f, 0f) },
                new[] { new Vector2(-1f, 1f), new Vector2(1f, -1f) },
                new[] { new Vector2(-1f, 1f), new Vector2(0f, 0f), new Vector2(1f, -1f) },
                new[] { new Vector2(-1f, 1f), new Vector2(1f, 1f), new Vector2(-1f, -1f), new Vector2(1f, -1f) },
                new[] { new Vector2(-1f, 1f), new Vector2(1f, 1f), new Vector2(0f, 0f), new Vector2(-1f, -1f), new Vector2(1f, -1f) },
                new[] { new Vector2(-1f, 1f), new Vector2(-1f, 0f), new Vector2(-1f, -1f), new Vector2(1f, 1f), new Vector2(1f, 0f), new Vector2(1f, -1f) }
            };
            var faces = new GameObject[patterns.Length];
            for (var faceIndex = 0; faceIndex < patterns.Length; faceIndex++)
            {
                var face = new GameObject("Face " + (faceIndex + 1), typeof(RectTransform));
                face.transform.SetParent(parent, false);
                SetRect(face.GetComponent<RectTransform>(), Vector2.zero, Vector2.one);
                face.SetActive(faceIndex == 0);
                for (var pipIndex = 0; pipIndex < patterns[faceIndex].Length; pipIndex++)
                    AddPip(face.transform, patterns[faceIndex][pipIndex]);
                faces[faceIndex] = face;
            }
            return faces;
        }

        private static void AddPip(Transform parent, Vector2 point)
        {
            var pip = new GameObject("Pip", typeof(RectTransform), typeof(Image));
            pip.transform.SetParent(parent, false);
            var rect = pip.GetComponent<RectTransform>();
            var center = new Vector2(0.5f + point.x * 0.22f, 0.5f + point.y * 0.22f);
            rect.anchorMin = center;
            rect.anchorMax = center;
            rect.sizeDelta = new Vector2(17f, 17f);
            rect.anchoredPosition = Vector2.zero;
            var image = pip.GetComponent<Image>();
            image.sprite = LudoFlowUiAssets.RoundedPanelSprite();
            image.type = Image.Type.Sliced;
            image.color = Ink;
            image.raycastTarget = false;
        }

        private static Text AddText(Transform parent, string name, string value, int size, Vector2 min, Vector2 max, Color color, TextAnchor anchor)
        {
            var objectValue = new GameObject(name, typeof(RectTransform), typeof(Text));
            objectValue.transform.SetParent(parent, false);
            SetRect(objectValue.GetComponent<RectTransform>(), min, max);
            var text = objectValue.GetComponent<Text>();
            text.text = value;
            text.font = LudoFlowUiAssets.FlowFont();
            text.fontSize = size;
            text.fontStyle = FontStyle.Bold;
            text.color = color;
            text.alignment = anchor;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Truncate;
            return text;
        }

        private static GameObject AddPanel(Transform parent, string name, Vector2 min, Vector2 max, Color color)
        {
            var panel = new GameObject(name, typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(parent, false);
            SetRect(panel.GetComponent<RectTransform>(), min, max);
            var image = panel.GetComponent<Image>();
            image.sprite = LudoFlowUiAssets.RoundedPanelSprite();
            image.type = Image.Type.Sliced;
            image.color = color;
            var outline = panel.AddComponent<Outline>();
            outline.effectColor = new Color(0.22f, 0.48f, 0.82f, 0.3f);
            outline.effectDistance = new Vector2(1f, 1f);
            return panel;
        }

        private static Button AddButton(Transform parent, string name, string label, Vector2 min, Vector2 max, Color color, int fontSize)
        {
            var panel = AddPanel(parent, name, min, max, color);
            var button = panel.AddComponent<Button>();
            button.targetGraphic = panel.GetComponent<Image>();
            var colors = button.colors;
            colors.highlightedColor = Color.Lerp(color, Color.white, 0.15f);
            colors.pressedColor = Color.Lerp(color, Color.black, 0.2f);
            button.colors = colors;
            var text = AddText(panel.transform, "Label", label, fontSize, Vector2.zero, Vector2.one, Color.white, TextAnchor.MiddleCenter);
            text.raycastTarget = false;
            return button;
        }

        private static Toggle AddToggle(Transform parent, string name, string label, Vector2 min, Vector2 max)
        {
            var panel = AddPanel(parent, name, min, max, Navy);
            var toggle = panel.AddComponent<Toggle>();
            toggle.targetGraphic = panel.GetComponent<Image>();
            var check = AddPanel(panel.transform, "Check", new Vector2(0.04f, 0.25f), new Vector2(0.16f, 0.75f), Color.white);
            toggle.graphic = check.GetComponent<Image>();
            AddText(panel.transform, "Label", label, 16, new Vector2(0.18f, 0f), Vector2.one, Muted, TextAnchor.MiddleCenter);
            return toggle;
        }

        private static void SetReference(SerializedObject serialized, string name, Object value)
        {
            var property = serialized.FindProperty(name);
            if (property != null)
                property.objectReferenceValue = value;
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
