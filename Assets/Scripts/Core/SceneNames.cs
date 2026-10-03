namespace FootballManager.Core
{
    /// <summary>
    /// Centralized registry of scene names to prevent typo-related scene loading errors.
    /// Matches the architectural scene list planned for the project.
    /// </summary>
    public static class SceneNames
    {
        // Main Navigation
        public const string MainMenu = "MainMenu";
        public const string SettingsScene = "SettingsScene";

        // Manager Career Flow
        public const string ManagerSetup = "ManagerSetup";
        public const string ManagerSigningScene = "ManagerSigningScene";
        public const string ManagerMainMenu = "ManagerMainMenu";

        // Match & Press Flow
        public const string MatchScene = "MatchScene";
        public const string PressConferenceScene = "PressConferenceScene";

        // Squad Hub
        public const string SquadScene = "SquadScene";
        public const string TacticsScene = "TacticsScene";
        public const string TrainingScene = "TrainingScene";

        // Transfers Hub
        public const string TransfersScene = "TransfersScene";
        public const string ScoutingScene = "ScoutingScene";
        public const string YouthAcademyScene = "YouthAcademyScene";
        public const string ContractsScene = "ContractsScene";
        public const string NegotiationsScene = "NegotiationsScene";

        // Competitions & Fixtures
        public const string TableScene = "TableScene";
        public const string FixturesScene = "FixturesScene";
        public const string CompetitionsScene = "CompetitionsScene";
        public const string CalendarScene = "CalendarScene";

        // Club & Finance Hub
        public const string ClubScene = "ClubScene";
        public const string KitsScene = "KitsScene";
        public const string StadiumScene = "StadiumScene";
        public const string FinanceScene = "FinanceScene";
        public const string PressNewsScene = "PressNewsScene";

        // Alternate Modes
        public const string OwnerMode = "OwnerMode";
        public const string OnlineMode = "OnlineMode";
    }
}
