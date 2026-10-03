namespace FootballManager.Core
{
    /// <summary>
    /// Represents the high-level game modes supported by the game.
    /// Each mode is architected as an independent system.
    /// </summary>
    public enum GameMode
    {
        None,
        ManagerCareer,      // Single-player manager career mode
        ClubOwner,          // Club ownership and boardroom management mode
        OnlineMultiplayer   // Online competitive league / match mode
    }
}
