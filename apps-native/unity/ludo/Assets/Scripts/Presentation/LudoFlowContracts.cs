namespace W3Dev.Ludo
{
    public enum LudoMatchMode
    {
        Computer,
        PassAndPlay
    }

    public readonly struct LudoMatchSelection
    {
        public int PlayerCount { get; }
        public int LocalColor { get; }
        public LudoMatchMode Mode { get; }

        public LudoMatchSelection(int playerCount, int localColor, LudoMatchMode mode)
        {
            PlayerCount = playerCount;
            LocalColor = localColor;
            Mode = mode;
        }
    }

    public static class LudoFlowPreferences
    {
        public const string TutorialCompleted = "ludo.flow.tutorial.completed";
        public const string ReducedMotion = "ludo.flow.reduced_motion";
        public const string Sound = "ludo.flow.sound";
        public const string Vibration = "ludo.flow.vibration";

        public static bool Read(string key, bool fallback)
        {
            return UnityEngine.PlayerPrefs.GetInt(key, fallback ? 1 : 0) == 1;
        }

        public static void Write(string key, bool value)
        {
            UnityEngine.PlayerPrefs.SetInt(key, value ? 1 : 0);
            UnityEngine.PlayerPrefs.Save();
        }
    }
}
