extends Control

@onready var clock_lbl: Label = $VBox/Scoreboard/Clock
@onready var home_name_lbl: Label = $VBox/Scoreboard/HomeTeam/Name
@onready var away_name_lbl: Label = $VBox/Scoreboard/AwayTeam/Name
@onready var score_lbl: Label = $VBox/Scoreboard/ScoreBox/ScoreText
@onready var home_momentum_lbl: Label = $VBox/Scoreboard/HomeTeam/MomentumBadge
@onready var away_momentum_lbl: Label = $VBox/Scoreboard/AwayTeam/MomentumBadge
@onready var home_streak_lbl: Label = $VBox/Scoreboard/HomeTeam/StreakBadge
@onready var away_streak_lbl: Label = $VBox/Scoreboard/AwayTeam/StreakBadge
@onready var commentary_box: RichTextLabel = $VBox/BottomSplit/CommentaryPanel/Feed
@onready var pitch_draw: Control = $VBox/BottomSplit/PitchPanel/PitchCanvas
@onready var match_timer: Timer = $MatchTimer
@onready var btn_play: Button = $VBox/Controls/BtnPlay

var current_minute: int = 0
var home_score: int = 0
var away_score: int = 0
var is_running: bool = false
var ball_pos: Vector2 = Vector2(0.5, 0.5) # Normalized (0..1)
var home_team: TeamData
var away_team: TeamData

func _ready() -> void:
	_setup_match()
	match_timer.timeout.connect(_on_tick)
	pitch_draw.draw.connect(_on_pitch_draw)

func _setup_match() -> void:
	home_team = GameManager.user_team
	away_team = Database.all_teams.get("Manchester City", Database.all_teams.values()[0])
	
	home_name_lbl.text = "%s %s" % [home_team.logo_emoji, home_team.name]
	away_name_lbl.text = "%s %s" % [away_team.name, away_team.logo_emoji]
	
	# Update Momentum & Streak Badges
	home_momentum_lbl.text = "⚡ %d%% MOMENTUM" % home_team.get_momentum_score()
	home_streak_lbl.text = home_team.get_streak_text()
	
	away_momentum_lbl.text = "⚡ %d%% MOMENTUM" % away_team.get_momentum_score()
	away_streak_lbl.text = away_team.get_streak_text()
	
	commentary_box.append_text("[color=cyan]🏟️ Matchday Kick-Off! Both teams take the pitch.[/color]\n")
	commentary_box.append_text("[color=gold]Home Form: %s | Away Form: %s[/color]\n" % [", ".join(home_team.form), ", ".join(away_team.form)])

func _on_tick() -> void:
	current_minute += 1
	clock_lbl.text = "%d'" % current_minute
	
	# Move ball randomly across the pitch
	var target_x = randf_range(0.1, 0.9)
	var target_y = randf_range(0.15, 0.85)
	ball_pos = ball_pos.lerp(Vector2(target_x, target_y), 0.4)
	pitch_draw.queue_redraw()
	
	# Random match event
	if current_minute % 7 == 0:
		_simulate_event()
		
	if current_minute >= 90:
		match_timer.stop()
		is_running = false
		btn_play.text = "▶️ Restart"
		commentary_box.append_text("[b][color=yellow]🏁 FULL-TIME WHISTLE! Final: %d - %d[/color][/b]\n" % [home_score, away_score])
		home_team.add_match_result(home_score, away_score)
		away_team.add_match_result(away_score, home_score)
		# Re-evaluate momentum after match
		home_momentum_lbl.text = "⚡ %d%% MOMENTUM" % home_team.get_momentum_score()
		home_streak_lbl.text = home_team.get_streak_text()

func _simulate_event() -> void:
	var roll = randf()
	if roll < 0.18: # Goal!
		var is_home = randf() > 0.45
		if is_home:
			home_score += 1
			commentary_box.append_text("[b][color=green]⚽ GOAL! %s breaks the deadlock! (%d')[/color][/b]\n" % [home_team.name, current_minute])
		else:
			away_score += 1
			commentary_box.append_text("[b][color=orange]⚽ GOAL! %s strikes clinical finish! (%d')[/color][/b]\n" % [away_team.name, current_minute])
		score_lbl.text = "%d - %d" % [home_score, away_score]
	elif roll < 0.4:
		commentary_box.append_text("[color=gray]💥 Fierce attempt saved by the keeper at %d'![/color]\n" % current_minute)
	elif roll < 0.6:
		commentary_box.append_text("[color=yellow]🟨 Tactical foul awarded free-kick (%d')[/color]\n" % current_minute)

func _on_pitch_draw() -> void:
	var rect = pitch_draw.get_rect()
	var w = rect.size.x
	var h = rect.size.y
	
	# Pitch outline
	pitch_draw.draw_rect(Rect2(0, 0, w, h), Color(0.12, 0.45, 0.22, 1.0), true) # Grass
	pitch_draw.draw_rect(Rect2(10, 10, w - 20, h - 20), Color(1, 1, 1, 0.4), false, 2.0) # Boundary
	pitch_draw.draw_line(Vector2(w / 2, 10), Vector2(w / 2, h - 10), Color(1, 1, 1, 0.4), 2.0) # Halfway line
	pitch_draw.draw_arc(Vector2(w / 2, h / 2), 40.0, 0, TAU, 32, Color(1, 1, 1, 0.4), 2.0) # Center circle
	
	# Ball
	var screen_ball = Vector2(ball_pos.x * w, ball_pos.y * h)
	pitch_draw.draw_circle(screen_ball, 6.0, Color(1.0, 0.9, 0.1, 1.0))

func _on_btn_play_pressed() -> void:
	if current_minute >= 90:
		current_minute = 0
		home_score = 0
		away_score = 0
		score_lbl.text = "0 - 0"
		clock_lbl.text = "0'"
	
	is_running = not is_running
	if is_running:
		match_timer.start(0.4) # Fast match ticks
		btn_play.text = "⏸️ Pause"
	else:
		match_timer.stop()
		btn_play.text = "▶️ Play"

func _on_btn_speed_pressed() -> void:
	if match_timer.wait_time > 0.2:
		match_timer.wait_time = 0.15
	else:
		match_timer.wait_time = 0.4

func _on_back_pressed() -> void:
	match_timer.stop()
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
