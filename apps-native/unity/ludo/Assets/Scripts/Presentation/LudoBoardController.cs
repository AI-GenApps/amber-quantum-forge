using System;
using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed partial class LudoBoardController : MonoBehaviour
    {
        [SerializeField] private LudoTokenView[] tokenViews;
        [SerializeField] private Button rollButton;
        [SerializeField] private Toggle reducedMotionToggle;
        [SerializeField] private Toggle audioToggle;
        [SerializeField] private Toggle hapticsToggle;
        [SerializeField] private Button restartButton;
        [SerializeField] private Text statusText;
        [SerializeField] private Text turnText;
        [SerializeField] private Text rollText;
        [SerializeField] private Text phaseText;
        [SerializeField] private LudoDieView dieView;
        [SerializeField] private LudoFeedback feedback;

        private LudoGameState state;
        private ILudoDiceSource diceSource;
        private bool diceSourceInjected;
        private int lastRoll;
        private int playerCount;
        private int humanColor;
        private bool versusComputer;
        private bool reducedMotion;
        private bool audioEnabled = true;
        private bool hapticsEnabled = true;
        private bool busy;
        private bool matchStarted;
        private bool suspended;
        private bool diceUnavailable;
        private readonly bool[] computerSeats = new bool[LudoRules.SeatCount];
        private Coroutine computerRoutine;

        public event Action ReturnToMenuRequested;
        public event Action<bool> SuspensionChanged;

        public LudoGameState CurrentState => state;
        public bool IsMatchActive => matchStarted;
        public bool IsSuspended => suspended;
        public int PlayerCount => playerCount;
        public int HumanColor => humanColor;
        public bool VersusComputer => versusComputer;

        public bool IsComputerPlayer(int player)
        {
            return IsComputerSeat(player);
        }

        public void Configure(
            LudoTokenView[] views,
            Button button,
            Toggle motionToggle,
            Button restart,
            Text status,
            Text turn,
            Text roll,
            Text phase,
            LudoDieView die,
            LudoFeedback haptics)
        {
            tokenViews = views;
            rollButton = button;
            reducedMotionToggle = motionToggle;
            restartButton = restart;
            statusText = status;
            turnText = turn;
            rollText = roll;
            phaseText = phase;
            dieView = die;
            feedback = haptics;
        }

        public void SetDiceSource(ILudoDiceSource source)
        {
            diceSource = source ?? new RandomLudoDiceSource();
            diceSourceInjected = source != null;
            diceUnavailable = false;
            if (matchStarted)
            {
                RefreshViews();
                ScheduleComputerTurnIfNeeded();
            }
        }

        public void StartMatch(int requestedPlayerCount, int requestedHumanColor, bool requestedVersusComputer)
        {
            if (!LudoRules.IsSupportedPlayerCount(requestedPlayerCount))
            {
                SetStatus("Choose two or four players to begin.");
                return;
            }
            if (requestedHumanColor < 0 || requestedHumanColor >= LudoRules.SeatCount)
            {
                SetStatus("Choose a table color to begin.");
                return;
            }

            StopGameplayCoroutines();
            playerCount = requestedPlayerCount;
            humanColor = requestedHumanColor;
            versusComputer = requestedVersusComputer;
            for (var player = 0; player < computerSeats.Length; player++)
                computerSeats[player] = false;

            state = LudoRules.CreateState(playerCount, humanColor);
            if (versusComputer)
            {
                for (var index = 0; index < state.activePlayers.Count; index++)
                {
                    var player = state.activePlayers[index];
                    computerSeats[player] = player != humanColor;
                }
            }
            matchStarted = true;
            suspended = false;
            busy = false;
            lastRoll = 0;
            diceUnavailable = false;
            diceSource ??= new RandomLudoDiceSource();
            feedback?.SetSettings(audioEnabled, hapticsEnabled, reducedMotion);
            dieView?.SetFace(1);
            ConfigureTokenViews();
            RefreshViews();
            SetStatus("Roll the die to bring a token into play.");
        }

        public void SuspendMatch()
        {
            SetSuspended(true);
        }

        public void ResumeMatch()
        {
            SetSuspended(false);
        }

        public void PauseMatch()
        {
            SuspendMatch();
        }

        public void ContinueMatch()
        {
            ResumeMatch();
        }

        public void SetSuspended(bool value)
        {
            if (!matchStarted || suspended == value)
                return;

            suspended = value;
            if (suspended)
            {
                StopGameplayCoroutines();
                busy = false;
                RefreshViews();
                SetStatus("Match paused.");
            }
            else
            {
                RefreshViews();
                SetStatus(CurrentTurnStatus());
                ScheduleComputerTurnIfNeeded();
            }
            SuspensionChanged?.Invoke(suspended);
        }

        public void RequestReturnToMenu()
        {
            StopGameplayCoroutines();
            matchStarted = false;
            suspended = false;
            busy = false;
            state = null;
            lastRoll = 0;
            ClearPresentation();
            ReturnToMenuRequested?.Invoke();
        }

        public void ReturnToMenu()
        {
            RequestReturnToMenu();
        }

        private void Awake()
        {
            Screen.orientation = ScreenOrientation.Portrait;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            diceSource ??= new RandomLudoDiceSource();
        }

        private void Start()
        {
            BindControls();
            ConfigureTokenViews();
            SetReducedMotion(reducedMotionToggle != null && reducedMotionToggle.isOn);
            ConfigureSettings(audioToggle, hapticsToggle);
            feedback?.SetSettings(audioEnabled, hapticsEnabled, reducedMotion);
            if (matchStarted)
                RefreshViews();
            else
                ClearPresentation();
        }

        private void OnDestroy()
        {
            StopGameplayCoroutines();
            UnbindControls();
        }

        private void OnApplicationPause(bool pause)
        {
            SetSuspended(pause);
        }

        private void StopGameplayCoroutines()
        {
            StopAllCoroutines();
            computerRoutine = null;
        }

        private void BindControls()
        {
            rollButton?.onClick.AddListener(OnRollPressed);
            reducedMotionToggle?.onValueChanged.AddListener(SetReducedMotion);
            restartButton?.onClick.AddListener(Restart);
            if (audioToggle != null)
                audioToggle.onValueChanged.AddListener(SetAudioEnabled);
            if (hapticsToggle != null)
                hapticsToggle.onValueChanged.AddListener(SetHapticsEnabled);
        }

        private void UnbindControls()
        {
            rollButton?.onClick.RemoveListener(OnRollPressed);
            reducedMotionToggle?.onValueChanged.RemoveListener(SetReducedMotion);
            restartButton?.onClick.RemoveListener(Restart);
            audioToggle?.onValueChanged.RemoveListener(SetAudioEnabled);
            hapticsToggle?.onValueChanged.RemoveListener(SetHapticsEnabled);
        }

        private void ResetMatchState()
        {
            StopGameplayCoroutines();
            state = LudoRules.CreateState(playerCount, humanColor);
            busy = false;
            suspended = false;
            lastRoll = 0;
            dieView?.SetFace(1);
            RefreshViews();
            SetStatus("Roll the die to bring a token into play.");
        }

        private void Restart()
        {
            if (matchStarted)
                ResetMatchState();
        }

        private string CurrentTurnStatus()
        {
            if (state == null)
                return "Ready to play.";
            if (state.phase == LudoPhase.Finished)
                return $"{LudoBoardLayout.PlayerName(state.winner)} wins. Start another match when ready.";
            if (IsComputerSeat(state.currentPlayer))
                return "Computer is thinking.";
            return state.phase == LudoPhase.Move ? "Choose a highlighted token." : "Your turn. Roll the die.";
        }

        private bool IsComputerSeat(int player)
        {
            return player >= 0 && player < computerSeats.Length && computerSeats[player];
        }
    }
}
