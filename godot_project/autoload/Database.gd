extends Node

# Database of pre-seeded players and teams
var all_players: Array[PlayerData] = []
var all_teams: Dictionary = {}

func _ready() -> void:
	_init_teams()
	_init_players()

func _init_teams() -> void:
	var team_defs = [
		{"name": "Real Madrid", "emoji": "👑", "budget": 140.0, "primary": Color(0.95, 0.95, 0.95), "secondary": Color(0.85, 0.7, 0.2)},
		{"name": "Barcelona", "emoji": "🔵🔴", "budget": 110.0, "primary": Color(0.6, 0.1, 0.1), "secondary": Color(0.1, 0.2, 0.5)},
		{"name": "Manchester City", "emoji": "🏙️", "budget": 150.0, "primary": Color(0.4, 0.7, 0.95), "secondary": Color(0.1, 0.1, 0.2)},
		{"name": "Bayern Munich", "emoji": "🛡️", "budget": 130.0, "primary": Color(0.85, 0.15, 0.15), "secondary": Color(1.0, 1.0, 1.0)},
		{"name": "Arsenal", "emoji": "🔴⚪", "budget": 115.0, "primary": Color(0.9, 0.2, 0.2), "secondary": Color(1.0, 1.0, 1.0)},
		{"name": "Liverpool", "emoji": "🦅", "budget": 120.0, "primary": Color(0.75, 0.1, 0.1), "secondary": Color(0.1, 0.7, 0.4)},
		{"name": "Paris Saint-Germain", "emoji": "🗼", "budget": 145.0, "primary": Color(0.1, 0.2, 0.5), "secondary": Color(0.8, 0.1, 0.1)},
		{"name": "Juventus", "emoji": "🦓", "budget": 100.0, "primary": Color(0.1, 0.1, 0.1), "secondary": Color(0.9, 0.9, 0.9)}
	]
	
	for def in team_defs:
		var team = TeamData.new()
		team.name = def.name
		team.logo_emoji = def.emoji
		team.budget = def.budget
		team.primary_color = def.primary
		team.secondary_color = def.secondary
		team.form = ["W", "W", "D", "W", "L"]
		all_teams[team.name] = team

func _init_players() -> void:
	var seed_data = [
		{"name": "Kylian Mbappé", "pos": "CF", "ovr": 92, "pac": 97, "sho": 90, "pas": 80, "price": 28.5},
		{"name": "Erling Haaland", "pos": "CF", "ovr": 91, "pac": 89, "sho": 93, "pas": 70, "price": 26.0},
		{"name": "Vinícius Júnior", "pos": "LW", "ovr": 90, "pac": 95, "sho": 84, "pas": 81, "price": 24.0},
		{"name": "Jude Bellingham", "pos": "AMF", "ovr": 90, "pac": 82, "sho": 86, "pas": 88, "price": 25.0},
		{"name": "Rodri", "pos": "DMF", "ovr": 91, "pac": 68, "sho": 80, "pas": 90, "price": 22.0},
		{"name": "Kevin De Bruyne", "pos": "CMF", "ovr": 91, "pac": 72, "sho": 88, "pas": 94, "price": 21.0},
		{"name": "Lamine Yamal", "pos": "RW", "ovr": 86, "pac": 91, "sho": 80, "pas": 85, "price": 20.0},
		{"name": "Mohamed Salah", "pos": "RW", "ovr": 89, "pac": 88, "sho": 87, "pas": 84, "price": 21.0},
		{"name": "Virgil van Dijk", "pos": "CB", "ovr": 89, "pac": 76, "sho": 60, "pas": 75, "price": 18.0},
		{"name": "Antonio Rüdiger", "pos": "CB", "ovr": 87, "pac": 84, "sho": 55, "pas": 71, "price": 16.0},
		{"name": "Achraf Hakimi", "pos": "RB", "ovr": 86, "pac": 92, "sho": 75, "pas": 80, "price": 17.0},
		{"name": "Théo Hernandez", "pos": "LB", "ovr": 86, "pac": 93, "sho": 74, "pas": 78, "price": 16.5},
		{"name": "Thibaut Courtois", "pos": "GK", "ovr": 90, "pac": 50, "sho": 30, "pas": 65, "price": 17.5},
		{"name": "Alisson Becker", "pos": "GK", "ovr": 89, "pac": 52, "sho": 32, "pas": 70, "price": 16.0},
		{"name": "Bukayo Saka", "pos": "RW", "ovr": 88, "pac": 88, "sho": 84, "pas": 83, "price": 20.0},
		{"name": "Declan Rice", "pos": "DMF", "ovr": 88, "pac": 75, "sho": 76, "pas": 84, "price": 19.0}
	]
	
	for d in seed_data:
		var p = PlayerData.new()
		p.id = d.name.to_lower().replace(" ", "_")
		p.name = d.name
		p.position = d.pos
		p.rating = d.ovr
		p.pace = d.pac
		p.shooting = d.sho
		p.passing = d.pas
		p.base_price = d.price
		all_players.append(p)
