using System;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace FootballManager.Core
{
    /// <summary>
    /// Master coordinator for global application lifecycle, game modes, and scene flow.
    /// Persists across scene loads. Keeps UI completely decoupled from data and state.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Runtime State")]
        [SerializeField] private GameMode currentGameMode = GameMode.None;

        /// <summary>
        /// Fired whenever the active game mode changes.
        /// Other systems can listen to this without direct coupling.
        /// </summary>
        public static event Action<GameMode> OnGameModeChanged;

        public GameMode CurrentGameMode => currentGameMode;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            Debug.Log("[GameManager] Core initialized successfully.");
        }

        /// <summary>
        /// Sets the current high-level game mode and fires the event.
        /// </summary>
        public void SetGameMode(GameMode mode)
        {
            if (currentGameMode == mode) return;

            currentGameMode = mode;
            Debug.Log($"[GameManager] Game Mode set to: {mode}");
            OnGameModeChanged?.Invoke(currentGameMode);
        }

        /// <summary>
        /// Launches Manager Career flow (Phase 2 entry point).
        /// </summary>
        public void StartManagerCareer()
        {
            SetGameMode(GameMode.ManagerCareer);
            LoadScene(SceneNames.ManagerSetup);
        }

        /// <summary>
        /// Launches Club Owner flow (separate system).
        /// </summary>
        public void StartClubOwnerMode()
        {
            SetGameMode(GameMode.ClubOwner);
            LoadScene(SceneNames.OwnerMode);
        }

        /// <summary>
        /// Launches Online Multiplayer flow (separate system).
        /// </summary>
        public void StartOnlineMode()
        {
            SetGameMode(GameMode.OnlineMultiplayer);
            LoadScene(SceneNames.OnlineMode);
        }

        /// <summary>
        /// Opens the global Settings scene.
        /// </summary>
        public void OpenSettings()
        {
            LoadScene(SceneNames.SettingsScene);
        }

        /// <summary>
        /// Navigates back to the root Main Menu.
        /// </summary>
        public void ReturnToMainMenu()
        {
            SetGameMode(GameMode.None);
            LoadScene(SceneNames.MainMenu);
        }

        /// <summary>
        /// Safely loads a scene by name. Logs a friendly warning if the scene is not yet in Build Settings.
        /// </summary>
        public void LoadScene(string sceneName)
        {
            if (string.IsNullOrEmpty(sceneName))
            {
                Debug.LogError("[GameManager] Cannot load scene with null or empty name.");
                return;
            }

            Debug.Log($"[GameManager] Loading Scene: {sceneName}");
            SceneManager.LoadScene(sceneName);
        }

        /// <summary>
        /// Closes the application in standalone builds or stops Play mode in the Editor.
        /// </summary>
        public void QuitGame()
        {
            Debug.Log("[GameManager] Quitting Application...");
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
