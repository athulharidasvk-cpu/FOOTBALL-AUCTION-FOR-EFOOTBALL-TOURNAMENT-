class_name FixtureData
extends Resource

@export var round_number: int = 1
@export var home_team: String = ""
@export var away_team: String = ""
@export var home_score: int = 0
@export var away_score: int = 0
@export var played: bool = false
@export var is_rivalry: bool = false
@export var rivalry_name: String = ""
@export var events: Array[Dictionary] = [] # [{ "minute": 23, "type": "goal", "player": "...", "team": "..." }]
