extends Node

## Reusable cinematic interaction layer for the Football World.
## One full-screen interaction at a time; all choices can later be wired to the backend.

signal interaction_started(kind: String, payload: Dictionary)
signal decision_made(kind: String, decision: String, payload: Dictionary)
signal interaction_closed(kind: String)

var layer: CanvasLayer
var backdrop: ColorRect
var scene_root: Control
var left_actor: Panel
var right_actor: Panel
var title_label: Label
var subtitle_label: Label
var dialogue_label: Label
var choice_box: VBoxContainer
var close_button: Button
var current_kind := ""
var current_payload: Dictionary = {}

func _ready() -> void:
	_build_layer()
	set_process_input(true)

func _build_layer() -> void:
	layer = CanvasLayer.new()
	layer.layer = 100
	add_child(layer)

	scene_root = Control.new()
	scene_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(scene_root)
	scene_root.visible = false

	backdrop = ColorRect.new()
	backdrop.color = Color(0.015, 0.025, 0.05, 0.97)
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scene_root.add_child(backdrop)

	var top := VBoxContainer.new()
	top.position = Vector2(70, 42)
	top.size = Vector2(1140, 90)
	scene_root.add_child(top)

	title_label = Label.new()
	title_label.add_theme_font_size_override("font_size", 32)
	title_label.text = "CLUB OFFICE"
	top.add_child(title_label)

	subtitle_label = Label.new()
	subtitle_label.add_theme_font_size_override("font_size", 18)
	subtitle_label.modulate = Color(0.72, 0.78, 0.88)
	top.add_child(subtitle_label)

	left_actor = _actor_panel("YOU")
	left_actor.position = Vector2(70, 190)
	left_actor.size = Vector2(300, 360)
	scene_root.add_child(left_actor)

	right_actor = _actor_panel("MANAGER / PLAYER")
	right_actor.position = Vector2(910, 190)
	right_actor.size = Vector2(300, 360)
	scene_root.add_child(right_actor)

	var dialogue_panel := Panel.new()
	dialogue_panel.position = Vector2(410, 185)
	dialogue_panel.size = Vector2(460, 165)
	scene_root.add_child(dialogue_panel)

	dialogue_label = Label.new()
	dialogue_label.position = Vector2(24, 20)
	dialogue_label.size = Vector2(412, 125)
	dialogue_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dialogue_label.add_theme_font_size_override("font_size", 20)
	dialogue_panel.add_child(dialogue_label)

	choice_box = VBoxContainer.new()
	choice_box.position = Vector2(410, 375)
	choice_box.size = Vector2(460, 230)
	choice_box.add_theme_constant_override("separation", 10)
	scene_root.add_child(choice_box)

	close_button = Button.new()
	close_button.text = "CLOSE"
	close_button.position = Vector2(1060, 640)
	close_button.size = Vector2(150, 48)
	close_button.pressed.connect(_close)
	scene_root.add_child(close_button)

func _actor_panel(actor_name: String) -> Panel:
	var panel := Panel.new()
	var box := VBoxContainer.new()
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 18)
	panel.add_child(box)

	var portrait := ColorRect.new()
	portrait.color = Color(0.08, 0.12, 0.2, 1)
	portrait.custom_minimum_size = Vector2(0, 245)
	box.add_child(portrait)

	var silhouette := Label.new()
	silhouette.text = "PERSON\n\nPORTRAIT"
	silhouette.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	silhouette.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	silhouette.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	silhouette.add_theme_font_size_override("font_size", 24)
	portrait.add_child(silhouette)

	var name_label := Label.new()
	name_label.text = actor_name
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 19)
	box.add_child(name_label)
	return panel

