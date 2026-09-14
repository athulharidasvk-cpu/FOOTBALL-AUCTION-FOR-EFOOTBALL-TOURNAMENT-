extends Node

# Signals
signal budget_changed(new_budget: float)
signal player_bought(player: PlayerData, team_name: String, price: float)
signal match_finished(fixture: FixtureData)
signal round_advanced(round_num: int)

# Active user state
var user_team: TeamData
var current_season: int = 1
var current_round: int = 1
var fixtures: Array[FixtureData] = []

func _ready() -> void:
	_setup_user_team()
	_generate_fixtures()

func _setup_user_team() -> void:
	user_team = TeamData.new()
	user_team.name = "Athul FC"
	user_team.manager = "Athul V V"
	user_team.logo_emoji = "👑"
	user_team.budget = 120.0
	user_team.is_user_team = true
	user_team.form = ["W", "W", "D", "W", "W"] # High momentum
	Database.all_teams[user_team.name] = user_team

func _generate_fixtures() -> void:
	fixtures.clear()
	var team_names = Database.all_teams.keys()
	if team_names.is_empty():
		return
		
	# Simple match schedule
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
	
	# Slight home advantage
	if randf() > 0.4:
		h_score += 1
		
	fixture.home_score = h_score
	fixture.away_score = a_score
	fixture.played = true
	
	if home_team_data:
		home_team_data.add_match_result(h_score, a_score)
	if away_team_data:
		away_team_data.add_match_result(a_score, h_score)
		
	match_finished.emit(fixture)
