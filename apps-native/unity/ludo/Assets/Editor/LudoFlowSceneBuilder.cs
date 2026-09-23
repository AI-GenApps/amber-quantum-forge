using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo.Editor
{
    public static class LudoFlowSceneBuilder
    {
        private static readonly Color Midnight = new Color(0.027f, 0.102f, 0.212f, 1f);
        private static readonly Color Panel = new Color(0.035f, 0.145f, 0.314f, 0.99f);
        private static readonly Color Azure = new Color(0.176f, 0.659f, 0.902f, 1f);
        private static readonly Color Jade = new Color(0.129f, 0.714f, 0.451f, 1f);
        private static readonly Color Ruby = new Color(0.898f, 0.231f, 0.290f, 1f);
        private static readonly Color Sun = new Color(0.961f, 0.784f, 0.294f, 1f);
        private static readonly Color Brass = new Color(0.843f, 0.659f, 0.243f, 1f);
        private static readonly Color Muted = new Color(0.65f, 0.77f, 0.92f, 1f);
        private static readonly Color Ivory = new Color(0.969f, 0.941f, 0.894f, 1f);

        public static void BuildFlow()
        {
            var root = new GameObject("LudoFlow", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 250;
            var scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080f, 2400f);
            scaler.matchWidthOrHeight = 0.5f;
            AddBackdrop(root.transform);

            var safe = new GameObject("SafeContent", typeof(RectTransform), typeof(LudoFlowSafeArea));
            safe.transform.SetParent(root.transform, false);
            SetRect(safe.GetComponent<RectTransform>(), Vector2.zero, Vector2.one);
            var welcome = CreatePanel(safe.transform, "WelcomePanel");
            BuildWelcome(welcome.transform, out var welcomePlay, out var welcomeTutorial);
            var tutorial = CreatePanel(safe.transform, "TutorialPanel");
            BuildTutorial(tutorial.transform, out var tutorialNext, out var tutorialSkip, out var tutorialScenes, out var tutorialStep, out var tutorialBody, out var tutorialAction);
            var home = CreatePanel(safe.transform, "HomePanel");
            BuildHome(home.transform, out var homeComputer, out var homePassPlay, out var homeSettings);
            var setup = CreatePanel(safe.transform, "SetupPanel");
            BuildSetup(setup.transform, out var setupPlay, out var setupBack, out var setupTwo, out var setupFour, out var setupRuby, out var setupJade, out var setupSun, out var setupAzure, out var setupPlayers, out var setupColor, out var setupOpponent);
            var settings = CreatePanel(safe.transform, "SettingsPanel");
            BuildSettings(settings.transform, out var settingsBack, out var settingsReplay, out var soundToggle, out var reducedMotionToggle, out var vibrationToggle);
            var pause = CreatePanel(safe.transform, "PausePanel");
            BuildPause(pause.transform, out var pauseContinue, out var pauseSettings, out var pauseExit);

            var flow = root.AddComponent<LudoFlowController>();
            flow.Configure(root, welcome, tutorial, home, setup, settings, pause, tutorialScenes, welcomePlay, welcomeTutorial, tutorialNext, tutorialSkip, homeComputer, homePassPlay, homeSettings, setupPlay, setupBack, setupTwo, setupFour, setupRuby, setupJade, setupSun, setupAzure, settingsBack, settingsReplay, pauseContinue, pauseSettings, pauseExit, soundToggle, reducedMotionToggle, vibrationToggle, tutorialStep, tutorialBody, tutorialAction, setupPlayers, setupColor, setupOpponent);
            tutorial.SetActive(false);
            home.SetActive(false);
            setup.SetActive(false);
            settings.SetActive(false);
            pause.SetActive(false);
        }

        private static void AddBackdrop(Transform parent)
        {
            var shield = AddPanel(parent, "OpaqueShield", Vector2.zero, Vector2.one, Midnight);
            var shieldImage = shield.GetComponent<Image>();
            shieldImage.sprite = null;
            shieldImage.type = Image.Type.Simple;
            shieldImage.raycastTarget = true;
            var fabric = new GameObject("MidnightFabric", typeof(RectTransform), typeof(RawImage), typeof(AspectRatioFitter));
            fabric.transform.SetParent(parent, false);
            SetRect(fabric.GetComponent<RectTransform>(), Vector2.zero, Vector2.one);
            var raw = fabric.GetComponent<RawImage>();
            raw.texture = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Art/Textures/LudoBackdrop-v2.png");
            raw.color = new Color(1f, 1f, 1f, 0.56f);
            raw.raycastTarget = false;
            var fitter = fabric.GetComponent<AspectRatioFitter>();
            fitter.aspectMode = AspectRatioFitter.AspectMode.EnvelopeParent;
            fitter.aspectRatio = 1f;
            AddPanel(parent, "TopBrassRule", new Vector2(0.12f, 0.095f), new Vector2(0.88f, 0.097f), Brass).GetComponent<Image>().raycastTarget = false;
            AddPanel(parent, "BottomBrassRule", new Vector2(0.12f, 0.055f), new Vector2(0.88f, 0.057f), Brass).GetComponent<Image>().raycastTarget = false;
        }

        private static GameObject CreatePanel(Transform parent, string name)
        {
            var panel = AddPanel(parent, name, new Vector2(0.035f, 0.015f), new Vector2(0.965f, 0.985f), Panel);
            var shadow = panel.AddComponent<Shadow>();
            shadow.effectColor = new Color(0f, 0f, 0f, 0.48f);
            shadow.effectDistance = new Vector2(0f, -6f);
            return panel;
        }

        private static void BuildWelcome(Transform parent, out Button play, out Button tutorial)
        {
            AddText(parent, "Eyebrow", "A table for every turn", 21, new Vector2(0.1f, 0.9f), new Vector2(0.9f, 0.95f), Muted, TextAnchor.MiddleCenter);
            AddPanel(parent, "HeroCard", new Vector2(0.12f, 0.55f), new Vector2(0.88f, 0.86f), new Color(0.055f, 0.22f, 0.45f, 1f));
            AddRawImage(parent, "HeroPawns", "Assets/Art/Textures/LudoHeroPawns.png", new Vector2(0.28f, 0.58f), new Vector2(0.72f, 0.84f), 1.5f);
            AddText(parent, "Title", "Ludo", 56, new Vector2(0.08f, 0.45f), new Vector2(0.92f, 0.53f), Brass, TextAnchor.MiddleCenter);
            AddText(parent, "Subtitle", "Roll. Move. Bring every token home.", 26, new Vector2(0.1f, 0.38f), new Vector2(0.9f, 0.44f), Color.white, TextAnchor.MiddleCenter);
            play = AddButton(parent, "Start", "Start playing", new Vector2(0.13f, 0.25f), new Vector2(0.87f, 0.30f), Azure, Color.white, 22);
            tutorial = AddButton(parent, "Tutorial", "How to play", new Vector2(0.2f, 0.175f), new Vector2(0.8f, 0.22f), new Color(0.08f, 0.30f, 0.57f, 1f), Color.white, 19);
            AddText(parent, "Footer", "Local table  ·  classic rules", 18, new Vector2(0.08f, 0.075f), new Vector2(0.92f, 0.115f), Muted, TextAnchor.MiddleCenter);
        }

        private static void BuildTutorial(Transform parent, out Button next, out Button skip, out GameObject[] scenes, out Text step, out Text body, out Text action)
        {
            AddText(parent, "Title", "How to play", 54, new Vector2(0.08f, 0.88f), new Vector2(0.92f, 0.95f), Brass, TextAnchor.MiddleCenter);
            step = AddText(parent, "Step", "Step 1 of 3", 21, new Vector2(0.1f, 0.82f), new Vector2(0.9f, 0.87f), Muted, TextAnchor.MiddleCenter);
            scenes = new GameObject[3];
            for (var index = 0; index < scenes.Length; index++)
            {
                scenes[index] = LudoFlowBoardIllustration.Build(parent, $"BoardStep{index + 1}", index);
                scenes[index].SetActive(index == 0);
            }
            body = AddText(parent, "Body", string.Empty, 27, new Vector2(0.12f, 0.285f), new Vector2(0.88f, 0.40f), Color.white, TextAnchor.MiddleCenter);
            body.resizeTextForBestFit = true;
            body.resizeTextMinSize = 20;
            body.resizeTextMaxSize = 27;
            next = AddButton(parent, "Next", "Next", new Vector2(0.13f, 0.17f), new Vector2(0.87f, 0.22f), Azure, Color.white, 22);
            action = next.transform.Find("Label").GetComponent<Text>();
            skip = AddButton(parent, "Skip", "Skip for now", new Vector2(0.22f, 0.105f), new Vector2(0.78f, 0.145f), new Color(0.08f, 0.30f, 0.57f, 1f), Color.white, 18);
        }

        private static void BuildHome(Transform parent, out Button computer, out Button passPlay, out Button settings)
        {
            AddText(parent, "Title", "Choose your table", 52, new Vector2(0.08f, 0.87f), new Vector2(0.92f, 0.95f), Brass, TextAnchor.MiddleCenter);
            AddText(parent, "Subtitle", "A relaxed local match, ready in seconds.", 24, new Vector2(0.1f, 0.81f), new Vector2(0.68f, 0.86f), Muted, TextAnchor.MiddleCenter);
            settings = AddButton(parent, "Settings", "Settings", new Vector2(0.7f, 0.805f), new Vector2(0.9f, 0.85f), new Color(0.08f, 0.30f, 0.57f, 1f), Color.white, 16);
            AddPanel(parent, "HeroCard", new Vector2(0.25f, 0.55f), new Vector2(0.75f, 0.78f), new Color(0.055f, 0.22f, 0.45f, 1f));
            AddRawImage(parent, "HeroPawns", "Assets/Art/Textures/LudoHeroPawns.png", new Vector2(0.27f, 0.56f), new Vector2(0.73f, 0.77f), 1.5f);
            computer = AddButton(parent, "Computer", "Play computer  ·  classic", new Vector2(0.12f, 0.40f), new Vector2(0.88f, 0.45f), Azure, Color.white, 21);
            passPlay = AddButton(parent, "PassPlay", "Pass and play  ·  one table", new Vector2(0.12f, 0.31f), new Vector2(0.88f, 0.36f), Jade, Color.white, 21);
            AddText(parent, "Hint", "Online matches arrive later", 18, new Vector2(0.12f, 0.24f), new Vector2(0.88f, 0.28f), Muted, TextAnchor.MiddleCenter);
            AddText(parent, "Footer", "Local play  ·  no account required", 18, new Vector2(0.08f, 0.075f), new Vector2(0.92f, 0.115f), Muted, TextAnchor.MiddleCenter);
        }

        private static void BuildSetup(Transform parent, out Button play, out Button back, out Button twoPlayers, out Button fourPlayers, out Button ruby, out Button jade, out Button sun, out Button azure, out Text players, out Text color, out Text opponent)
        {
            AddText(parent, "Title", "Set up classic", 54, new Vector2(0.08f, 0.88f), new Vector2(0.92f, 0.95f), Brass, TextAnchor.MiddleCenter);
            AddText(parent, "Rules", "Four colors. One shared table. Exact rolls bring tokens home.", 23, new Vector2(0.13f, 0.78f), new Vector2(0.87f, 0.84f), Color.white, TextAnchor.MiddleCenter);
            players = AddText(parent, "Players", "2 players", 28, new Vector2(0.2f, 0.66f), new Vector2(0.8f, 0.72f), Brass, TextAnchor.MiddleCenter);
            twoPlayers = AddButton(parent, "Two", "2 players", new Vector2(0.13f, 0.55f), new Vector2(0.47f, 0.595f), Azure, Color.white, 19);
            fourPlayers = AddButton(parent, "Four", "4 players", new Vector2(0.53f, 0.55f), new Vector2(0.87f, 0.595f), Azure, Color.white, 19);
            color = AddText(parent, "Color", "Your color  ·  Azure", 21, new Vector2(0.15f, 0.45f), new Vector2(0.85f, 0.49f), Muted, TextAnchor.MiddleCenter);
            ruby = AddButton(parent, "Ruby", "Ruby", new Vector2(0.12f, 0.37f), new Vector2(0.31f, 0.41f), Ruby, Color.white, 16);
            jade = AddButton(parent, "Jade", "Jade", new Vector2(0.32f, 0.37f), new Vector2(0.51f, 0.41f), Jade, Color.white, 16);
            sun = AddButton(parent, "Sun", "Sun", new Vector2(0.52f, 0.37f), new Vector2(0.71f, 0.41f), Sun, new Color(0.10f, 0.14f, 0.22f, 1f), 16);
            azure = AddButton(parent, "Azure", "Azure", new Vector2(0.72f, 0.37f), new Vector2(0.91f, 0.41f), Azure, Color.white, 16);
            opponent = AddText(parent, "Opponent", string.Empty, 19, new Vector2(0.08f, 0.30f), new Vector2(0.92f, 0.34f), Muted, TextAnchor.MiddleCenter);
            play = AddButton(parent, "Play", "Play now", new Vector2(0.13f, 0.18f), new Vector2(0.87f, 0.23f), Azure, Color.white, 22);
            back = AddButton(parent, "Back", "Back", new Vector2(0.27f, 0.105f), new Vector2(0.73f, 0.145f), new Color(0.08f, 0.30f, 0.57f, 1f), Color.white, 18);
        }

        private static void BuildSettings(Transform parent, out Button back, out Button replay, out Toggle sound, out Toggle reducedMotion, out Toggle vibration)
        {
            AddText(parent, "Title", "Settings", 56, new Vector2(0.08f, 0.88f), new Vector2(0.92f, 0.95f), Brass, TextAnchor.MiddleCenter);
            AddText(parent, "Subtitle", "Tune the table to your pace.", 24, new Vector2(0.12f, 0.8f), new Vector2(0.88f, 0.85f), Muted, TextAnchor.MiddleCenter);
            sound = AddToggle(parent, "Sound", "Table sounds", new Vector2(0.12f, 0.64f), true);
            reducedMotion = AddToggle(parent, "Motion", "Reduced motion", new Vector2(0.12f, 0.55f), false);
            vibration = AddToggle(parent, "Vibration", "Vibration", new Vector2(0.12f, 0.46f), true);
            replay = AddButton(parent, "Replay", "Replay how to play", new Vector2(0.13f, 0.30f), new Vector2(0.87f, 0.35f), Azure, Color.white, 20);
            back = AddButton(parent, "Back", "Back to tables", new Vector2(0.22f, 0.20f), new Vector2(0.78f, 0.24f), new Color(0.08f, 0.30f, 0.57f, 1f), Color.white, 18);
        }

        private static void BuildPause(Transform parent, out Button continueButton, out Button settings, out Button exit)
        {
            AddText(parent, "Title", "Paused", 56, new Vector2(0.08f, 0.82f), new Vector2(0.92f, 0.92f), Brass, TextAnchor.MiddleCenter);
            AddText(parent, "Body", "The table is waiting for your next move.", 25, new Vector2(0.12f, 0.73f), new Vector2(0.88f, 0.79f), Color.white, TextAnchor.MiddleCenter);
            continueButton = AddButton(parent, "Continue", "Continue match", new Vector2(0.13f, 0.56f), new Vector2(0.87f, 0.61f), Azure, Color.white, 21);
            settings = AddButton(parent, "Settings", "Settings", new Vector2(0.13f, 0.47f), new Vector2(0.87f, 0.52f), Jade, Color.white, 21);
            exit = AddButton(parent, "Exit", "Exit to tables", new Vector2(0.2f, 0.38f), new Vector2(0.8f, 0.42f), new Color(0.08f, 0.30f, 0.57f, 1f), Color.white, 18);
        }

        private static Toggle AddToggle(Transform parent, string name, string label, Vector2 origin, bool initial)
        {
            var panel = AddPanel(parent, name, origin, origin + new Vector2(0.76f, 0.055f), new Color(0.08f, 0.24f, 0.46f, 1f));
            var toggle = panel.AddComponent<Toggle>();
            toggle.isOn = initial;
            toggle.targetGraphic = null;
            var track = AddPanel(panel.transform, "Track", new Vector2(0.82f, 0.21f), new Vector2(0.97f, 0.79f), new Color(0.03f, 0.10f, 0.20f, 1f));
            var thumb = new GameObject("Thumb", typeof(RectTransform), typeof(Image));
            thumb.transform.SetParent(track.transform, false);
            SetRect(thumb.GetComponent<RectTransform>(), new Vector2(0.08f, 0.14f), new Vector2(0.40f, 0.86f));
            var thumbImage = thumb.GetComponent<Image>();
            thumbImage.sprite = LudoFlowUiAssets.CircleSprite();
            thumbImage.color = Color.white;
            thumbImage.raycastTarget = false;
            var state = AddText(panel.transform, "State", initial ? "On" : "Off", 14, new Vector2(0.66f, 0.06f), new Vector2(0.80f, 0.94f), Muted, TextAnchor.MiddleCenter);
            var text = AddText(panel.transform, "Label", label, 21, new Vector2(0.06f, 0f), new Vector2(0.63f, 1f), Color.white, TextAnchor.MiddleLeft);
            text.raycastTarget = false;
            var visual = panel.AddComponent<LudoFlowToggleVisual>();
            visual.Configure(toggle, track.GetComponent<Image>(), thumbImage, state);
            return toggle;
        }

        private static RawImage AddRawImage(Transform parent, string name, string path, Vector2 min, Vector2 max, float aspect)
        {
            var frame = new GameObject(name + "Frame", typeof(RectTransform));
            frame.transform.SetParent(parent, false);
            SetRect(frame.GetComponent<RectTransform>(), min, max);
            var image = new GameObject(name, typeof(RectTransform), typeof(RawImage), typeof(AspectRatioFitter));
            image.transform.SetParent(frame.transform, false);
            SetRect(image.GetComponent<RectTransform>(), Vector2.zero, Vector2.one);
            var raw = image.GetComponent<RawImage>();
            raw.texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            raw.color = Color.white;
            raw.raycastTarget = false;
            var fitter = image.GetComponent<AspectRatioFitter>();
            fitter.aspectMode = AspectRatioFitter.AspectMode.FitInParent;
            fitter.aspectRatio = aspect;
            return raw;
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
            return panel;
        }

        private static Button AddButton(Transform parent, string name, string label, Vector2 min, Vector2 max, Color color, Color textColor, int fontSize = 22)
        {
            var panel = AddPanel(parent, name, min, max, color);
            var button = panel.AddComponent<Button>();
            button.targetGraphic = panel.GetComponent<Image>();
            var block = button.colors;
            block.normalColor = Color.white;
            block.highlightedColor = new Color(1f, 1f, 1f, 0.92f);
            block.pressedColor = new Color(1f, 1f, 1f, 0.78f);
            block.selectedColor = Color.white;
            block.disabledColor = new Color(1f, 1f, 1f, 0.45f);
            button.colors = block;
            var text = AddText(panel.transform, "Label", label, fontSize, Vector2.zero, Vector2.one, textColor, TextAnchor.MiddleCenter);
            text.resizeTextForBestFit = true;
            text.resizeTextMinSize = Mathf.Max(14, fontSize - 7);
            text.resizeTextMaxSize = fontSize;
            text.fontStyle = FontStyle.Bold;
            text.raycastTarget = false;
            return button;
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
            text.fontStyle = size >= 48 ? FontStyle.Bold : FontStyle.Normal;
            text.color = color;
            text.alignment = anchor;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Truncate;
            text.supportRichText = false;
            return text;
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