func _show(kind: String, title: String, subtitle: String, speaker: String, dialogue: String, choices: Array[String], payload: Dictionary = {}) -> void:
	current_kind = kind
	current_payload = payload
	interaction_started.emit(kind, payload)

	title_label.text = title
	subtitle_label.text = subtitle
	dialogue_label.text = speaker + "\n\n\"" + dialogue + "\""

	for child in choice_box.get_children():
		child.queue_free()
	for choice in choices:
		var button := Button.new()
		button.text = choice
		button.custom_minimum_size = Vector2(460, 48)
		button.add_theme_font_size_override("font_size", 17)
		button.pressed.connect(_choose.bind(choice))
		choice_box.add_child(button)

	scene_root.visible = true
	scene_root.modulate.a = 0.0
	scene_root.scale = Vector2(0.96, 0.96)
	var tween := create_tween().set_parallel(true)
	tween.tween_property(scene_root, "modulate:a", 1.0, 0.28)
	tween.tween_property(scene_root, "scale", Vector2.ONE, 0.32).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

func _choose(decision: String) -> void:
	decision_made.emit(current_kind, decision, current_payload)
	_show_result(decision)

func _show_result(decision: String) -> void:
	for child in choice_box.get_children():
		child.queue_free()
	var result := Label.new()
	result.text = "DECISION RECORDED\n\n" + decision
	result.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	result.custom_minimum_size = Vector2(460, 105)
	result.add_theme_font_size_override("font_size", 22)
	choice_box.add_child(result)

	var continue_button := Button.new()
	continue_button.text = "CONTINUE"
	continue_button.custom_minimum_size = Vector2(460, 52)
	continue_button.pressed.connect(_close)
	choice_box.add_child(continue_button)

func _close() -> void:
	var kind := current_kind
	var tween := create_tween()
	tween.tween_property(scene_root, "modulate:a", 0.0, 0.2)
	tween.tween_callback(func():
		scene_root.visible = false
		interaction_closed.emit(kind)
	)

func play_player_negotiation(player_name: String, payload: Dictionary = {}) -> void:
	_show("player_negotiation", "PLAYER NEGOTIATION", "Transfer fee • salary • contract • release clause", "PLAYER / AGENT", "We are interested, but the contract and playing-time offer need to make sense.", ["IMPROVE SALARY", "OFFER LONGER CONTRACT", "PROMISE STARTING ROLE", "MAKE FINAL OFFER", "WALK AWAY"], payload.merged({"player": player_name}))

func play_manager_negotiation(manager_name: String, payload: Dictionary = {}) -> void:
	_show("manager_negotiation", "MANAGER NEGOTIATION", "Salary • contract • tactical control • objectives", "MANAGER", "I want to understand your project before I agree to become your manager.", ["IMPROVE SALARY", "OFFER LONG CONTRACT", "GIVE TACTICAL CONTROL", "SET CLUB OBJECTIVES", "WALK AWAY"], payload.merged({"manager": manager_name}))

func play_manager_talk(payload: Dictionary = {}) -> void:
	_show("manager_talk", "MANAGER MEETING", "Performance review • morale • tactics", "MANAGER", "Results have not been good enough. We need to decide how we respond together.", ["BACK THE MANAGER", "DEMAND BETTER RESULTS", "CHANGE TACTICAL PLAN", "DISCUSS NEW SIGNINGS", "CHANGE TRAINING"], payload)

func play_transfer_request(manager_name: String, recommendations: Array = [], payload: Dictionary = {}) -> void:
	var names: Array[String] = []
	for item in recommendations.slice(0, 3):
		names.append(str(item))
	var recommendation_text := "I have prepared a shortlist for the new transfer window."
	if not names.is_empty():
		recommendation_text += "\n\nPriority targets: " + ", ".join(names)
	_show("transfer_request", "TRANSFER WINDOW", "Manager recruitment request", manager_name, recommendation_text, ["APPROVE ALL", "APPROVE SELECTED", "SHOW ALTERNATIVES", "REJECT REQUEST"], payload.merged({"recommendations": names}))

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and scene_root.visible:
		_close()
