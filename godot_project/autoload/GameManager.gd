extends Node

# Core game signals
signal budget_changed(new_budget: float)
signal player_bought(player: PlayerData, team_name: String, price: float)
signal match_finished(fixture: FixtureData)
signal round_advanced(round_num: int)

# Football World interaction signals
signal player_negotiation_requested(player_name: String, payload: Dictionary)
signal manager_negotiation_requested(manager_name: String, payload: Dictionary)
signal manager_talk_requested(payload: Dictionary)
signal transfer_window_request_requested(payload: Dictionary)

# Active user state
var user_team: TeamData
var current_season: int = 1
var current_round: int = 1
var fixtures: Array[FixtureData] = []
var manager_name: String = "Athul V V"
var manager_relationship: int = 75
var recent_results: Array[String] = ["W", "W", "D", "W", "W"]
var transfer_window_open: bool = true
var transfer_request_shown_season: int = 0

func _ready() -> void:
	_setup_user_team()
	_generate_fixtures()

func _setup_user_team() -> void:
	user_team = TeamData.new()
	user_team.name = "Athul FC"
	user_team.manager = manager_name
	user_team.logo_emoji = "👑"
	user_team.budget = 120.0
	user_team.is_user_team = true
	user_team.form = recent_results.duplicate()
	Database.all_teams[user_team.name] = user_team

func _generate_fixtures() -> void:
	fixtures.clear()
	var team_names = Database.all_teams.keys()
	if team_names.is_empty():
		return

	for i in range(team_names.size()):
		for j in range(i + 1, team_names.size()):
			var f = FixtureData.new()
			f.home_team = team_names[i]
			f.away_team = team_names[j]
			f.round_number = (i + j) % 5 + 1
			fixtures.append(f)

func purchase_player(player: PlayerData, team_name: String, price: float) -> bool:
	if not Database.all_teams.has(team_name):
		return false
	var team: TeamData = Database.all_teams[team_name]
	if team.budget < price:
		return false

	team.budget -= price
	player.is_sold = true
	player.sold_price = price
	player.sold_to = team_name
	player.current_club = team_name
	team.squad.append(player)

	if team.is_user_team:
		budget_changed.emit(team.budget)
	player_bought.emit(player, team_name, price)
	return true

func simulate_fixture(fixture: FixtureData) -> void:
	var home_team_data: TeamData = Database.all_teams.get(fixture.home_team)
	var away_team_data: TeamData = Database.all_teams.get(fixture.away_team)

	var h_score = randi_range(0, 4)
	var a_score = randi_range(0, 3)

	if randf() > 0.4:
		h_score += 1

	fixture.home_score = h_score
	fixture.away_score = a_score
	fixture.played = true

	if home_team_data:
		home_team_data.add_match_result(h_score, a_score)
	if away_team_data:
		away_team_data.add_match_result(a_score, h_score)

	if fixture.home_team == user_team.name or fixture.away_team == user_team.name:
		var result := _result_for_user(fixture)
		recent_results.push_front(result)
		if recent_results.size() > 5:
			recent_results.pop_back()
		user_team.form = recent_results.duplicate()
		_check_underperformance()

	match_finished.emit(fixture)

func _result_for_user(fixture: FixtureData) -> String:
	if fixture.home_team == user_team.name:
		if fixture.home_score > fixture.away_score:
			return "W"
		if fixture.home_score < fixture.away_score:
			return "L"
		return "D"
	if fixture.away_score > fixture.home_score:
		return "W"
	if fixture.away_score < fixture.home_score:
		return "L"
	return "D"

func _check_underperformance() -> void:
	var losses := 0
	for result in recent_results:
		if result == "L":
			losses += 1
	if losses >= 3 or (recent_results.size() >= 5 and not recent_results.has("W")):
		request_manager_talk({
			"reason": "underperformance",
			"form": recent_results.duplicate(),
			"manager": manager_name,
			"relationship": manager_relationship
		})

func request_player_negotiation(player_name: String, details: Dictionary = {}) -> void:
	player_negotiation_requested.emit(player_name, details)
	InteractionCinematics.play_player_negotiation(player_name, details)

func request_manager_negotiation(candidate_manager: String, details: Dictionary = {}) -> void:
	manager_negotiation_requested.emit(candidate_manager, details)
	InteractionCinematics.play_manager_negotiation(candidate_manager, details)

func request_manager_talk(details: Dictionary = {}) -> void:
	manager_talk_requested.emit(details)
	InteractionCinematics.play_manager_talk(details)

func request_transfer_window_meeting(recommendations: Array = [], details: Dictionary = {}) -> void:
	if not transfer_window_open:
		return
	if transfer_request_shown_season == current_season:
		return
	transfer_request_shown_season = current_season
	var payload := details.duplicate()
	payload["season"] = current_season
	transfer_window_request_requested.emit(payload)
	InteractionCinematics.play_transfer_request(manager_name, recommendations, payload)

func set_transfer_window(open: bool) -> void:
	transfer_window_open = open
	if open:
		# The caller can pass manager recommendations from the Football World backend.
		request_transfer_window_meeting([], {"trigger": "window_open"})

func adjust_manager_relationship(amount: int) -> void:
	manager_relationship = clampi(manager_relationship + amount, 0, 100)
