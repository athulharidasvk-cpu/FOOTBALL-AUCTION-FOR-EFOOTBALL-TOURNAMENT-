using UnityEngine;
using UnityEngine.UI;
using TMPro;
using FootballManager.Core;

namespace FootballManager.UI
{
    /// <summary>
    /// Initial UI controller for the Settings Scene.
    /// Provides audio, resolution/fullscreen toggles and a clean return flow to Main Menu.
    /// </summary>
    public class SettingsUI : MonoBehaviour
    {
        [Header("Audio Settings")]
        [SerializeField] private Slider masterVolumeSlider;
        [SerializeField] private Slider musicVolumeSlider;
        [SerializeField] private Slider sfxVolumeSlider;

        [Header("Display Settings")]
        [SerializeField] private Toggle fullscreenToggle;

        [Header("Navigation Button")]
        [SerializeField] private Button backToMainMenuButton;

        private void Start()
        {
            if (fullscreenToggle != null)
            {
                fullscreenToggle.isOn = Screen.fullScreen;
                fullscreenToggle.onValueChanged.AddListener(OnFullscreenToggled);
            }

            if (masterVolumeSlider != null)
                masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);

            if (musicVolumeSlider != null)
                musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);

            if (sfxVolumeSlider != null)
                sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);

            if (backToMainMenuButton != null)
                backToMainMenuButton.onClick.AddListener(OnBackClicked);

            EnsureGameManagerExists();
        }

        private void OnDestroy()
        {
            if (fullscreenToggle != null)
                fullscreenToggle.onValueChanged.RemoveListener(OnFullscreenToggled);

            if (masterVolumeSlider != null)
                masterVolumeSlider.onValueChanged.RemoveListener(OnMasterVolumeChanged);

            if (musicVolumeSlider != null)
                musicVolumeSlider.onValueChanged.RemoveListener(OnMusicVolumeChanged);

            if (sfxVolumeSlider != null)
                sfxVolumeSlider.onValueChanged.RemoveListener(OnSfxVolumeChanged);

            if (backToMainMenuButton != null)
                backToMainMenuButton.onClick.RemoveListener(OnBackClicked);
        }

        private void OnFullscreenToggled(bool isFullscreen)
        {
            Screen.fullScreen = isFullscreen;
            Debug.Log($"[SettingsUI] Fullscreen toggled: {isFullscreen}");
        }

        private void OnMasterVolumeChanged(float volume)
        {
            AudioListener.volume = volume;
            Debug.Log($"[SettingsUI] Master Volume: {volume:P0}");
        }

        private void OnMusicVolumeChanged(float volume)
        {
            Debug.Log($"[SettingsUI] Music Volume: {volume:P0}");
        }

        private void OnSfxVolumeChanged(float volume)
        {
            Debug.Log($"[SettingsUI] SFX Volume: {volume:P0}");
        }

        private void OnBackClicked()
        {
            Debug.Log("[SettingsUI] Returning to Main Menu...");
            if (GameManager.Instance != null)
            {
                GameManager.Instance.ReturnToMainMenu();
            }
            else
            {
                UnityEngine.SceneManagement.SceneManager.LoadScene(SceneNames.MainMenu);
            }
        }

        private void EnsureGameManagerExists()
        {
            if (GameManager.Instance == null)
            {
                GameObject gmObj = new GameObject("[GameManager]");
                gmObj.AddComponent<GameManager>();
            }
        }
    }
}
