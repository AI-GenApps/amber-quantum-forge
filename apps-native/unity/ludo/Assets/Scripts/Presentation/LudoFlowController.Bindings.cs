using System;
using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed partial class LudoFlowController
    {
        [SerializeField] private GameObject flowRoot;
        [SerializeField] private GameObject welcomePanel;
        [SerializeField] private GameObject tutorialPanel;
        [SerializeField] private GameObject homePanel;
        [SerializeField] private GameObject setupPanel;
        [SerializeField] private GameObject settingsPanel;
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private GameObject[] tutorialScenes;
        [SerializeField] private Button welcomePlay;
        [SerializeField] private Button welcomeTutorial;
        [SerializeField] private Button tutorialNext;
        [SerializeField] private Button tutorialSkip;
        [SerializeField] private Button homeComputer;
        [SerializeField] private Button homePassPlay;
        [SerializeField] private Button homeSettings;
        [SerializeField] private Button setupPlay;
        [SerializeField] private Button setupBack;
        [SerializeField] private Button setupTwoPlayers;
        [SerializeField] private Button setupFourPlayers;
        [SerializeField] private Button setupRuby;
        [SerializeField] private Button setupJade;
        [SerializeField] private Button setupSun;
        [SerializeField] private Button setupAzure;
        [SerializeField] private Button settingsBack;
        [SerializeField] private Button settingsReplay;
        [SerializeField] private Button pauseContinue;
        [SerializeField] private Button pauseSettings;
        [SerializeField] private Button pauseExit;
        [SerializeField] private Toggle soundToggle;
        [SerializeField] private Toggle reducedMotionToggle;
        [SerializeField] private Toggle vibrationToggle;
        [SerializeField] private Text tutorialStep;
        [SerializeField] private Text tutorialBody;
        [SerializeField] private Text tutorialAction;
        [SerializeField] private Text setupPlayers;
        [SerializeField] private Text setupColor;
        [SerializeField] private Text setupOpponent;

        private int tutorialIndex;
        private int selectedPlayers = 2;
        private int selectedColor = 3;
        private LudoMatchMode selectedMode = LudoMatchMode.Computer;
        private bool settingsReturnToPause;
        private bool tutorialReturnToPause;

        public event Action<LudoMatchSelection> StartMatchRequested;
        public event Action PauseRequested;
        public event Action ResumeRequested;
        public event Action ExitMatchRequested;
        public event Action<bool> ReducedMotionChanged;
        public event Action<bool> SoundChanged;
        public event Action<bool> VibrationChanged;

        public void Configure(
            GameObject root,
            GameObject welcome,
            GameObject tutorial,
            GameObject home,
            GameObject setup,
            GameObject settings,
            GameObject pause,
            GameObject[] scenes,
            Button welcomePlayButton,
            Button welcomeTutorialButton,
            Button tutorialNextButton,
            Button tutorialSkipButton,
            Button computerButton,
            Button passPlayButton,
            Button settingsButton,
            Button playButton,
            Button backButton,
            Button twoPlayersButton,
            Button fourPlayersButton,
            Button rubyButton,
            Button jadeButton,
            Button sunButton,
            Button azureButton,
            Button settingsBackButton,
            Button replayButton,
            Button continueButton,
            Button pauseSettingsButton,
            Button exitButton,
            Toggle sound,
            Toggle reducedMotion,
            Toggle vibration,
            Text stepText,
            Text bodyText,
            Text actionText,
            Text playersText,
            Text colorText,
            Text opponentText)
        {
            flowRoot = root;
            welcomePanel = welcome;
            tutorialPanel = tutorial;
            homePanel = home;
            setupPanel = setup;
            settingsPanel = settings;
            pausePanel = pause;
            tutorialScenes = scenes;
            welcomePlay = welcomePlayButton;
            welcomeTutorial = welcomeTutorialButton;
            tutorialNext = tutorialNextButton;
            tutorialSkip = tutorialSkipButton;
            homeComputer = computerButton;
            homePassPlay = passPlayButton;
            homeSettings = settingsButton;
            setupPlay = playButton;
            setupBack = backButton;
            setupTwoPlayers = twoPlayersButton;
            setupFourPlayers = fourPlayersButton;
            setupRuby = rubyButton;
            setupJade = jadeButton;
            setupSun = sunButton;
            setupAzure = azureButton;
            settingsBack = settingsBackButton;
            settingsReplay = replayButton;
            pauseContinue = continueButton;
            pauseSettings = pauseSettingsButton;
            pauseExit = exitButton;
            soundToggle = sound;
            reducedMotionToggle = reducedMotion;
            vibrationToggle = vibration;
            tutorialStep = stepText;
            tutorialBody = bodyText;
            tutorialAction = actionText;
            setupPlayers = playersText;
            setupColor = colorText;
            setupOpponent = opponentText;
        }
    }
}
