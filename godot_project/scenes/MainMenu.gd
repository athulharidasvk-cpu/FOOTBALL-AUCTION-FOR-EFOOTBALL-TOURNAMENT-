extends Control

@onready var club_name_label: Label = $Header/Margin/Row/ClubBlock/ClubName
@onready var club_meta_label: Label = $Header/Margin/Row/ClubBlock/ClubMeta
@onready var budget_label: Label = $Header/Margin/Row/BudgetBox/Text/Value
@onready var round_label: Label = $Header/Margin/Row/SeasonBox/Text/Value
@onready var form_label: Label = $Body/Content/TitleRow/Form
@onready var next_match_teams: Label = $Body/Content/Cards/NextMatch/Box/Teams
@onready var squad_info: Label = $Body/Content/BottomRow/SquadCard/Box/Info

func _ready() -> void:
    _update_dashboard()
    if GameManager.budget_changed.is_connected(_on_budget_changed) == false:
        GameManager.budget_changed.connect(_on_budget_changed)

func _update_dashboard() -> void:
    if not GameManager.user_team:
        return
    club_name_label.text = GameManager.user_team.name.to_upper()
    club_meta_label.text = "DIVISION %d   •   SEASON %d" % [GameManager.user_team.division, GameManager.current_season]
    budget_label.text = "₹%.2f Cr" % GameManager.user_team.budget
    round_label.text = "%02d" % GameManager.current_round
    form_label.text = "FORM  " + " ".join(GameManager.recent_results)
    squad_info.text = "FORMATION  %s\nSQUAD  %d / 18\nTACTICAL BOARD READY" % [GameManager.user_team.formation, GameManager.user_team.squad.size()]
    _update_next_match()

func _update_next_match() -> void:
    if not GameManager.user_team:
        return
    for fixture in GameManager.fixtures:
        if not fixture.played and (fixture.home_team == GameManager.user_team.name or fixture.away_team == GameManager.user_team.name):
            var opponent := fixture.away_team if fixture.home_team == GameManager.user_team.name else fixture.home_team
            next_match_teams.text = "%s\n\nVS\n\n%s" % [GameManager.user_team.name.to_upper(), opponent.to_upper()]
            return
    next_match_teams.text = "%s\n\nVS\n\nCITY UNITED" % GameManager.user_team.name.to_upper()

func _on_budget_changed(_new_budget: float) -> void:
    _update_dashboard()

func _on_auction_pressed() -> void:
    get_tree().change_scene_to_file("res://scenes/Auction/AuctionRoom.tscn")

func _on_tactics_pressed() -> void:
    get_tree().change_scene_to_file("res://scenes/Tactics/TacticsBoard.tscn")

func _on_matchday_pressed() -> void:
    get_tree().change_scene_to_file("res://scenes/Matchday/MatchArena.tscn")

func _on_market_pressed() -> void:
    OS.shell_open("https://football-auction-for-efootball-tournament.onrender.com/")
