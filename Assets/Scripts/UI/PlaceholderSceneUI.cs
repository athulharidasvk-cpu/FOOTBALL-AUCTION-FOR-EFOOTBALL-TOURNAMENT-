using UnityEngine;
using UnityEngine.UI;
using TMPro;
using FootballManager.Core;

namespace FootballManager.UI
{
    /// <summary>
    /// Lightweight UI controller for placeholder scenes (ManagerSetup, OwnerMode, OnlineMode).
    /// Allows testing complete scene navigation loops in Phase 1 without runtime errors.
    /// </summary>
    public class PlaceholderSceneUI : MonoBehaviour
    {
        [Header("Header Elements")]
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI subtitleText;

        [Header("Navigation Button")]
        [SerializeField] private Button backToMainMenuButton;

        [Header("Configured Labels")]
        [SerializeField] private string sceneTitle = "MODE TITLE";
        [TextArea(2, 4)]
        [SerializeField] private string sceneDescription = "This system is prepared in the architectural hierarchy and will be expanded in its dedicated phase.";

        private void Start()
        {
            if (titleText != null)
                titleText.text = sceneTitle;

            if (subtitleText != null)
                subtitleText.text = sceneDescription;

            if (backToMainMenuButton != null)
                backToMainMenuButton.onClick.AddListener(OnBackClicked);

            EnsureGameManagerExists();
        }

        private void OnDestroy()
        {
            if (backToMainMenuButton != null)
                backToMainMenuButton.onClick.RemoveListener(OnBackClicked);
        }

        private void OnBackClicked()
        {
            Debug.Log("[PlaceholderSceneUI] Returning to Main Menu...");
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
