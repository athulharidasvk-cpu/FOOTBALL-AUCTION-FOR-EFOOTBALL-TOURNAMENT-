using UnityEngine;
using UnityEngine.UI;
using TMPro;
using FootballManager.Core;

namespace FootballManager.UI
{
    /// <summary>
    /// Presentation layer for the Opening Game Menu.
    /// Strictly handles user input and view logic, delegating system actions to GameManager.
    /// </summary>
    public class MainMenuUI : MonoBehaviour
    {
        [Header("Menu Action Buttons")]
        [Tooltip("Launches the single-player Manager Career path")]
        [SerializeField] private Button playAsManagerButton;

        [Tooltip("Launches the separate Club Owner mode")]
        [SerializeField] private Button beAClubOwnerButton;

        [Tooltip("Launches the separate Online Multiplayer mode")]
        [SerializeField] private Button playOnlineButton;

        [Tooltip("Opens game Settings")]
        [SerializeField] private Button settingsButton;

        [Tooltip("Optional exit button for standalone builds")]
        [SerializeField] private Button quitButton;

        [Header("Notice Dialog (Optional Feedback)")]
        [Tooltip("Optional modal panel shown when clicking placeholder modes")]
        [SerializeField] private GameObject noticeDialogPanel;
        [SerializeField] private TextMeshProUGUI noticeDialogText;
        [SerializeField] private Button noticeDialogCloseButton;

        [Header("Behavior Settings")]
        [Tooltip("If true, placeholder scenes will be loaded directly. If false, shows an in-menu preview notice dialog.")]
        [SerializeField] private bool loadPlaceholderScenesDirectly = true;

        private void Awake()
        {
            EnsureGameManagerExists();
        }

        private void OnEnable()
        {
            // Register UI button listeners cleanly
            if (playAsManagerButton != null)
                playAsManagerButton.onClick.AddListener(OnPlayAsManagerClicked);

            if (beAClubOwnerButton != null)
                beAClubOwnerButton.onClick.AddListener(OnBeAClubOwnerClicked);

            if (playOnlineButton != null)
                playOnlineButton.onClick.AddListener(OnPlayOnlineClicked);

            if (settingsButton != null)
                settingsButton.onClick.AddListener(OnSettingsClicked);

            if (quitButton != null)
                quitButton.onClick.AddListener(OnQuitClicked);

            if (noticeDialogCloseButton != null)
                noticeDialogCloseButton.onClick.AddListener(CloseNoticeDialog);

            if (noticeDialogPanel != null)
                noticeDialogPanel.SetActive(false);
        }

        private void OnDisable()
        {
            // Unregister to prevent memory leaks and dangling delegates
            if (playAsManagerButton != null)
                playAsManagerButton.onClick.RemoveListener(OnPlayAsManagerClicked);

            if (beAClubOwnerButton != null)
                beAClubOwnerButton.onClick.RemoveListener(OnBeAClubOwnerClicked);

            if (playOnlineButton != null)
                playOnlineButton.onClick.RemoveListener(OnPlayOnlineClicked);

            if (settingsButton != null)
                settingsButton.onClick.RemoveListener(OnSettingsClicked);

            if (quitButton != null)
                quitButton.onClick.RemoveListener(OnQuitClicked);

            if (noticeDialogCloseButton != null)
                noticeDialogCloseButton.onClick.RemoveListener(CloseNoticeDialog);
        }

        private void OnPlayAsManagerClicked()
        {
            Debug.Log("[MainMenuUI] 'PLAY AS MANAGER' selected.");
            GameManager.Instance.StartManagerCareer();
        }

        private void OnBeAClubOwnerClicked()
        {
            Debug.Log("[MainMenuUI] 'BE A CLUB OWNER' selected.");
            if (loadPlaceholderScenesDirectly)
            {
                GameManager.Instance.StartClubOwnerMode();
            }
            else
            {
                ShowNoticeDialog("Club Owner Mode is an independent boardroom and financial management system under development. Phase 28 will implement this system.");
            }
        }

        private void OnPlayOnlineClicked()
        {
            Debug.Log("[MainMenuUI] 'PLAY ONLINE' selected.");
            if (loadPlaceholderScenesDirectly)
            {
                GameManager.Instance.StartOnlineMode();
            }
            else
            {
                ShowNoticeDialog("Online Multiplayer Mode is an independent matchmaking system under development. Phase 29 will implement this system.");
            }
        }

        private void OnSettingsClicked()
        {
            Debug.Log("[MainMenuUI] 'SETTINGS' selected.");
            GameManager.Instance.OpenSettings();
        }

        private void OnQuitClicked()
        {
            GameManager.Instance.QuitGame();
        }

        private void ShowNoticeDialog(string message)
        {
            if (noticeDialogPanel != null)
            {
                if (noticeDialogText != null)
                    noticeDialogText.text = message;
                noticeDialogPanel.SetActive(true);
            }
            else
            {
                Debug.Log($"[Notice] {message}");
            }
        }

        private void CloseNoticeDialog()
        {
            if (noticeDialogPanel != null)
                noticeDialogPanel.SetActive(false);
        }

        /// <summary>
        /// Ensures a GameManager is present even if the scene is tested directly in the editor.
        /// </summary>
        private void EnsureGameManagerExists()
        {
            if (GameManager.Instance == null)
            {
                GameObject gmObj = new GameObject("[GameManager]");
                gmObj.AddComponent<GameManager>();
                Debug.Log("[MainMenuUI] Created temporary GameManager instance for standalone scene test.");
            }
        }
    }
}
