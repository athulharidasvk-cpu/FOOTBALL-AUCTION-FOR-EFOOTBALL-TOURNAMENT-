class_name TeamData
extends Resource

@export var name: String = "Athul FC"
@export var manager: String = "Athul V V"
@export var logo_emoji: String = "👑"
@export var primary_color: Color = Color(0.01, 0.52, 0.78, 1.0) # Sky blue
@export var secondary_color: Color = Color(0.98, 0.8, 0.08, 1.0) # Gold
@export var budget: float = 120.0 # In ₹ Crores
@export var is_user_team: bool = false
@export var squad: Array[PlayerData] = []
@export var formation: String = "4-3-3"
@export var division: int = 1

# Performance stats
@export var played: int = 0
@export var won: int = 0
@export var drawn: int = 0
@export var lost: int = 0
@export var goals_for: int = 0
@export var goals_against: int = 0
@export var points: int = 0
@export var form: Array[String] = [] # Last 5 results: ["W", "W", "D", "L", "W"]

func get_goal_difference() -> int:
	return goals_for - goals_against

func add_match_result(scored: int, conceded: int) -> void:
	played += 1
	goals_for += scored
	goals_against += conceded
	
	var result_char = "D"
	if scored > conceded:
		won += 1
		points += 3
		result_char = "W"
	elif scored < conceded:
		lost += 1
		result_char = "L"
	else:
		drawn += 1
		points += 1
		result_char = "D"
	
	form.push_front(result_char)
	if form.size() > 5:
		form.pop_back()

func get_momentum_score() -> int:
	if form.is_empty():
		return 50
	
	var weights = [35, 25, 18, 12, 10]
	var raw = 0.0
	for i in range(form.size()):
		var w = weights[i] if i < weights.size() else 10
		if form[i] == "W":
			raw += w * 1.0
		elif form[i] == "D":
			raw += w * 0.4
	
	# Streak bonus / penalty
	var streak_count = 0
	var streak_char = form[0]
	for res in form:
		if res == streak_char:
			streak_count += 1
		else:
			break
			
	if streak_char == "W" and streak_count >= 2:
		raw += streak_count * 4.0
	elif streak_char == "L" and streak_count >= 2:
		raw -= streak_count * 4.0
		
	return int(clamp(raw, 5.0, 100.0))

func get_streak_text() -> String:
	if form.is_empty():
		return "No Matches"
	var streak_count = 0
	var streak_char = form[0]
	for res in form:
		if res == streak_char:
			streak_count += 1
		else:
			break
	if streak_char == "W" and streak_count >= 2:
		return "🔥 %dW STREAK" % streak_count
	elif streak_char == "L" and streak_count >= 2:
		return "❄️ %dL SLUMP" % streak_count
	elif not "L" in form and form.size() >= 3:
		return "🛡️ UNBEATEN"
	return "⚖️ STEADY"
