extends Control

@onready var club_name_label: Label = $Header/ClubInfo/ClubName
@onready var budget_label: Label = $Header/ClubInfo/Budget

func _ready() -> void:
	_update_ui()
	GameManager.budget_changed.connect(func(_b): _update_ui())

func _update_ui() -> void:
	if GameManager.user_team:
		club_name_label.text = "%s %s" % [GameManager.user_team.logo_emoji, GameManager.user_team.name]
		budget_label.text = "Budget: ₹%.2f Cr" % GameManager.user_team.budget

func _on_auction_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/Auction/AuctionRoom.tscn")

func _on_tactics_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/Tactics/TacticsBoard.tscn")

func _on_matchday_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/Matchday/MatchArena.tscn")
