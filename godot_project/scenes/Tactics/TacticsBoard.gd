extends Control

@onready var formation_btn_433: Button = $VBox/Header/Formations/Btn433
@onready var formation_btn_4231: Button = $VBox/Header/Formations/Btn4231
@onready var formation_btn_352: Button = $VBox/Header/Formations/Btn352
@onready var squad_list: ItemList = $VBox/MainSplit/SquadPanel/SquadVBox/SquadItemList
@onready var tactics_canvas: Control = $VBox/MainSplit/PitchPanel/TacticsPitch
@onready var squad_summary_lbl: Label = $VBox/MainSplit/SquadPanel/SquadVBox/SummaryLabel

var active_formation: String = "4-3-3"

var formation_coords = {
	"4-3-3": [
		Vector2(0.1, 0.5), # GK
		Vector2(0.28, 0.18), Vector2(0.28, 0.38), Vector2(0.28, 0.62), Vector2(0.28, 0.82), # Back 4
		Vector2(0.52, 0.5), Vector2(0.55, 0.28), Vector2(0.55, 0.72), # Midfield 3
		Vector2(0.82, 0.2), Vector2(0.86, 0.5), Vector2(0.82, 0.8) # Front 3
	],
	"4-2-3-1": [
		Vector2(0.1, 0.5),
		Vector2(0.28, 0.18), Vector2(0.28, 0.38), Vector2(0.28, 0.62), Vector2(0.28, 0.82),
		Vector2(0.46, 0.36), Vector2(0.46, 0.64), # 2 CDMs
		Vector2(0.68, 0.18), Vector2(0.68, 0.5), Vector2(0.68, 0.82), # 3 AMs
		Vector2(0.86, 0.5) # 1 ST
	],
	"3-5-2": [
		Vector2(0.1, 0.5),
		Vector2(0.28, 0.26), Vector2(0.28, 0.5), Vector2(0.28, 0.74), # Back 3
		Vector2(0.52, 0.15), Vector2(0.52, 0.36), Vector2(0.52, 0.5), Vector2(0.52, 0.64), Vector2(0.52, 0.85), # Midfield 5
		Vector2(0.82, 0.38), Vector2(0.82, 0.62) # 2 STs
	]
}

func _ready() -> void:
	_populate_squad()
	tactics_canvas.draw.connect(_on_pitch_draw)

func _populate_squad() -> void:
	squad_list.clear()
	var squad = GameManager.user_team.squad
	
	# If squad is empty, add standard default stars
	if squad.is_empty():
		for i in range(min(11, Database.all_players.size())):
			var p = Database.all_players[i]
			p.is_sold = true
			p.sold_to = GameManager.user_team.name
			squad.append(p)
			
	for p in squad:
		squad_list.add_item("%s [%s] OVR: %d" % [p.name, p.position, p.rating])
		
	squad_summary_lbl.text = "Squad Count: %d Players" % squad.size()

func _on_pitch_draw() -> void:
	var rect = tactics_canvas.get_rect()
	var w = rect.size.x
	var h = rect.size.y
	
	# Grass
	tactics_canvas.draw_rect(Rect2(0, 0, w, h), Color(0.1, 0.38, 0.18, 1.0), true)
	tactics_canvas.draw_rect(Rect2(8, 8, w - 16, h - 16), Color(1, 1, 1, 0.3), false, 2.0)
	tactics_canvas.draw_line(Vector2(w / 2, 8), Vector2(w / 2, h - 8), Color(1, 1, 1, 0.3), 2.0)
	tactics_canvas.draw_arc(Vector2(w / 2, h / 2), 40.0, 0, TAU, 32, Color(1, 1, 1, 0.3), 2.0)
	
	# Draw Formation Nodes
	var coords = formation_coords.get(active_formation, formation_coords["4-3-3"])
	for i in range(coords.size()):
		var norm_pos = coords[i]
		var pos = Vector2(norm_pos.x * w, norm_pos.y * h)
		
		# Draw node circle
		tactics_canvas.draw_circle(pos, 16.0, Color(0.01, 0.52, 0.78, 1.0))
		tactics_canvas.draw_arc(pos, 16.0, 0, TAU, 24, Color(0.98, 0.8, 0.08, 1.0), 2.0)
		
		# Number label
		tactics_canvas.draw_string(ThemeDB.fallback_font, pos + Vector2(-4, 4), str(i + 1), HORIZONTAL_ALIGNMENT_CENTER, -1, 12, Color.WHITE)

func _set_formation(f_key: String) -> void:
	active_formation = f_key
	tactics_canvas.queue_redraw()

func _on_btn_433_pressed() -> void:
	_set_formation("4-3-3")

func _on_btn_4231_pressed() -> void:
	_set_formation("4-2-3-1")

func _on_btn_352_pressed() -> void:
	_set_formation("3-5-2")

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
