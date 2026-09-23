using System;
using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed partial class LudoFlowController : MonoBehaviour
    {
        private void Start()
        {
            welcomePlay.onClick.AddListener(ShowTutorial);
            welcomeTutorial.onClick.AddListener(ShowTutorial);
            tutorialNext.onClick.AddListener(AdvanceTutorial);
            tutorialSkip.onClick.AddListener(SkipTutorial);
            homeComputer.onClick.AddListener(SelectComputer);
            homePassPlay.onClick.AddListener(SelectPassAndPlay);
            homeSettings.onClick.AddListener(OpenSettingsFromHome);
            setupPlay.onClick.AddListener(BeginBoard);
            setupBack.onClick.AddListener(ShowHome);
            setupTwoPlayers.onClick.AddListener(SelectTwoPlayers);
            setupFourPlayers.onClick.AddListener(SelectFourPlayers);
            setupRuby.onClick.AddListener(SelectRuby);
            setupJade.onClick.AddListener(SelectJade);
            setupSun.onClick.AddListener(SelectSun);
            setupAzure.onClick.AddListener(SelectAzure);
            settingsBack.onClick.AddListener(CloseSettings);
            settingsReplay.onClick.AddListener(ReplayTutorial);
            pauseContinue.onClick.AddListener(ContinueMatch);
            pauseSettings.onClick.AddListener(OpenSettingsFromPause);
            pauseExit.onClick.AddListener(ExitToHome);
            soundToggle.onValueChanged.AddListener(SetSound);
            reducedMotionToggle.onValueChanged.AddListener(SetReducedMotion);
            vibrationToggle.onValueChanged.AddListener(SetVibration);
            soundToggle.SetIsOnWithoutNotify(LudoFlowPreferences.Read(LudoFlowPreferences.Sound, true));
            reducedMotionToggle.SetIsOnWithoutNotify(LudoFlowPreferences.Read(LudoFlowPreferences.ReducedMotion, false));
            vibrationToggle.SetIsOnWithoutNotify(LudoFlowPreferences.Read(LudoFlowPreferences.Vibration, true));
            soundToggle.GetComponent<LudoFlowToggleVisual>()?.Refresh();
            reducedMotionToggle.GetComponent<LudoFlowToggleVisual>()?.Refresh();
            vibrationToggle.GetComponent<LudoFlowToggleVisual>()?.Refresh();
            SetPlayers(2);
            SelectAzure();
            if (LudoFlowPreferences.Read(LudoFlowPreferences.TutorialCompleted, false))
                ShowHome();
            else
                ShowWelcome();
        }

        public void PresentPause()
        {
            ShowPanel(pausePanel);
            PauseRequested?.Invoke();
        }

        public void HideFlow()
        {
            flowRoot.SetActive(false);
        }

        public void ShowHome()
        {
            ShowPanel(homePanel);
        }

        private void OnDestroy()
        {
            if (welcomePlay != null) welcomePlay.onClick.RemoveListener(ShowTutorial);
            if (welcomeTutorial != null) welcomeTutorial.onClick.RemoveListener(ShowTutorial);
            if (tutorialNext != null) tutorialNext.onClick.RemoveListener(AdvanceTutorial);
            if (tutorialSkip != null) tutorialSkip.onClick.RemoveListener(SkipTutorial);
            if (homeComputer != null) homeComputer.onClick.RemoveListener(SelectComputer);
            if (homePassPlay != null) homePassPlay.onClick.RemoveListener(SelectPassAndPlay);
            if (homeSettings != null) homeSettings.onClick.RemoveListener(OpenSettingsFromHome);
            if (setupPlay != null) setupPlay.onClick.RemoveListener(BeginBoard);
            if (setupBack != null) setupBack.onClick.RemoveListener(ShowHome);
        }

        private void ShowWelcome()
        {
            ShowPanel(welcomePanel);
        }

        private void ShowTutorial()
        {
            BeginTutorial(false);
        }

        private void BeginTutorial(bool returnToPause)
        {
            tutorialReturnToPause = returnToPause;
            tutorialIndex = 0;
            ShowPanel(tutorialPanel);
            RefreshTutorial();
        }

        private void AdvanceTutorial()
        {
            if (tutorialIndex >= 2)
            {
                FinishTutorial();
                return;
            }
            tutorialIndex++;
            RefreshTutorial();
        }

        private void SkipTutorial()
        {
            FinishTutorial();
        }

        private void FinishTutorial()
        {
            CompleteTutorial();
            if (tutorialReturnToPause)
            {
                tutorialReturnToPause = false;
                ShowPanel(pausePanel);
                return;
            }
            ShowHome();
        }

        private void CompleteTutorial()
        {
            LudoFlowPreferences.Write(LudoFlowPreferences.TutorialCompleted, true);
        }

        private void RefreshTutorial()
        {
            var copy = tutorialIndex switch
            {
                0 => "Roll a six to bring one Azure token out of your yard. The highlighted entry lane is where the turn starts.",
                1 => "Move the glowing token the number on the die. Brass stars are safe spaces and the turn passes around the cross.",
                _ => "Travel up your color lane, then finish in the ivory center. Bring all four tokens home to win."
            };
            tutorialStep.text = $"Step {tutorialIndex + 1} of 3";
            tutorialBody.text = copy;
            tutorialAction.text = tutorialIndex == 2 ? "Let's play" : "Next";
            for (var index = 0; index < tutorialScenes.Length; index++)
                tutorialScenes[index].SetActive(index == tutorialIndex);
        }

        private void SelectComputer()
        {
            selectedMode = LudoMatchMode.Computer;
            ShowSetup();
        }

        private void SelectPassAndPlay()
        {
            selectedMode = LudoMatchMode.PassAndPlay;
            ShowSetup();
        }

        private void ShowSetup()
        {
            SetPlayers(selectedPlayers);
            ShowPanel(setupPanel);
        }

        private void SetPlayers(int count)
        {
            selectedPlayers = count;
            setupPlayers.text = $"{selectedPlayers} players";
            setupTwoPlayers.interactable = count != 2;
            setupFourPlayers.interactable = count != 4;
            RefreshSetupSummary();
        }

        private void SelectTwoPlayers() => SetPlayers(2);
        private void SelectFourPlayers() => SetPlayers(4);
        private void SelectRuby() => SetColor(0);
        private void SelectJade() => SetColor(1);
        private void SelectSun() => SetColor(2);
        private void SelectAzure() => SetColor(3);

        private void SetColor(int color)
        {
            selectedColor = color;
            setupColor.text = $"Your color  ·  {LudoBoardLayout.PlayerName(selectedColor)}";
            setupRuby.interactable = color != 0;
            setupJade.interactable = color != 1;
            setupSun.interactable = color != 2;
            setupAzure.interactable = color != 3;
            RefreshSetupSummary();
        }

        private void RefreshSetupSummary()
        {
            var modeName = selectedMode == LudoMatchMode.Computer ? "Computer" : "Pass and play";
            var colorName = LudoBoardLayout.PlayerName(selectedColor);
            var secondary = selectedMode == LudoMatchMode.Computer
                ? LudoBoardLayout.PlayerName((selectedColor + 1) % 4)
                : $"{colorName} starts";
            setupOpponent.text = $"{modeName}  ·  {selectedPlayers} players  ·  {secondary}";
        }

        private void BeginBoard()
        {
            StartMatchRequested?.Invoke(new LudoMatchSelection(selectedPlayers, selectedColor, selectedMode));
            HideFlow();
        }

        private void OpenSettingsFromHome()
        {
            settingsReturnToPause = false;
            UpdateSettingsBackLabel();
            ShowPanel(settingsPanel);
        }

        private void OpenSettingsFromPause()
        {
            settingsReturnToPause = true;
            UpdateSettingsBackLabel();
            ShowPanel(settingsPanel);
        }

        private void UpdateSettingsBackLabel()
        {
            var label = settingsBack == null ? null : settingsBack.transform.Find("Label")?.GetComponent<Text>();
            if (label != null)
                label.text = settingsReturnToPause ? "Back to match" : "Back to tables";
        }

        private void CloseSettings()
        {
            if (settingsReturnToPause)
                ShowPanel(pausePanel);
            else
                ShowHome();
        }

        private void ReplayTutorial()
        {
            BeginTutorial(settingsReturnToPause);
        }

        private void ContinueMatch()
        {
            ResumeRequested?.Invoke();
            HideFlow();
        }

        private void ExitToHome()
        {
            ExitMatchRequested?.Invoke();
            ShowHome();
        }

        private void SetSound(bool value)
        {
            LudoFlowPreferences.Write(LudoFlowPreferences.Sound, value);
            SoundChanged?.Invoke(value);
        }

        private void SetReducedMotion(bool value)
        {
            LudoFlowPreferences.Write(LudoFlowPreferences.ReducedMotion, value);
            ReducedMotionChanged?.Invoke(value);
        }

        private void SetVibration(bool value)
        {
            LudoFlowPreferences.Write(LudoFlowPreferences.Vibration, value);
            VibrationChanged?.Invoke(value);
        }

        private void ShowPanel(GameObject panel)
        {
            flowRoot.SetActive(true);
            welcomePanel.SetActive(panel == welcomePanel);
            tutorialPanel.SetActive(panel == tutorialPanel);
            homePanel.SetActive(panel == homePanel);
            setupPanel.SetActive(panel == setupPanel);
            settingsPanel.SetActive(panel == settingsPanel);
            pausePanel.SetActive(panel == pausePanel);
        }
    }
}
